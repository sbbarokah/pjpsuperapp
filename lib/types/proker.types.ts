import { Profile } from "./user.types";

/**
 * Item Rincian Anggaran Biaya
 */
export type RabItem = {
  item: string;
  satuan: string;
  jumlah: number;
  harga: number;
};

/**
 * Struktur Timeline
 * Key: Nama Bulan (Januari, Februari...)
 * Value: Array Minggu (M1, M2...)
 */
export type TimelineData = Record<string, string[]>;

export type ProkerLevel = 'daerah' | 'desa' | 'kelompok';
/**
 * Model Utama Program Kerja (Sesuai DB)
 */
export type WorkProgramModel = {
  id: string;
  created_at: string;
  author_user_id: string;
  village_id: number;
  group_id?: number | null;
  level: ProkerLevel;
  
  name: string;          // nama_kegiatan
  team: string;          // tim
  year: number;          // tahun
  description?: string;  // deskripsi
  location?: string;     // tempat
  participants?: string; // peserta
  objective?: string;    // tujuan
  
  budget_items: RabItem[]; // rab
  timeline: TimelineData;
  
  total_budget: number;
};

/**
 * DTO untuk Create/Update
 */
export type CreateProkerDto = {
  nama_kegiatan: string;
  tim: string;
  tahun: number;
  deskripsi: string;
  tempat: string;
  peserta: string;
  tujuan: string;
  rab: RabItem[];
  timeline: TimelineData;
  
  // Scoping (diisi otomatis oleh action)
  village_id?: number;
  group_id?: number;
};

export type UpdateProkerDto = Partial<CreateProkerDto> & { id: string };

/**
 * Tipe untuk tampilan list
 */
export type WorkProgramWithAuthor = WorkProgramModel & {
  author?: Pick<Profile, 'full_name'> | null;
};