import { createAdminClient } from "@/lib/supabase/server_admin";
// Hapus import 'createServerUserClient' karena sudah tidak dipakai di sini
import {
  CategoryModel,
  CreateCategoryDto,
  CreateGroupDto,
  CreateVillageDto,
  GroupModel,
  UpdateCategoryDto,
  UpdateGroupDto,
  UpdateVillageDto,
  VillageModel,
} from "@/lib/types/master.types";
// Hapus import 'Profile' karena sudah tidak dipakai di sini

// ⬇️ UBAH IMPORT INI ⬇️
// Impor validator spesifik dari service auth baru kita
import { validateSuperAdmin } from "@/lib/services/authService";

// ====================================================================
//
//                          VILLAGE SERVICE
//
// ====================================================================

/**
 * Membuat Village baru (Hanya Superadmin)
 */
export async function createVillage(villageData: CreateVillageDto) {
  await validateSuperAdmin(); // 🔒 LANGKAH 1: Validasi (SEKARANG MEMAKAI FUNGSI GLOBAL)
  const supabase = createAdminClient(); // 🚀 LANGKAH 2: Eksekusi

  const { data, error } = await supabase
    .from("village")
    .insert(villageData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Mengambil semua data Village
 * (Asumsi: Boleh dibaca publik/pengguna terotentikasi, jadi TIDAK perlu validasi)
 */
export async function getVillages() {
  // TIDAK perlu `validateSuperAdmin()` jika data ini bersifat publik/semi-publik
  
  // Kita bisa gunakan `server_user` atau `server_admin` di sini.
  // `server_admin` lebih sederhana karena melewati RLS
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("village").select("*");

  if (error) throw new Error(error.message);
  return data as VillageModel[];
}

/**
 * Mengambil satu desa berdasarkan ID-nya.
 */
export async function getVillageById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("village")
    .select("*")
    .eq("id", id) // Filter berdasarkan ID
    .single(); // Ambil satu data (atau null jika tidak ada)

  if (error) {
    // Jika data tidak ditemukan, .single() akan menghasilkan error
    // 'PGRST116' (PostgREST)
    console.warn(`Error fetching village ${id}:`, error.message);
    return null; // Kembalikan null jika tidak ditemukan atau error
  }

  return data as VillageModel | null;
}

/**
 * Mengupdate Village (Hanya Superadmin)
 */
export async function updateVillage(villageData: UpdateVillageDto) {
  await validateSuperAdmin(); // 🔒 LANGKAH 1: Validasi
  const supabase = createAdminClient(); // 🚀 LANGKAH 2: Eksekusi
  const { id, ...updateData } = villageData;

  const { data, error } = await supabase
    .from("village")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Menghapus Village (Hanya Superadmin)
 */
export async function deleteVillage(id: string) {
  await validateSuperAdmin(); // 🔒 LANGKAH 1: Validasi
  const supabase = createAdminClient(); // 🚀 LANGKAH 2: Eksekusi

  const { error } = await supabase.from("village").delete().eq("id", id);

  if (error) throw new Error(error.message);
  return { message: "Village deleted successfully" };
}

// ====================================================================
//
//                          GROUP SERVICE
// (Struktur sama persis dengan Village)
//
// ====================================================================

export async function createGroup(groupData: CreateGroupDto) {
  await validateSuperAdmin(); // 🔒 Validasi
  const supabase = createAdminClient(); // 🚀 Eksekusi

  const { data, error } = await supabase
    .from("group")
    .insert(groupData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getGroups() {
  // Asumsi 'get' bisa dilakukan oleh semua user
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("group").select("*");

  if (error) throw new Error(error.message);
  return data as GroupModel[];
}

/**
 * Mengambil satu kelompok berdasarkan ID-nya.
 */
export async function getGroupById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("group")
    .select("*")
    .eq("id", id) // Filter berdasarkan ID
    .single(); // Ambil satu data (atau null jika tidak ada)

  if (error) {
    // Jika data tidak ditemukan, .single() akan menghasilkan error
    // 'PGRST116' (PostgREST)
    console.warn(`Error fetching group ${id}:`, error.message);
    return null; // Kembalikan null jika tidak ditemukan atau error
  }

  return data as GroupModel | null;
}

/**
 * Mengambil daftar grup berdasarkan village_id.
 * Dibuat khusus untuk form impor admin_desa.
 */
export async function getGroupsByVillage(villageId: string | number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("group")
    .select("*")
    .eq("village_id", villageId);

  if (error) {
    console.error("Error fetching groups by village:", error.message);
    return [];
  }
  return data;
}

export async function updateGroup(groupData: UpdateGroupDto) {
  await validateSuperAdmin(); // 🔒 Validasi
  const supabase = createAdminClient(); // 🚀 Eksekusi
  const { id, ...updateData } = groupData;

  const { data, error } = await supabase
    .from("group")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteGroup(id: string) {
  await validateSuperAdmin(); // 🔒 Validasi
  const supabase = createAdminClient(); // 🚀 Eksekusi

  const { error } = await supabase.from("group").delete().eq("id", id);

  if (error) throw new Error(error.message);
  return { message: "Group deleted successfully" };
}

// ====================================================================
//
//                          CATEGORY SERVICE
// (Struktur sama persis dengan Village)
//
// ====================================================================

export async function createCategory(categoryData: CreateCategoryDto) {
  await validateSuperAdmin(); // 🔒 Validasi
  const supabase = createAdminClient(); // 🚀 Eksekusi

  const { data, error } = await supabase
    .from("category")
    .insert(categoryData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getCategories() {
  // Asumsi 'get' bisa dilakukan oleh semua user
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("category").select("*");

  if (error) throw new Error(error.message);
  return data as CategoryModel[];
}

/**
 * Mengambil satu kategori berdasarkan ID-nya.
 */
export async function getCategoryById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("category")
    .select("*")
    .eq("id", id) // Filter berdasarkan ID
    .single(); // Ambil satu data (atau null jika tidak ada)

  if (error) {
    // Jika data tidak ditemukan, .single() akan menghasilkan error
    // 'PGRST116' (PostgREST)
    console.warn(`Error fetching category ${id}:`, error.message);
    return null; // Kembalikan null jika tidak ditemukan atau error
  }

  return data as CategoryModel | null;
}

export async function updateCategory(categoryData: UpdateCategoryDto) {
  await validateSuperAdmin(); // 🔒 Validasi
  const supabase = createAdminClient(); // 🚀 Eksekusi
  const { id, ...updateData } = categoryData;

  const { data, error } = await supabase
    .from("category")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id: string) {
  await validateSuperAdmin(); // 🔒 Validasi
  const supabase = createAdminClient(); // 🚀 Eksekusi

  const { error } = await supabase.from("category").delete().eq("id", id);

  if (error) throw new Error(error.message);
  return { message: "Category deleted successfully" };
}

