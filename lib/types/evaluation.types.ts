import { CategoryModel, GroupModel, VillageModel } from "./master.types";
import { Profile } from "./user.types";

/**
 * [REVISI] Struktur data mentah yang disimpan di JSONB
 * Key 1: material_id
 */
export type EvaluationRawDataEntry = {
  scores: Record<string, string>; // Key 2: user_id, Value: score
  evaluation_note: string;         // Catatan evaluasi per materi
};
export type EvaluationRawData = Record<string, EvaluationRawDataEntry>;

/**
 * [REVISI] Model data dari tabel evaluation_recap
 */
export type EvaluationRecapModel = {
  id: string; // UUID
  created_at: string;
  author_user_id: string;
  group_id: number;
  village_id: number;
  category_id: number;
  period_month: number;
  period_year: number;
  notes?: string | null; // 'evaluation' dihapus
  raw_data: EvaluationRawData;
};

/**
 * [REVISI] Tipe untuk satu baris materi di form klien
 */
export type EvaluationRowState = {
  temp_id: string; // ID unik sementara
  material_id: string; // ID dari tabel 'material'
  material_category_id: string; // ID dari tabel 'material category'
  scores: Record<string, string>; // { "user_id_1": "A", "user_id_2": "B" }
  evaluation_note: string; // [BARU] Catatan evaluasi per baris
};

/**
 * [REVISI] DTO (Data Transfer Object)
 */
export type CreateEvaluationPayload = {
  group_id: number;
  category_id: number;
  period_month: number;
  period_year: number;
  notes?: string | null;
  evaluationRows: EvaluationRowState[];
};

export type UpdateEvaluationPayload = CreateEvaluationPayload & { id: string };

/**
 * [REVISI] Tipe data untuk tampilan list
 */
export type EvaluationRecapWithRelations = Omit<EvaluationRecapModel, 'raw_data'> & {
  author: Pick<Profile, 'full_name'> | null;
  group: Pick<GroupModel, 'name'>;
  category: Pick<CategoryModel, 'name'>;
};