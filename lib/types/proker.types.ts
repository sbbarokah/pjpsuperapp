import { Profile } from "./user.types";

/**
 * Item Rincian Anggaran Biaya
 */
export type RabItem = {
  item: string;
  satuan: string;
  jumlah: number;
  frekuensi: number; 
  harga: number;
};

/**
 * Status Timeline
 * 0: Tidak ada kegiatan (Putih)
 * 1: Ada kegiatan, tanpa biaya (Biru)
 * 2: Ada kegiatan, ada biaya / Fiskal (Hijau)
 */
export type TimelineStatus = 0 | 1 | 2;

/**
 * Struktur Timeline
 */
export type TimelineData = Record<string, Record<string, TimelineStatus>>;

/**
 * [BARU] Struktur Notes Timeline
 * Key: Nama Bulan, Value: String catatan
 */
export type TimelineNotes = Record<string, string>;

export type ProkerLevel = 'daerah' | 'desa' | 'kelompok';

/**
 * Model Utama Program Kerja
 */
export type WorkProgramModel = {
  id: string;
  created_at: string;
  author_user_id: string;
  village_id: number;
  group_id?: number | null;
  level: ProkerLevel;
  
  name: string;          
  team: string;          
  year: number;          
  description?: string;  
  location?: string;     
  participants?: string; 
  objective?: string;    
  
  budget_items: RabItem[]; 
  timeline: TimelineData;
  timeline_notes?: TimelineNotes; // [BARU] Field optional
  
  total_budget: number;
};

/**
 * DTO Create
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
  timeline_notes: TimelineNotes; // [BARU]
  
  total_anggaran: number; 
  
  village_id?: number;
  group_id?: number;
};

export type UpdateProkerDto = Partial<CreateProkerDto> & { id: string };

export type WorkProgramWithAuthor = WorkProgramModel & {
  author?: Pick<Profile, 'full_name'> | null;
};