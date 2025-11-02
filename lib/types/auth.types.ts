import { User } from "@supabase/supabase-js";
import { Profile } from "./user.types"; // Asumsi Anda punya tipe 'Profile'

/**
 * Representasi gabungan dari sesi pengguna yang terotentikasi.
 * Mengandung data auth, data profile, dan hak akses yang sudah diekstrak.
 */
export type AuthSession = {
  user: User;
  profile: Profile;
  role: 'superadmin' | 'admin_desa' | 'admin_kelompok' | 'user' | null;
  /** ID Desa yang dikelola (jika admin_desa) */
  village_id: number | null;
  /** ID Kelompok yang dikelola (jika admin_kelompok atau admin_desa) */
  group_id: number | null;
  /** Error jika sesi tidak valid atau tidak memiliki hak */
  error?: string;
};
