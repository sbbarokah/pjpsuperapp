"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { CreateKbmReportDto, KbmDetailContext, KbmDetailData, KbmReportModel, KbmReportWithRelations } from "@/lib/types/report.types";
import { Profile } from "../types/user.types";
import { validateUserRole } from "./authService";
import { CategoryModel } from "../types/master.types";
import { AttendanceRecapModel } from "../types/attendance.types";
import { EvaluationRecapModel } from "../types/evaluation.types";

/**
 * Membuat Laporan KBM baru di database.
 * Ini dipanggil oleh Server Action, bukan langsung oleh klien.
 *
 * @param payload Data laporan dari form
 * @param author_user_id ID pengguna (admin) yang membuat laporan
 * @param village_id ID desa dari admin yang membuat laporan
 */
export async function createKbmReport(
  payload: CreateKbmReportDto,
  author_user_id: string,
  village_id: string,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("kbm_reports") // NAMA TABEL BARU ANDA
    .insert({
      ...payload,
      author_user_id: author_user_id,
      village_id: village_id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating KBM report:", error.message);
    return { error: error.message };
  }

  return { success: true, data: data };
}

/**
 * --------------------------------------------------------------------
 * UNTUK ADMIN KELOMPOK
 * --------------------------------------------------------------------
 * Mengambil daftar laporan KBM yang dibuat oleh grup milik admin.
 * Bergabung dengan tabel 'category' untuk mendapatkan nama.
 */
export async function getReportsForGroup(profile: Profile) {
  // 1. Validasi
  await validateUserRole(["admin_kelompok"]);
  if (!profile.group_id) {
    throw new Error("Profil admin grup tidak tertaut ke grup manapun.");
  }

  // 2. Eksekusi
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kbm_reports")
    .select("*, category:category_id (name)") // Join dengan tabel kategori
    .eq("group_id", profile.group_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil laporan grup: ${error.message}`);
  }

  return data as KbmReportWithRelations[];
}

/**
 * Tipe data untuk hasil agregasi
 */
export type AggregatedPeriod = {
  period_month: number;
  period_year: number;
};

/**
 * Mengambil satu laporan KBM berdasarkan ID.
 * Hanya untuk penggunaan di Server Component.
 */
export async function getKbmReportById(
  reportId: string,
): Promise<KbmReportModel | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kbm_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error) {
    console.error("Error fetching report by ID:", error.message);
    return null;
  }

  return data as KbmReportModel;
}

/**
 * --------------------------------------------------------------------
 * UNTUK ADMIN DESA
 * --------------------------------------------------------------------
 * Mengambil daftar PERIODE (Bulan/Tahun) yang unik
 * dari laporan yang ada di desanya.
 */
export async function getAggregatedReportsForVillage(profile: Profile) {
  // 1. Validasi
  await validateUserRole(["admin_desa"]);
  if (!profile.village_id) {
    throw new Error("Profil admin desa tidak tertaut ke desa manapun.");
  }

  // 2. Eksekusi
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kbm_reports")
    .select("period_month, period_year")
    .eq("village_id", profile.village_id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil agregat laporan: ${error.message}`);
  }

  // 3. De-duplikasi
  // 'data' mungkin berisi: [ {11, 2025}, {11, 2025}, {10, 2025} ]
  // Kita perlu: [ {11, 2025}, {10, 2025} ]
  const uniquePeriods = new Map<string, AggregatedPeriod>();
  data.forEach((item) => {
    const key = `${item.period_year}-${item.period_month}`;
    if (!uniquePeriods.has(key)) {
      uniquePeriods.set(key, item);
    }
  });

  return Array.from(uniquePeriods.values());
}

/**
 * [FUNGSI BARU]
 * Mengambil SEMUA Laporan KBM (KbmReport) untuk satu desa
 * dalam periode tertentu.
 */
export async function getKbmReportsByPeriod({
  villageId,
  year,
  month,
}: {
  villageId: number | string;
  year: number;
  month: number;
}): Promise<KbmReportWithRelations[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kbm_reports")
    .select(`
      *,
      category (name),
      village (name)
    `)
    .eq("village_id", villageId)
    .eq("period_year", year)
    .eq("period_month", month)
    .order("group_id")
    .order("category_id");

  if (error) {
    console.error("Error fetching KBM reports by period:", error.message);
    return [];
  }
  return data as KbmReportWithRelations[];
}

/**
 * Mengambil daftar BULAN & TAHUN yang memiliki aktivitas apa pun
 * (baik itu Laporan Manual, Presensi, atau Penilaian).
 */
