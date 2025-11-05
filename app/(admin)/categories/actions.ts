"use server";

import { revalidatePath } from "next/cache";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/services/masterService";
import {
  CategoryModel,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/lib/types/master.types";

// Tipe respons standar untuk action
export type ActionResponse<T = any> = {
  success: boolean;
  message: string;
  error?: string | null;
  data?: T | null;
};

const ADMIN_CATEGORIES_PATH = "/categories";

/**
 * Membuat Kategori baru
 * @param data Data kategori baru dari form
 */
export async function createCategoryAction(
  data: CreateCategoryDto
): Promise<ActionResponse<CategoryModel>> {
  try {
    // Service 'createCategory' sudah memiliki 'validateSuperAdmin' di dalamnya
    const newCategory = await createCategory(data);

    // Revalidasi path agar daftar kategori di UI ter-update
    revalidatePath(ADMIN_CATEGORIES_PATH);

    return {
      success: true,
      message: "Kategori berhasil dibuat.",
      data: newCategory,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal membuat kategori.",
      error: error.message,
    };
  }
}

/**
 * Memperbarui Kategori yang ada
 * @param data Data kategori yang akan diupdate (termasuk 'id')
 */
export async function updateCategoryAction(
  data: UpdateCategoryDto
): Promise<ActionResponse<CategoryModel>> {
  try {
    const updatedCategory = await updateCategory(data);

    // Revalidasi path utama dan path detail (jika ada)
    revalidatePath(ADMIN_CATEGORIES_PATH);
    revalidatePath(`${ADMIN_CATEGORIES_PATH}/${data.id}`);

    return {
      success: true,
      message: "Kategori berhasil diperbarui.",
      data: updatedCategory,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal memperbarui kategori.",
      error: error.message,
    };
  }
}

/**
 * Menghapus Kategori
 * @param id ID kategori yang akan dihapus
 */
export async function deleteCategoryAction(
  id: string,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  
  // Validasi (jika 'deleteCategory' belum melakukannya)
  try {
    // 'deleteCategory' sudah memiliki 'validateSuperAdmin()' di dalamnya
    // jadi kita bisa panggil langsung.
    const result = await deleteCategory(id);

    // Sukses: Bersihkan cache path
    revalidatePath("/categories");

    return { success: true, message: result.message };

  } catch (error) {
    // Tangkap error (cth: dari validasi atau database)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    
    // Kirim pesan error yang aman ke klien
    return { success: false, error: message };
  }
}