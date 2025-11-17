"use server";

import { createClient } from "@/lib/supabase/server_user";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { revalidatePath } from "next/cache";

const ADMIN_PATH = "/admin/master/kategori-materi";

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

// Helper cek Otorisasi
async function checkAuth(): Promise<ActionResponse | { success: true; profile: any }> {
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canMutate = profile.role === 'superadmin' || profile.role === 'admin_desa';
    if (!canMutate) {
      return { success: false, message: "Akses ditolak: Anda tidak punya izin." };
    }
    return { success: true, profile };
  } catch (error: any) {
    return { success: false, message: "Akses ditolak.", error: error.message };
  }
}

/**
 * CREATE Kategori Materi
 */
export async function createCategoryAction(payload: { name: string, description: string }): Promise<ActionResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();
  const { error } = await supabase.from("material_category").insert(payload);

  if (error) {
    console.error("createCategoryAction Error:", error.message);
    return { success: false, message: "Gagal membuat kategori.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Kategori baru berhasil disimpan." };
}

/**
 * UPDATE Kategori Materi
 */
export async function updateCategoryAction(id: number, payload: { name: string, description: string }): Promise<ActionResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();
  const { error } = await supabase.from("material_category").update(payload).eq("id", id);

  if (error) {
    console.error("updateCategoryAction Error:", error.message);
    return { success: false, message: "Gagal memperbarui kategori.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath(`${ADMIN_PATH}/edit/${id}`);
  return { success: true, message: "Kategori berhasil diperbarui." };
}

/**
 * DELETE Kategori Materi
 */
export async function deleteCategoryAction(id: number): Promise<ActionResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();
  // TODO: Cek jika kategori ini sedang dipakai oleh 'material'
  
  const { error } = await supabase.from("material_category").delete().eq("id", id);

  if (error) {
    console.error("deleteCategoryAction Error:", error.message);
    return { success: false, message: "Gagal menghapus kategori.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Kategori berhasil dihapus." };
}