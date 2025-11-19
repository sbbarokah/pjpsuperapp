import { AttendanceRecapModel } from "./attendance.types";
import { EvaluationEntry, EvaluationRawData, EvaluationRecapModel } from "./evaluation.types";
import { CategoryModel, GroupModel, MaterialCategoryModel, VillageModel } from "./master.types";

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
  raw_data: EvaluationRawData;
  program_success_info?: string | null;
  challenges_info?: string | null;
  solution_info?: string | null;
};

// 2. Tipe DTO (Data Transfer Object)
export type CreateKbmReportDto = Omit<KbmReportModel, "id" | "created_at">;
export type UpdateKbmReportDto = Partial<Omit<KbmReportModel, "id" | "created_at" | "author_user_id">> & { id: string };

// export type UpdateKbmReportDto = Partial<CreateKbmReportDto> & { id: string };

/**
 * Tipe Kustom untuk Join KBM Report
 * Sekarang menyertakan relasi Kategori dan Desa
 */
export type KbmReportWithRelations = KbmReportModel & {
  category: Pick<CategoryModel, "name">;
  group: Pick<GroupModel, "name">;
  village: Pick<VillageModel, "name">;
};

/**
 * Untuk detail laporan KBM dengan relasi lengkap
 */

export type KbmDetailData = {
  category: CategoryModel;
  attendance?: AttendanceRecapModel | null;
  evaluation?: EvaluationRecapModel | null;
  manualReport?: KbmReportModel | null;
};

export type KbmDetailContext = {
  groupName: string;
  students: Map<string, string>; // ID -> Name
  materials: Map<string, string>; // ID -> Name
  materialCategories: Map<string, string>; // ID -> Name
  data: KbmDetailData[];
};


/**
 * Types data untuk report admin_desa
 * 
 */

// Tipe Data Normalized untuk UI
export type VillageDataPoint = {
  // Sensus
  count_male: number;
  count_female: number;
  count_total: number;
  
  // Kehadiran (Rata-rata %)
  avg_present: number;
  avg_permission: number;
  avg_absent: number;
  
  // Deskriptif
  materials: EvaluationEntry[]; // Gabungan dari manual & recap
  challenges: string;
  solutions: string;
  success_notes: string;
};

// Struktur Matriks: Map<CategoryId, Map<GroupId, DataPoint>>
export type VillageMatrixData = Map<number, Map<number, VillageDataPoint>>;

export type VillageDetailContext = {
  villageName: string;
  groups: GroupModel[];
  categories: CategoryModel[];
  materialCategories: MaterialCategoryModel[]; // Untuk label materi
  matrix: VillageMatrixData;
};