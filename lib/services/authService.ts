import { createClient as createServerUserClient } from "@/lib/supabase/server_user";
import { Profile } from "@/lib/types/user.types"; // Asumsi path ini benar

/**
 * Mendapatkan tipe 'role' secara dinamis dari tipe Profile.
 * cth: "superadmin" | "admin_village" | "admin_group" | "parent" | "user"
 */
export type UserRole = Profile["role"];

/**
 * ====================================================================
 * FUNGSI INTI (PONDASI)
 * ====================================================================
 */

/**
 * Mengambil data 'User' (dari auth.users) dan 'Profile' (dari tabel profile)
 * untuk pengguna yang sedang login.
 *
 * Fungsi ini adalah sumber kebenaran tunggal (single source of truth)
 * untuk semua validasi.
 *
 * @returns { user, profile }
 * @throws { Error } Jika pengguna tidak login atau profil tidak ditemukan.
 */
export async function getAuthenticatedUserAndProfile() {
  // 1. Buat client yang bertindak sebagai pengguna
  const supabase = await createServerUserClient();

  // 2. Ambil data user dari sesi (cookie)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Otentikasi diperlukan.");
  }

  // 3. Ambil profil terkait dari tabel 'profile'
  // (Asumsi RLS mengizinkan pengguna membaca profilnya sendiri)
  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user.id)
    .single<Profile>(); // Gunakan tipe Profile lengkap

  if (profileError) {
    throw new Error(`Gagal mengambil profil: ${profileError.message}`);
  }

  if (!profile) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  return { user, profile };
}

/**
 * ====================================================================
 * VALIDATOR UMUM
 * ====================================================================
 */

/**
 * Fungsi validasi paling fleksibel.
 * Memeriksa apakah peran pengguna yang login ada di dalam daftar peran yang diizinkan.
 *
 * @param allowedRoles Array dari peran yang diizinkan, cth: ['superadmin', 'admin_group']
 * @returns { profile } Profil pengguna jika validasi berhasil.
 * @throws { Error } Jika peran tidak diizinkan.
 */
export async function validateUserRole(allowedRoles: UserRole[]) {
  const { profile } = await getAuthenticatedUserAndProfile();

  if (!allowedRoles.includes(profile.role)) {
    throw new Error(
      `Akses ditolak. Memerlukan salah satu peran: ${allowedRoles.join(
        ", "
      )}`
    );
  }

  // Kembalikan profil, mungkin berguna untuk service yang memanggil
  return profile;
}

/**
 * ====================================================================
 * HELPER VALIDASI SPESIFIK (EKSPOR)
 * ====================================================================
 *
 * Ini adalah fungsi yang akan Anda panggil dari service lain
 * (seperti masterService, userService, dll.)
 */

/**
 * Memastikan pengguna adalah 'superadmin'.
 */
export async function validateSuperAdmin() {
  return validateUserRole(["superadmin"]);
}

/**
 * Memastikan pengguna adalah 'admin_village'.
 */
export async function validateAdminVillage() {
  return validateUserRole(["admin_village"]);
}

/**
 * Memastikan pengguna adalah 'admin_group'.
 */
export async function validateAdminGroup() {
  return validateUserRole(["admin_group"]);
}

/**
 * Memastikan pengguna adalah 'parent'.
 */
export async function validateParent() {
  return validateUserRole(["parent"]);
}

/**
 * Memastikan pengguna adalah 'user' (peran standar).
 */
export async function validateUser() {
  return validateUserRole(["user"]);
}

/**
 * Memastikan pengguna adalah TIPE admin (salah satu dari admin).
 */
export async function validateAnyAdmin() {
  return validateUserRole(["superadmin", "admin_village", "admin_group"]);
}

/**
 * Memastikan pengguna hanya perlu login (peran apa pun).
 * Berguna untuk halaman/data yang bisa diakses semua pengguna ter-autentikasi.
 */
export async function validateAuthenticatedUser() {
  // Cukup panggil fungsi intinya, yang akan error jika tidak login
  return getAuthenticatedUserAndProfile();
}
