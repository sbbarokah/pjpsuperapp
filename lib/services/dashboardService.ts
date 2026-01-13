import { createAdminClient } from "@/lib/supabase/server_admin";
import { KbmReportWithRelations } from "@/lib/types/report.types";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { AttendanceRecapWithRelations } from "../types/attendance.types";
import { EvaluationRecapWithRelations } from "../types/evaluation.types";

// Tipe data berdasarkan output fungsi SQL
export type GlobalUserStats = {
  category_id?: number;
  category_name: string;
  gender: string;
  total_users: number;
};

export type VillageUserStats = {
  category_id?: number;
  group_id: number;
  group_name: string;
  category_name: string;
  gender: string;
  total_users: number;
};

/**
 * Mengambil statistik generus global (per kategori & gender)
 */
export async function getGlobalUserStats(): Promise<GlobalUserStats[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "get_global_user_stats_by_category_gender"
  );
  if (error) {
    console.error("Error getGlobalUserStats:", error);
    return [];
  }
  return data as GlobalUserStats[];
}

/**
 * Mengambil statistik generus untuk satu desa (per kelompok, kategori & gender)
 */
export async function getVillageUserStats(villageId: number | string): Promise<VillageUserStats[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "get_village_user_stats_by_group_category_gender", // Memanggil fungsi baru/yang diperbarui
    {
      p_village_id: Number(villageId), 
    }
  );
  if (error) {
    console.error("Error getVillageUserStats:", error);
    return [];
  }
  return data as VillageUserStats[]; // Tipe return sekarang mencakup group_id
}

/**
 * Mengambil 10 Laporan Muslimun terbaru
 */
export async function getRecentMeetingReports(): Promise<MeetingReportWithRelations[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meeting_reports")
    .select(`
      id,
      created_at,
      period_month,
      period_year,
      group (name)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error getRecentMeetingReports:", error);
    return [];
  }
  return data as any; // Tipe disesuaikan
}

/**
 * [BARU] Mengambil 5 Rekap Presensi terbaru
 */
export async function getRecentAttendanceReports(): Promise<AttendanceRecapWithRelations[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("attendance_recap")
    .select(`
      id,
      created_at,
      period_month,
      period_year,
      group (name),
      category (name)
    `)
    .order("created_at", { ascending: false })
    .limit(10); // Limit 5 agar tidak terlalu panjang di dashboard

  if (error) {
    console.error("Error getRecentAttendanceReports:", error);
    return [];
  }
  return data as any;
}

/**
 * [BARU] Mengambil 5 Rekap Penilaian terbaru
 */
export async function getRecentEvaluationReports(): Promise<EvaluationRecapWithRelations[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("evaluation_recap")
    .select(`
      id,
      created_at,
      period_month,
      period_year,
      group (name),
      category (name)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error getRecentEvaluationReports:", error);
    return [];
  }
  return data as any;
}

/**
 * Mengambil 5 Laporan KBM terbaru
 */
export async function getRecentKbmReports(): Promise<KbmReportWithRelations[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kbm_reports")
    .select(`
      id,
      created_at,
      group_id,
      group (name),
      category (name)
    `)
    .order("created_at", { ascending: false })
    .limit(5);
  
  if (error) {
    console.error("Error getRecentKbmReports:", error);
    return [];
  }
  return data as any; 
}