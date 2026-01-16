"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { CreateKbmReportDto, KbmDetailContext, KbmDetailData, KbmReportModel, KbmReportWithRelations, VillageDataPoint, VillageDetailContext, VillageMatrixData } from "@/lib/types/report.types";
import { Profile } from "../types/user.types";
import { validateUserRole } from "./authService";
import { CategoryModel } from "../types/master.types";
import { AttendanceRecapModel } from "../types/attendance.types";
import { EvaluationEntry, EvaluationRecapModel } from "../types/evaluation.types";

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
  const supabase = await createAdminClient();
  
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

  // console.log("isi attendance", attRes);
  // console.log("isi evaluation", evalRes);
  // console.log("isi kbm report", kbmRes);

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

  return {
    groupName: groupRes.data?.name || "Kelompok",
    students: studentsMap,
    materials: materialsMap,
    materialCategories: matCatsMap,
    data: combinedData
  };
}

/***
 * Service untuk memperoleh data laporan untuk desa
 * 
 */

export async function getVillageDetailData(
  villageId: number,
  month: number,
  year: number
): Promise<VillageDetailContext> {
  const supabase = await createAdminClient();
  
  // 1. Fetch Master Data & Transactional Data Paralel
  const [
    villageRes,
    groupsRes,
    categoriesRes,
    matCatsRes,
    // Data Transaksi
    attRes,
    evalRes,
    kbmRes
  ] = await Promise.all([
    supabase.from("village").select("name").eq("id", villageId).single(),
    supabase.from("group").select("*").eq("village_id", villageId).order("id"),
    supabase.from("category").select("*").order("id"),
    supabase.from("material_category").select("*").order("id"),
    
    supabase.from("attendance_recap").select("*").eq("village_id", villageId).eq("period_month", month).eq("period_year", year),
    supabase.from("evaluation_recap").select("*").eq("village_id", villageId).eq("period_month", month).eq("period_year", year),
    supabase.from("kbm_reports").select("*").eq("village_id", villageId).eq("period_month", month).eq("period_year", year),
  ]);

  // 2. Inisialisasi Matriks Kosong
  const matrix: VillageMatrixData = new Map();
  const categories = categoriesRes.data || [];
  const groups = groupsRes.data || [];

  categories.forEach(cat => {
    const groupMap = new Map<number, VillageDataPoint>();
    groups.forEach(grp => {
      groupMap.set(grp.id, {
        count_male: 0, count_female: 0, count_total: 0,
        avg_present: 0, avg_permission: 0, avg_absent: 0, achievement: "",
        materials: [], challenges: "", solutions: "", success_notes: ""
      });
    });
    matrix.set(cat.id, groupMap);
  });

  // 3. Isi Data (Prioritas: Manual Report > Recap)
  
  // Helper untuk update cell
  const updateCell = (catId: number, groupId: number, updater: (prev: VillageDataPoint) => VillageDataPoint) => {
    const groupMap = matrix.get(catId);
    if (groupMap && groupMap.has(groupId)) {
      const prev = groupMap.get(groupId)!;
      groupMap.set(groupId, updater(prev));
    }
  };

  // A. Isi dari Attendance Recap (Presensi)
  attRes.data?.forEach(att => {
    updateCell(att.category_id, att.group_id, (prev) => ({
      ...prev,
      // Sensus dari Recap (jika belum ada manual)
      count_male: att.raw_data?.count_male || 0,
      count_female: att.raw_data?.count_female || 0,
      count_total: att.generus_count, 
      // Presensi dari Recap
      avg_present: att.present_percentage,
      avg_permission: att.permission_percentage,
      avg_absent: att.absent_percentage
    }));
  });

  // B. Isi dari Evaluation Recap (Nilai & Esai)
  evalRes.data?.forEach(ev => {
    updateCell(ev.category_id, ev.group_id, (prev) => ({
      ...prev,
      // Materi (Raw Data Array)
      materials: ev.raw_data as EvaluationEntry[], 
      // Esai
      challenges: ev.challenges || "", // Note: Sesuaikan nama kolom di DB (challenges vs challenges_info)
      solutions: ev.solutions || "",
      success_notes: ev.notes || ""
    }));
  });

  // C. Isi dari KBM Reports (Manual - Override)
  // Jika ada laporan manual, biasanya datanya lebih final/akurat
  kbmRes.data?.forEach(kbm => {
    updateCell(kbm.category_id, kbm.group_id, (prev) => {
      // Konversi raw_data manual (Record<string, string>) ke format EvaluationEntry[]
      // Masalah: Manual report raw_data tidak punya category_id. 
      // Kita harus akali atau terima raw_data apa adanya. 
      // Di sini kita asumsikan manual report hanya punya notes string tanpa kategori materi detil
      // atau kita skip materi manual jika strukturnya beda.
      
      return {
        ...prev,
        // Sensus (Override)
        count_male: kbm.count_male,
        count_female: kbm.count_female,
        count_total: kbm.count_total,
        
        // Presensi (Override)
        avg_present: kbm.attendance_present_percentage,
        avg_permission: kbm.attendance_permission_percentage,
        avg_absent: kbm.attendance_absent_percentage,
        
        // Esai (Override/Append)
        challenges: kbm.challenges_info || prev.challenges,
        success_notes: kbm.program_success_info || prev.success_notes,
        // solutions biasanya tidak ada di kbm_report manual standard, pakai prev
      };
    });
  });

  return {
    villageName: villageRes.data?.name || "Desa",
    groups,
    categories,
    materialCategories: matCatsRes.data || [],
    matrix
  };
}