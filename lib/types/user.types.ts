
// Tabel Profile

import { ClassModel, GroupModel } from "./master.types";

// Saya asumsikan 'username' ada di tabel profile, karena tidak ada di auth.users Supabase secara default
export type Profile = {
  id: string; // atau number
  user_id: string; // Ini adalah UUID dari auth.users
  username: string;
  front_name: string;
  last_name?: string;
  gender?: 'L' | 'P';
  birth_date?: string;
  group_id?: string; // atau number
  class_id?: string; // atau number
};

// Tipe data gabungan untuk tampilan di Admin Panel
// Ini menggabungkan Profile, Group, Class, dan data Auth (email)
export type UserAdminView = Profile & {
  email: string; // Diambil dari auth.users
  group: Pick<GroupModel, 'name'> | null; // Hanya mengambil nama grup
  class: Pick<ClassModel, 'name'> | null; // Hanya mengambil nama kelas
};

// Tipe data untuk payload form (membuat user baru)
export type CreateUserFormPayload = {
  email: string;
  password: string;
  username: string;
  front_name: string;
  last_name?: string;
  gender?: 'L' | 'P';
  birth_date?: string;
  group_id?: string | null;
  class_id?: string | null;
};

// Tipe data untuk payload form (memperbarui user)
// Kita pisahkan ProfileData dan AuthData (email)
export type UpdateUserFormPayload = {
  profileData: Partial<Omit<Profile, 'id' | 'user_id'>>;
  email?: string; // Opsional jika Anda mengizinkan perubahan email
};
