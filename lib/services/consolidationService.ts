
import { KbmReportWithRelations } from "@/lib/types/report.types";
import { createAdminClient } from "../supabase/server_admin";

const supabase = createAdminClient();

type ConsolidatedReportItem = {
  group_id: number;
  group_name: string;
  category_id: number;
  category_name: string;
  period_month: number;
  period_year: number;
  
  // Status Data
  has_manual_report: boolean; // Ada di tabel kbm_reports
  has_attendance_recap: boolean; // Ada di tabel attendance_recap
  has_evaluation_recap: boolean; // Ada di tabel evaluation_recap
  
  // Data Utama (Diambil dari kbm_report jika ada, atau calculated dari recap)
  report_id?: string; // ID kbm_report jika ada
  generus_count: number;
  attendance_avg: number;
  evaluation_summary: string; // Ringkasan atau status penilaian
};

export async function getConsolidatedKbmReports({
  villageId,
  groupId, // Opsional (untuk admin_kelompok)
  month,
  year,
}: {
  villageId: number;
  groupId?: number;
  month: number;
  year: number;
}): Promise<ConsolidatedReportItem[]> {
  
  // 1. Ambil semua Kategori dan Grup yang relevan (Skeleton)
  // Ini memastikan kita punya baris untuk setiap kombinasi Grup-Kategori meskipun laporannya belum ada
  let groupsQuery = supabase.from("group").select("id, name").eq("village_id", villageId);
  if (groupId) groupsQuery = groupsQuery.eq("id", groupId);
  
  const { data: groups } = await groupsQuery;
  const { data: categories } = await supabase.from("category").select("id, name").order("id");
  
  if (!groups || !categories) return [];

  // 2. Ambil Data Laporan Manual (KBM Reports)
  let kbmQuery = supabase
    .from("kbm_reports")
    .select("*")
    .eq("village_id", villageId)
    .eq("period_month", month)
    .eq("period_year", year);
  if (groupId) kbmQuery = kbmQuery.eq("group_id", groupId);
  const { data: kbmReports } = await kbmQuery;

  // 3. Ambil Data Rekap Presensi
  let attQuery = supabase
    .from("attendance_recap")
    .select("group_id, category_id, generus_count, present_percentage")
    .eq("village_id", villageId)
    .eq("period_month", month)
    .eq("period_year", year);
  if (groupId) attQuery = attQuery.eq("group_id", groupId);
  const { data: attRecaps } = await attQuery;

  // 4. Ambil Data Rekap Penilaian
  let evalQuery = supabase
    .from("evaluation_recap")
    .select("group_id, category_id, notes") // notes sebagai ringkasan
    .eq("village_id", villageId)
    .eq("period_month", month)
    .eq("period_year", year);
  if (groupId) evalQuery = evalQuery.eq("group_id", groupId);
  const { data: evalRecaps } = await evalQuery;

  // 5. GABUNGKAN SEMUA DATA (Consolidation Logic)
  const result: ConsolidatedReportItem[] = [];

  groups.forEach(group => {
    categories.forEach(cat => {
      // Cari data yang cocok
      const manual = kbmReports?.find(r => r.group_id === group.id && r.category_id === cat.id);
      const attendance = attRecaps?.find(r => r.group_id === group.id && r.category_id === cat.id);
      const evaluation = evalRecaps?.find(r => r.group_id === group.id && r.category_id === cat.id);

      // Tentukan nilai yang akan ditampilkan
      // Prioritas: Manual Report > Calculated Recap
      
      const generusCount = manual 
        ? manual.count_total 
        : (attendance ? attendance.generus_count : 0);

      const attendanceAvg = manual 
        ? manual.attendance_present_percentage 
        : (attendance ? attendance.present_percentage : 0);

      const evalSummary = manual 
        ? (manual.program_success_info ? "Terisi" : "Kosong")
        : (evaluation ? "Ada Rekap Penilaian" : "-");

      // Hanya masukkan ke list jika ada data relevan (opsional, bisa juga tampilkan semua baris kosong)
      // Di sini saya tampilkan semua agar admin tahu mana yang BELUM mengisi
      result.push({
        group_id: group.id,
        group_name: group.name,
        category_id: cat.id,
        category_name: cat.name,
        period_month: month,
        period_year: year,
        
        has_manual_report: !!manual,
        has_attendance_recap: !!attendance,
        has_evaluation_recap: !!evaluation,
        
        report_id: manual?.id,
        generus_count: generusCount,
        attendance_avg: attendanceAvg,
        evaluation_summary: evalSummary
      });
    });
  });

  return result;
}