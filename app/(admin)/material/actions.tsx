"use server";

import { createClient } from "@/lib/supabase/server_user";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { revalidatePath } from "next/cache";
import { CreateMaterialDto } from "@/lib/types/material.types";

const ADMIN_PATH = "/admin/materi";

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  profile?: any;
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
 * CREATE Materi
 */
export async function createMaterialAction(payload: CreateMaterialDto): Promise<ActionResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();
  const { error } = await supabase.from("material").insert({
    ...payload,
    author_user_id: authCheck.profile.user_id,
  });

  if (error) {
    console.error("createMaterialAction Error:", error.message);
    return { success: false, message: "Gagal membuat materi.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Materi baru berhasil disimpan." };
}

/**
 * UPDATE Materi
 */
export async function updateMaterialAction(id: string, payload: CreateMaterialDto): Promise<ActionResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();
  const { error } = await supabase.from("material").update(payload).eq("id", id);

  if (error) {
    console.error("updateMaterialAction Error:", error.message);
    return { success: false, message: "Gagal memperbarui materi.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath(`${ADMIN_PATH}/edit/${id}`);
  return { success: true, message: "Materi berhasil diperbarui." };
}

/**
 * DELETE Materi
 */
export async function deleteMaterialAction(id: string): Promise<ActionResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();
  const { error } = await supabase.from("material").delete().eq("id", id);

  if (error) {
    console.error("deleteMaterialAction Error:", error.message);
    return { success: false, message: "Gagal menghapus materi.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Materi berhasil dihapus." };
}