export async function getAvailableReportPeriods(
  villageId: number,
  groupId?: number // Opsional: Jika admin_kelompok, kita filter lebih spesifik
): Promise<AggregatedPeriod[]> {
  const supabase = createAdminClient();

  // Helper untuk query standar
  const getPeriods = async (table: string) => {
    let query = supabase
      .from(table)
      .select("period_month, period_year")
      .eq("village_id", villageId); // Filter Desa Wajib

    if (groupId) {
      query = query.eq("group_id", groupId); // Filter Kelompok Opsional
    }
    
    // Kita tidak perlu data banyak, cukup distinct rows jika memungkinkan
    // (Supabase JS client tidak punya .distinct() langsung yg mudah, jadi kita filter di JS)
    return query;
  };

  // 1. Jalankan 3 Query secara Paralel (Efisien)
  const [kbmRes, attRes, evalRes] = await Promise.all([
    getPeriods("kbm_reports"),
    getPeriods("attendance_recap"),
    getPeriods("evaluation_recap"),
  ]);

  // Cek error (log only)
  if (kbmRes.error) console.error("Error fetching KBM periods:", kbmRes.error);
  if (attRes.error) console.error("Error fetching Attendance periods:", attRes.error);
  if (evalRes.error) console.error("Error fetching Evaluation periods:", evalRes.error);

  // 2. Gabungkan semua hasil
  const allData = [
    ...(kbmRes.data || []),
    ...(attRes.data || []),
    ...(evalRes.data || []),
  ];

  if (allData.length === 0) {
    return [];
  }

  // 3. De-duplikasi (Hanya ambil kombinasi bulan-tahun unik)
  const uniquePeriodsMap = new Map<string, AggregatedPeriod>();
  
  allData.forEach((item) => {
    // Kunci unik: "2025-10"
    const key = `${item.period_year}-${item.period_month}`;
    if (!uniquePeriodsMap.has(key)) {
      uniquePeriodsMap.set(key, {
        period_month: item.period_month,
        period_year: item.period_year,
      });
    }
  });

  // 4. Urutkan (Terbaru di atas)
  const sortedPeriods = Array.from(uniquePeriodsMap.values()).sort((a, b) => {
    if (a.period_year !== b.period_year) {
      return b.period_year - a.period_year; // Tahun descending
    }
    return b.period_month - a.period_month; // Bulan descending
  });

  return sortedPeriods;
}

/**
 * New for handle kbm report from attendance and evaluation recap and report table
 * get detail kbm report
 */

export async function getKbmGroupDetailData(
  groupId: number,
  month: number,
  year: number
): Promise<KbmDetailContext> {
  const supabase = createAdminClient();
  
  // 1. Fetch Data Utama (Paralel)
  const [
    groupRes,
    categoriesRes,
    studentsRes,
    materialsRes,
    matCatsRes,
    attRes,
    evalRes,
    kbmRes
  ] = await Promise.all([
    supabase.from("group").select("name").eq("id", groupId).single(),
    supabase.from("category").select("*").order("id"),
    supabase.from("profile").select("user_id, full_name").eq("group_id", groupId).eq("role", "user"),
    supabase.from("material").select("id, material_name"),
    supabase.from("material_category").select("id, name"),
    
    // Data Transaksional
    supabase.from("attendance_recap").select("*").eq("group_id", groupId).eq("period_month", month).eq("period_year", year),
    supabase.from("evaluation_recap").select("*").eq("group_id", groupId).eq("period_month", month).eq("period_year", year),
    supabase.from("kbm_reports").select("*").eq("group_id", groupId).eq("period_month", month).eq("period_year", year),
  ]);

  console.log("isi attendance", attRes);
  console.log("isi evaluation", evalRes);
  console.log("isi kbm report", kbmRes);

  // 2. Mapping Helper (ID -> Nama) untuk lookup cepat di UI
  const studentsMap = new Map<string, string>();
  studentsRes.data?.forEach(s => studentsMap.set(s.user_id, s.full_name));

  const materialsMap = new Map<string, string>();
  materialsRes.data?.forEach(m => materialsMap.set(m.id, m.material_name));

  const matCatsMap = new Map<string, string>();
  matCatsRes.data?.forEach(mc => matCatsMap.set(String(mc.id), mc.name));

  // 3. Susun Data per Kategori
  const categories = categoriesRes.data as CategoryModel[] || [];
  const attendanceRecaps = attRes.data as AttendanceRecapModel[] || [];
  const evaluationRecaps = evalRes.data as EvaluationRecapModel[] || [];
  const kbmReports = kbmRes.data as KbmReportModel[] || [];

  const combinedData: KbmDetailData[] = categories.map(cat => {
    return {
      category: cat,
      attendance: attendanceRecaps.find(a => a.category_id.toString() === cat.id.toString()),
      evaluation: evaluationRecaps.find(e => e.category_id.toString() === cat.id.toString()),
      manualReport: kbmReports.find(k => k.category_id === cat.id),
    };
  });

  console.log("isi combinedData", combinedData);

  return {
    groupName: groupRes.data?.name || "Kelompok",
    students: studentsMap,
    materials: materialsMap,
    materialCategories: matCatsMap,
    data: combinedData
  };
}