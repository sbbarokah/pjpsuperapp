// Impor asumsi dari file master data Anda
import { CategoryModel, GroupModel } from "./master.types";

export type Profile = {
  id: string; // atau number
  user_id: string; // Ini adalah UUID dari auth.users
  username: string;
  role: string;
  front_name: string;
  last_name?: string;
  gender?: 'L' | 'P';
  birth_place?: string;
  birth_date?: string;
  group_id?: string | null; // atau number
  class_id?: string | null; // atau number
  school_level?: string;
  school_name?: string;
  father_name?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_occupation?: string;
  parent_contact?: string;
};

// Tipe data gabungan untuk tampilan di Admin Panel
// Ini menggabungkan Profile, Group, Class, dan data Auth (email, role)
export type UserAdminView = Profile & {
  email: string; // Diambil dari auth.users
  role: string; // Diambil dari auth.user_metadata
  group: Pick<GroupModel, 'name'> | null; // Hanya mengambil nama grup
  class: Pick<CategoryModel, 'name'> | null; // Hanya mengambil nama kelas
};

// Tipe data untuk payload form (membuat user baru)
export type CreateUserFormPayload = {
  email: string;
  password: string;
  username: string;
  front_name: string;
  role: 'superadmin' | 'admin_desa' | 'admin_kelompok' | 'user'; // DITAMBAHKAN
  last_name?: string;
  gender?: 'L' | 'P';
  birth_date?: string;
  group_id?: string | null;
  category_id?: string | null;
};

// Tipe data untuk payload form (memperbarui user)
export type UpdateUserFormPayload = {
  profileData: Partial<Omit<Profile, 'id' | 'user_id'>>;
  email?: string; // Opsional jika Anda mengizinkan perubahan email
  role?: 'superadmin' | 'admin_desa' | 'admin_kelompok' | 'user'; // DITAMBAHKAN
};
