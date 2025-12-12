import { CategoryModel, GroupModel, VillageModel } from "./master.types";
import { Profile } from "./user.types";

/**
 * Data mentah untuk satu siswa
 */
export type StudentAttendanceData = {
  name: string; // Snapshot Nama Lengkap
  p: number; // Present (Hadir)
  i: number; // Permission (Izin)
  a: number; // Absent (Alpa)
};

export type AttendanceRawData = {
  count_male: number;
  count_female: number;
  count_total: number;
  attendances: Record<string, StudentAttendanceData>;
};

/**
 * Model data dari tabel attendance_recap
 */
export type AttendanceRecapModel = {
  id: string; // UUID
  created_at: string;
  author_user_id: string;
  group_id: number;
  village_id: number;
  category_id: number;
  period_month: number;
  period_year: number;
  raw_data: AttendanceRawData; // JSONB (key adalah user_id)
  meeting_count: number;
  generus_count: number;
  present_amount: number;
  present_percentage: number;
  permission_amount: number;
  permission_percentage: number;
  absent_amount: number;
  absent_percentage: number;
};

/**
 * DTO (Data Transfer Object)
 * Ini adalah payload yang dikirim dari form ke server action
 */
export type CreateRecapPayload = {
  group_id: number;
  category_id: number;
  period_month: number;
  period_year: number;
  meeting_count: number;
  raw_data: AttendanceRawData;
};

export type UpdateRecapPayload = CreateRecapPayload & { id: string };

/**
 * Tipe data untuk tampilan list (dengan relasi)
 */
export type AttendanceRecapWithRelations = Omit<AttendanceRecapModel, 'raw_data'> & {
  author: Pick<Profile, 'full_name'> | null;
  group: Pick<GroupModel, 'name'>;
  category: Pick<CategoryModel, 'name'>;
};