"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { revalidatePath } from "next/cache";
import {
  CreateUserFormPayload,
  UpdateUserFormPayload,
  UserAdminView,
} from "../types/user.types";

/**
 * Mendapatkan daftar semua pengguna untuk panel admin.
 * Fungsi ini menggabungkan data dari auth.users, profile, group, dan class.
 * Ini memerlukan hak akses admin pada Supabase client.
 */
export async function getUsersForAdmin(): Promise<UserAdminView[]> {
  const supabase = createAdminClient();

  // 1. Dapatkan semua data profile beserta relasinya
  const { data: profiles, error: profileError } = await supabase
    .from("profile")
    .select(
      `
      *,
      group (name),
      class (name)
    `
    );

  if (profileError) {
    console.error("Error fetching profiles:", profileError.message);
    throw new Error(profileError.message);
  }

  // 2. Dapatkan semua data user dari auth
  // PENTING: Ini memerlukan koneksi Supabase dengan 'service_role' key
  // yang seharusnya sudah diatur di lib/supabase/server.ts
  const {
    data: { users: authUsers },
    error: authError,
  } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error("Error fetching auth users:", authError.message);
    throw new Error(authError.message);
  }

  // 3. Buat Map untuk pencarian email yang efisien
  const authUserMap = new Map(authUsers.map((user) => [user.id, user]));

  // 4. Gabungkan data
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
 * @param data - Payload dari form
 */
export async function createUser(data: CreateUserFormPayload) {
  const supabase = createAdminClient();

  // 1. Buat user di Supabase Auth
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Asumsi kita langsung konfirmasi email
    });

  if (authError) {
    console.error("Error creating auth user:", authError.message);
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
    // Pastikan mengirim null jika group_id/category_id kosong
    group_id: data.group_id || null,
    category_id: data.category_id || null,
  });

  if (profileError) {
    console.error("Error creating profile:", profileError.message);
    // CATATAN: Di produksi, Anda mungkin ingin menghapus auth user yang baru dibuat jika profile gagal
    // await supabase.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  // 3. Revalidasi path agar daftar user di /users ter-update
  revalidatePath("/users");
  return { success: true };
}

/**
 * Memperbarui data pengguna (Auth email + Profile)
 * @param userId - ID dari auth.users
 * @param data - Payload dari form
 */
export async function updateUser(userId: string, data: UpdateUserFormPayload) {
  const supabase = createAdminClient();

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
  }

  // 2. Update data profile
  const { error: profileError } = await supabase
    .from("profile")
    .update(data.profileData)
    .eq("user_id", userId);

  if (profileError) {
    console.error("Error updating profile:", profileError.message);
    return { error: profileError.message };
  }

  // 3. Revalidasi path
  revalidatePath("/users");
  revalidatePath(`/users/${userId}`); // Jika ada halaman detail
  return { success: true };
}

/**
 * Menghapus pengguna (Profile + Auth)
 * @param userId - ID dari auth.users
 */
export async function deleteUser(userId: string) {
  const supabase = createAdminClient();

  // PENTING:
  // Sebaiknya atur Foreign Key di tabel 'profile' (kolom 'user_id')
  // agar memiliki 'ON DELETE CASCADE'.
  // Jika sudah, Anda HANYA perlu menghapus auth user, dan profile akan terhapus otomatis.

  // 1. Hapus profile (jika cascade tidak diatur)
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
    // Profil sudah terhapus, jadi ini adalah error parsial
    return { error: authError.message };
  }

  // 3. Revalidasi path
  revalidatePath("/users");
  return { success: true };
}