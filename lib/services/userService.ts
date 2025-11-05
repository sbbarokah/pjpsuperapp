"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { revalidatePath } from "next/cache";
import {
  CreateUserFormPayload,
  UpdateUserFormPayload,
  UserAdminView,
} from "../types/user.types";

/**
 * Tipe data untuk admin yang sedang login.
 * Sebaiknya letakkan ini di file 'user.types.ts' Anda.
 */
export type CurrentAdminUser = {
  role: string;
  village_id?: string | null;
  group_id?: string | null;
};

/**
 * Mendapatkan daftar semua pengguna untuk panel admin,
 * dengan filter berdasarkan role admin yang login.
 *
 * @param admin - Objek berisi data admin yang sedang login (role, village_id, group_id)
 */
export async function getUsersForAdmin(
  admin: CurrentAdminUser
): Promise<UserAdminView[]> {
  // [CATATAN EFISIENSI]
  // Peringatan ini SANGAT PENTING:
  // Logika baru ini memfilter 'profiles' (Bagus), TAPI masih mengambil
  // SEMUA 'authUsers' (Langkah 4).
  // Jika admin_desa punya 50 user, kode ini tetap mengambil 10.000 auth users
  // hanya untuk menggabungkan 50 email.
  //
  // REKOMENDASI TETAP SAMA:
  // Gunakan SQL Function (RPC) di Supabase agar filtering dan join
  // terjadi di database. Ini adalah solusi yang paling mangkus.

  const supabase = createAdminClient();

  // 1. [PERUBAHAN] Buat query builder untuk 'profile'
  let profileQuery = supabase
    .from("profile")
    .select(
      `
      *,
      village (name),
      group (name),
      category (name)
    `
    );

  // 2. [LOGIKA BARU] Terapkan filter berdasarkan role admin
  switch (admin.role) {
    case "superadmin":
      // Tidak perlu filter, ambil semua
      break;

    case "admin_desa":
      if (!admin.village_id) {
        console.warn("Admin Desa tidak memiliki village_id. Mengembalikan 0 users.");
        return [];
      }
      // Tambahkan WHERE village_id = '...'
      profileQuery = profileQuery.eq("village_id", admin.village_id);
      break;

    case "admin_kelompok":
      if (!admin.group_id) {
        console.warn("Admin Kelompok tidak memiliki group_id. Mengembalikan 0 users.");
        return [];
      }
      // Tambahkan WHERE group_id = '...'
      profileQuery = profileQuery.eq("group_id", admin.group_id);
      break;

    default:
      // Role lain (misal: 'user' biasa) tidak boleh melihat daftar user
      console.warn(`Role '${admin.role}' tidak diizinkan mengakses getUsersForAdmin.`);
      return [];
  }

  // 3. [PERUBAHAN] Eksekusi query 'profile' yang sudah dinamis
  const { data: profiles, error: profileError } = await profileQuery;

  if (profileError) {
    console.error("Error fetching filtered profiles:", profileError.message);
    throw new Error(profileError.message);
  }
  
  // Jika tidak ada profil yang cocok, langsung kembalikan array kosong
  if (!profiles || profiles.length === 0) {
    return [];
  }

  // 4. Dapatkan semua data user dari auth (Tetap tidak efisien)
  const {
    data: { users: authUsers },
    error: authError,
  } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error("Error fetching auth users:", authError.message);
    throw new Error(authError.message);
  }

  // 5. Buat Map untuk pencarian email yang efisien
  const authUserMap = new Map(authUsers.map((user) => [user.id, user]));

  // 6. Gabungkan data (sekarang 'profiles' sudah terfilter)
  const combinedUsers: UserAdminView[] = profiles.map((profile) => {
    const authUser = authUserMap.get(profile.user_id);
    return {
      ...profile,
      email: authUser?.email || "N/A",
      // Pastikan 'group' dan 'class' adalah objek atau null
      group: profile.group ? { name: profile.group.name } : null,
      class: profile.class ? { name: profile.class.name } : null,
    };
  });

  return combinedUsers;
}

/**
 * Mendapatkan detail satu pengguna berdasarkan user_id (Auth ID)
 * @param userId - ID dari auth.users
 */
export async function getUserDetails(userId: string) {
  const supabase = createAdminClient();

  // 1. Dapatkan data profile
  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select(
      `
      *,
      group (*),
      class (*)
    `
    )
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError?.message);
    throw new Error(profileError?.message || "Profile not found");
  }

  // 2. Dapatkan data auth
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.admin.getUserById(userId);

  if (authError || !authUser) {
    console.error("Error fetching auth user:", authError?.message);
    throw new Error(authError?.message || "Auth user not found");
  }

  // 3. Gabungkan
  return {
    ...profile,
    email: authUser.email,
  };
}

