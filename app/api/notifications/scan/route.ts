import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server_user"; // Client user biasa untuk cek otentikasi
import { createClient as createSupabaseClient } from "@supabase/supabase-js"; // Instance Admin

// Inisialisasi Supabase Admin dengan Service Role (Bypass RLS secara aman di server)
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month") || "") : null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year") || "") : null;
    const caseId = parseInt(searchParams.get("caseId") || "");

    // [PENYESUAIAN]: Jika Case ID bukan 4 (Pesan Bebas), parameter bulan & tahun wajib ada.
    // Jika Case ID adalah 4, parameter bulan & tahun opsional karena kita akan menarik seluruh kelompok.
    if (!caseId || (caseId !== 4 && (!month || !year))) {
      return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
    }

    // 1. Dapatkan user yang sedang login saat ini menggunakan client biasa
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login kembali." }, { status: 401 });
    }

    // 2. Tarik profil admin desa yang sedang login menggunakan supabaseAdmin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("profile")
      .select("role, village_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !adminProfile) {
      return NextResponse.json({ error: "Profil admin tidak ditemukan." }, { status: 404 });
    }

    // Proteksi Tambahan: Hanya izinkan role admin_desa atau lebih tinggi
    const allowedRoles = ["admin_desa", "admin_daerah", "superadmin"];
    if (!allowedRoles.includes(adminProfile.role)) {
      return NextResponse.json({ error: "Anda tidak memiliki hak akses untuk melakukan siaran." }, { status: 403 });
    }

    // 3. Tarik semua profil 'admin_kelompok' di bawah desa (village_id) milik admin yang login
    const { data: kelompokAdmins, error: adminError } = await supabaseAdmin
      .from("profile")
      .select("user_id, full_name, group_id, group(name)")
      .eq("role", "admin_kelompok")
      .eq("village_id", adminProfile.village_id);

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    if (!kelompokAdmins || kelompokAdmins.length === 0) {
      return NextResponse.json({ targets: [] });
    }

    // [PENYESUAIAN BARU]: Jika caseId === 4 (Pesan Bebas / Kustom), 
    // langsung kembalikan semua admin kelompok tanpa memfilter laporan kosong.
    if (caseId === 4) {
      const targets = kelompokAdmins.map((admin: any) => ({
        id: admin.user_id,
        name: admin.full_name,
        kelompok_name: admin.group?.name || "Kelompok Tanpa Nama",
        email: "-" // Email disembunyikan / opsional
      }));

      return NextResponse.json({ targets });
    }

    // 4. Pilih tabel pengecekan laporan berdasarkan Case aktif (Hanya untuk Case 1, 2, 3)
    const reportTable = caseId === 1 ? "meeting_reports" : 
                        caseId === 2 ? "attendance_recap" : "evaluation_recap";

    // 5. Tarik laporan yang sudah disetorkan pada periode terpilih
    const { data: submittedReports, error: reportError } = await supabaseAdmin
      .from(reportTable)
      .select("group_id")
      .eq("period_month", month)
      .eq("period_year", year);

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    const submittedGroupIds = new Set(submittedReports?.map(r => Number(r.group_id)) || []);

    // 6. Saring kelompok yang BELUM melapor (tidak ada di submittedGroupIds)
    const missingAdmins = kelompokAdmins.filter(
      (admin: any) => admin.group_id && !submittedGroupIds.has(Number(admin.group_id))
    );

    // 7. Format data target untuk dikirim ke frontend
    const targets = missingAdmins.map((admin: any) => ({
      id: admin.user_id,
      name: admin.full_name,
      kelompok_name: admin.group?.name || "Kelompok Tanpa Nama",
      email: "-" // Email disembunyikan / opsional
    }));

    return NextResponse.json({ targets });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}