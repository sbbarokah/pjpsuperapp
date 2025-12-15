/**
 * Tipe data untuk Laporan Musyawarah (Laporan Muslimun)
 * Sesuai skema 'meeting_reports'
 */
export type MeetingReportModel = {
  id: string; // UUID
  created_at: string; // timestamptz
  author_user_id: string; // UUID
  group_id: number; // bigint
  village_id: number; // bigint
  period_month: number;
  period_year: number;
  muroh_date: string; // DATE (YYYY-MM-DD)
  muroh_place?: string | null;
  
  element_ki?: string | null; 
  element_management?: string | null;                   
  element_expert?: string | null;                        
  element_mubaligh?: string | null;                      
  element_parent?: string | null;                        
  muroh_notes?: string | null;
  rundown?: string | null;
};

/**
 * Tipe Kustom untuk Join
 * Digunakan saat mengambil laporan DENGAN nama kelompok & desanya
 */
export type MeetingReportWithRelations = MeetingReportModel & {
  group: { name: string };
  village: { name: string };
};

/* --- DTO (Data Transfer Objects) --- */
export type CreateMeetingReportDto = Omit<MeetingReportModel, "id" | "created_at">;
export type UpdateMeetingReportDto = Partial<Omit<MeetingReportModel, "id" | "created_at" | "author_user_id">> & { id: string };