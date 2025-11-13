// Tipe data ini mendefinisikan payload dari form
// Ini akan digunakan oleh Form (Client) dan Action (Server)

export type CreateKbmReportPayload = {
  group_id: string;
  period_month: number; // 1-12
  period_year: number; // e.g., 2025
  category_id: string; // <-- DIUBAH DARI 'jenjang'

  // 1. Info Jumlah Generus
  count_male: number;
  count_female: number;
  count_total: number;

  // 2. Info Presentase Kehadiran
  attendance_total_students: number;
  attendance_present_percentage: number;
  attendance_permission_percentage: number;
  attendance_absent_percentage: number;

  // 3. Info Capaian Materi (string karena bisa diisi deskripsi)
  achievement_quran_meaning: string;
  achievement_hadith_meaning: string;
  achievement_quran_reading: string;
  achievement_surah_memorization: string;
  achievement_dalil_memorization: string;
  achievement_prayer_memorization: string;
  achievement_tajwid: string;
  achievement_character: string;

  // 4. Info Keberhasilan Program
  program_success_info: string;

  // 5. Info Tantangan/Kendala
  challenges_info: string;
};