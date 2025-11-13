// Impor asumsi dari file master data Anda
import { CategoryModel, GroupModel, VillageModel } from "./master.types";

export type Profile = {
  id: number; // atau number
  user_id: string; // Ini adalah UUID dari auth.users
  username: string;
  role: string;
  full_name: string;
  gender?: 'L' | 'P';
  birth_place?: string | null;
  birth_date?: string | null;
  village_id?: string | number;
  group_id?: string | number;
  category_id?: string | null;
  school_level?: string | null;
  school_name?: string | null;
  father_name?: string | null;
  father_occupation?: string | null;
  mother_name?: string | null;
  mother_occupation?: string | null;
  parent_contact?: string | null;
};

// Tipe data gabungan untuk tampilan di Admin Panel
// Ini menggabungkan Profile, Group, Class, dan data Auth (email, role)
export type UserAdminView = Profile & {
  email: string; // Diambil dari auth.users
  role: string; // Diambil dari profile.role
  village: Pick<VillageModel, 'name'> | null; // Hanya mengambil nama grup
  group: Pick<GroupModel, 'name'> | null; // Hanya mengambil nama grup
  category: Pick<CategoryModel, 'name'> | null; // Hanya mengambil nama kelas
};

// Tipe data untuk payload form (membuat user baru)
export type CreateUserFormPayload = {
  email: string;
  password: string;
  username: string;
  full_name: string;
  role: 'superadmin' | 'admin_desa' | 'admin_kelompok' | 'user'; // DITAMBAHKAN
  gender?: 'L' | 'P';
  birth_place?: string;
  birth_date?: string;
  village_id?: string | null;
  group_id?: string | null;
  category_id?: string | null;
  school_level?: string | null;
  school_name?: string | null;
  father_name?: string | null;
  father_occupation?: string | null;
  mother_name?: string | null;
  mother_occupation?: string | null;
  parent_contact?: string | null;
};

// Tipe data untuk payload form (memperbarui user)
export type UpdateUserFormPayload = {
  profileData: Partial<Omit<Profile, 'id' | 'user_id'>>;
  email?: string; // Opsional jika Anda mengizinkan perubahan email
};
