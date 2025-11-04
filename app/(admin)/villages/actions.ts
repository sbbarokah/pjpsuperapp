"use server";

import { revalidatePath } from "next/cache";
import {
  createVillage,
  deleteVillage,
  updateVillage,
} from "@/lib/services/masterService";
import { CreateVillageDto, UpdateVillageDto, VillageModel } from "@/lib/types/master.types";

// Tipe respons standar untuk action
export type ActionResponse<T = any> = {
  success: boolean;
  message: string;
  error?: string | null;
  data?: T | null;
};

const ADMIN_VILLAGES_PATH = "/admin/villages";

/**
 * Membuat Desa baru
 */
export async function createVillageAction(
  data: CreateVillageDto
): Promise<ActionResponse<VillageModel>> {
  try {
    const newVillage = await createVillage(data);
    revalidatePath(ADMIN_VILLAGES_PATH);
    return {
      success: true,
      message: "Desa berhasil dibuat.",
      data: newVillage,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal membuat desa.",
      error: error.message,
    };
  }
}

/**
 * Memperbarui Desa yang ada
 */
export async function updateVillageAction(
  data: UpdateVillageDto
): Promise<ActionResponse<VillageModel>> {
  try {
    const updatedVillage = await updateVillage(data);
    revalidatePath(ADMIN_VILLAGES_PATH);
    revalidatePath(`${ADMIN_VILLAGES_PATH}/${data.id}`);
    return {
      success: true,
      message: "Desa berhasil diperbarui.",
      data: updatedVillage,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal memperbarui desa.",
      error: error.message,
    };
  }
}

/**
 * Menghapus Desa
 */
export async function deleteVillageAction(id: string): Promise<ActionResponse> {
  try {
    await deleteVillage(id);
    revalidatePath(ADMIN_VILLAGES_PATH);
    return {
      success: true,
      message: "Desa berhasil dihapus.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal menghapus desa.",
      error: error.message,
    };
  }
}
