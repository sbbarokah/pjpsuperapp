import { CategoryModel } from "./master.types";

export type KbmReportModel = {
  id: string; // UUID
  created_at: string; // timestamptz
  group_id: string; // atau number, sesuaikan dengan tipe 'group.id'
  village_id: string; // atau number
  category_id: string; // atau number
  author_user_id: string; // UUID
  period_month: number;
  period_year: number;
  count_male: number;
  count_female: number;
  count_total: number;
  attendance_total_meetings: number;
  attendance_present_percentage: number;
  attendance_permission_percentage: number;
  attendance_absent_percentage: number;
  achievement_quran_meaning?: string | null;
  achievement_hadith_meaning?: string | null;
  achievement_quran_reading?: string | null;
  achievement_surah_memorization?: string | null;
  achievement_dalil_memorization?: string | null;
  achievement_prayer_memorization?: string | null;
  achievement_tajwid?: string | null;
  achievement_writing?: string | null;
  achievement_asmaul_husna?: string | null;
  achievement_practices?: string | null;
  achievement_character?: string | null;
  program_success_info?: string | null;
  challenges_info?: string | null;
};

// 2. Tipe DTO (Data Transfer Object)
export type CreateKbmReportDto = Omit<KbmReportModel, "id" | "created_at">;
export type UpdateKbmReportDto = Partial<CreateKbmReportDto> & { id: string };

// 3. Tipe Kustom untuk Join
//    Digunakan saat mengambil laporan DENGAN nama kategorinya
export type KbmReportWithCategory = KbmReportModel & {
  category: Pick<CategoryModel, "name">;
};