/**
 * Membuat pengguna baru (Auth + Profile)
 */
export async function createUser(data: CreateUserFormPayload) {
  const supabase = createAdminClient();

  // 1. Buat user di Supabase Auth
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

  if (authError) {
    console.error("Error creating auth user:", authError.message);
    // [PERBAIKAN] Kembalikan objek error standar
    return { error: authError.message };
  }

  // 2. Buat profile di tabel 'profile'
  const { error: profileError } = await supabase.from("profile").insert({
    user_id: authUser.user.id,
    username: data.username,
    front_name: data.front_name,
    last_name: data.last_name,
    gender: data.gender,
    birth_date: data.birth_date || null,
    village_id: data.village_id || null,
    group_id: data.group_id || null,
    category_id: data.category_id || null,
    school_level: data.school_level || null,
    school_name: data.school_name || null,
    father_name: data.father_name || null,
    father_occupation: data.father_occupation || null,
    mother_name: data.mother_name || null,
    mother_occupation: data.mother_occupation || null,
    parent_contact: data.parent_contact || null,
  });

  if (profileError) {
    console.error("Error creating profile:", profileError.message);

    // [PERBAIKAN KRITIS] Implementasi Rollback.
    // Hapus auth user yang baru dibuat jika profil GAGAL dibuat.
    // Ini mencegah "orphaned auth user".
    await supabase.auth.admin.deleteUser(authUser.user.id);
    console.error("Rollback: Deleted auth user", authUser.user.id);

    // [PERBAIKAN] Kembalikan objek error standar
    return { error: profileError.message };
  }

  // [PERBAIKAN] Hapus revalidatePath dari service.
  // revalidatePath("/users");

  // [PERBAIKAN] Kembalikan data pengguna yang baru dibuat, bukan pesan.
  return { success: true, data: authUser.user };
}

/**
 * Memperbarui data pengguna (Auth email + Profile)
 */
export async function updateUser(userId: string, data: UpdateUserFormPayload) {
  const supabase = createAdminClient();
  let authDataUpdated = false;
  let profileDataUpdated = false;

  // 1. Update data auth (jika ada)
  if (data.email) {
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { email: data.email }
    );
    if (authError) {
      console.error("Error updating auth user:", authError.message);
      return { error: authError.message };
    }
    authDataUpdated = true;
  }

  // 2. Update data profile
  // [CATATAN] Pastikan data.profileData tidak kosong jika email tidak di-pass
  if (data.profileData && Object.keys(data.profileData).length > 0) {
    const { error: profileError } = await supabase
      .from("profile")
      .update(data.profileData)
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError.message);
      return { error: profileError.message };
    }
    profileDataUpdated = true;
  }

  // [CATATAN] Jika tidak ada data email atau profile, tidak ada yang diupdate.
  if (!authDataUpdated && !profileDataUpdated) {
    return { error: "Tidak ada data untuk diperbarui." };
  }
  
  // [PERBAIKAN] Hapus revalidatePath
  // revalidatePath("/users");
  // revalidatePath(`/users/${userId}`);
  return { success: true };
}

/**
 * Menghapus pengguna (Profile + Auth)
 */
export async function deleteUser(userId: string) {
  const supabase = createAdminClient();

  // [CATATAN] Logika Anda saat ini (hapus profile, lalu auth)
  // adalah benar JIKA 'ON DELETE CASCADE' TIDAK diatur.
  //
  // Namun, ini BERISIKO. Jika hapus profile (1) berhasil,
  // tapi hapus auth user (2) GAGAL (misal error jaringan),
  // Anda akan memiliki 'orphaned auth user' (auth user tanpa profil).
  //
  // REKOMENDASI:
  // Atur 'ON DELETE CASCADE' pada Foreign Key 'user_id' di tabel 'profile' Anda.
  // Jika sudah, Anda HANYA perlu menjalankan `supabase.auth.admin.deleteUser(userId)`.
  // Profil akan terhapus otomatis, dan ini bersifat transaksional (jika auth gagal, profil aman).
  //
  // Kode di bawah ini saya biarkan sesuai logika awal Anda, tapi saya
  // tetap merekomendasikan 'ON DELETE CASCADE'.

  // 1. Hapus profile
  const { error: profileError } = await supabase
    .from("profile")
    .delete()
    .eq("user_id", userId);

  if (profileError) {
    console.error("Error deleting profile:", profileError.message);
    return { error: profileError.message };
  }

  // 2. Hapus auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("Error deleting auth user:", authError.message);
    // Ini adalah state error parsial (profile terhapus, auth gagal)
    return { error: authError.message };
  }

  // [PERBAIKAN] Hapus revalidatePath
  // revalidatePath("/users");
  return { success: true };
}