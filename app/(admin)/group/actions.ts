"use server";

import { revalidatePath } from "next/cache";
import {
  createGroup,
  deleteGroup,
  updateGroup,
} from "@/lib/services/masterService";
import { CreateGroupDto, GroupModel, UpdateGroupDto } from "@/lib/types/master.types";

// Tipe respons standar untuk action
export type ActionResponse<T = any> = {
  success: boolean;
  message: string;
  error?: string | null;
  data?: T | null;
};

const ADMIN_GROUPS_PATH = "/groups";

/**
 * Membuat Grup baru
 */
export async function createGroupAction(
  data: CreateGroupDto
): Promise<ActionResponse<GroupModel>> {
  try {
    const newGroup = await createGroup(data);
    revalidatePath(ADMIN_GROUPS_PATH);
    return {
      success: true,
      message: "Grup berhasil dibuat.",
      data: newGroup,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal membuat grup.",
      error: error.message,
    };
  }
}

/**
 * Memperbarui Grup yang ada
 */
export async function updateGroupAction(
  data: UpdateGroupDto
): Promise<ActionResponse<GroupModel>> {
  try {
    const updatedGroup = await updateGroup(data);
    revalidatePath(ADMIN_GROUPS_PATH);
    revalidatePath(`${ADMIN_GROUPS_PATH}/${data.id}`);
    return {
      success: true,
      message: "Grup berhasil diperbarui.",
      data: updatedGroup,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal memperbarui grup.",
      error: error.message,
    };
  }
}

/**
 * Menghapus Grup
 */
export async function deleteGroupAction(id: string): Promise<ActionResponse> {
  try {
    await deleteGroup(id);
    revalidatePath(ADMIN_GROUPS_PATH);
    return {
      success: true,
      message: "Grup berhasil dihapus.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal menghapus grup.",
      error: error.message,
    };
  }
}
