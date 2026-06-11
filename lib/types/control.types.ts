// Tipe status halaman
export type PageStatus = "G" | "O" | "Y" | "E";

export interface ControlMaterialModel {
  id: number;
  name: string;
  total_pages: number;
  notes: string | null;
  created_at: string;
}

export interface ControlUserRecapWithRelations {
  id: number;
  control_material_id: number;
  user_id: string;
  recapitulation: PageStatus[]; // Array of status
  created_at: string;
  control_material?: {
    name: string;
    total_pages: number;
  };
  profile?: {
    full_name: string | null;
    username: string;
  };
}

export interface MaterialProgressCardDto {
  material_id: number;
  name: string;
  total_pages: number;
  percentage: number;
  total_recap: number; // Jumlah anak yang sudah mulai mengisi materi ini
}