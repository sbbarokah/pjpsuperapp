"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { CreateKbmReportDto, KbmReportModel, KbmReportWithCategory } from "@/lib/types/report.types";
import { Profile } from "../types/user.types";
import { validateUserRole } from "./authService";

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

  return data as KbmReportWithCategory[];
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