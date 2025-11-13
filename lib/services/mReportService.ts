"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { CreateKbmReportDto, KbmReportModel, KbmReportWithCategory } from "@/lib/types/report.types";
import { Profile } from "../types/user.types";
import { validateUserRole } from "./authService";
import { MeetingReportModel, MeetingReportWithRelations } from "../types/mreport.types";

/**
 * Mengambil Laporan Muslimun (MeetingReport) berdasarkan ID.
 * Hanya untuk penggunaan di Server Component.
 */
export async function getMeetingReportById(
  reportId: string,
): Promise<MeetingReportModel | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meeting_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error) {
    console.error("Error fetching meeting report by ID:", error.message);
    return null;
  }
  return data;
}

/**
 * Mengambil daftar Laporan Muslimun (MeetingReport)
 * dengan filter berdasarkan ID desa atau kelompok.
 */
export async function getMeetingReportsList({
  villageId,
  groupId,
}: {
  villageId: number;
  groupId?: number;
}): Promise<MeetingReportWithRelations[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("meeting_reports")
    .select(`
      *,
      group (name),
      village (name)
    `)
    .eq("village_id", villageId);

  // Filter tambahan jika group_id disediakan
  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  // Urutkan berdasarkan yang terbaru
  query = query.order("period_year", { ascending: false })
               .order("period_month", { ascending: false })
               .order("muroh_date", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching meeting reports list:", error.message);
    return [];
  }

  return data as MeetingReportWithRelations[];
}

/**
 * [FUNGSI BARU]
 * Mengambil SEMUA Laporan Muslimun (MeetingReport) untuk satu desa
 * dalam periode tertentu.
 */
export async function getMeetingReportsByPeriod({
  villageId,
  year,
  month,
}: {
  villageId: number | string;
  year: number;
  month: number;
}): Promise<MeetingReportWithRelations[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meeting_reports")
    .select(`
      *,
      group (name),
      village (name)
    `)
    .eq("village_id", villageId)
    .eq("period_year", year)
    .eq("period_month", month)
    .order("group_id");

  if (error) {
    console.error("Error fetching meeting reports by period:", error.message);
    return [];
  }
  return data as MeetingReportWithRelations[];
}

/**
 * PENTING: Anda perlu membuat service function baru `getConsolidatedMuslimunPeriods`
 * di `mReportService.ts`.
 *
 * Fungsi ini harus mengambil `villageId` dan mengembalikan
 * array unik dari periode laporan, idealnya dengan jumlah laporan.
 *
 * Contoh query Supabase (atau Prisma) di service Anda:
 **/ 
export async function getConsolidatedMuslimunPeriods(villageId: string) {
  const supabase = createAdminClient();

  // Panggil fungsi RPC yang baru kita buat
  const { data, error } = await supabase.rpc(
    'get_muslimun_periods', 
    { v_id: villageId } // Ini adalah parameter yang kita kirim ke fungsi SQL
  );

  // Baris 124 Anda sekarang akan menangani error RPC
  if (error) {
    console.error("Supabase RPC Error:", error);
    throw new Error(error.message);
  }

  // Penting: ubah nama 'report_count' (dari SQL) menjadi 'count' (sesuai kebutuhan komponen)
  const formattedData = data.map((item: any) => ({
    period_year: item.period_year,
    period_month: item.period_month,
    count: item.report_count 
  }));

  return formattedData as { period_year: number; period_month: number; count: number }[];
}