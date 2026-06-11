"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { revalidatePath } from "next/cache";
import { getUserMaterialRecap, saveUserMaterialRecap } from "@/lib/services/controlService";
import { PageStatus } from "@/lib/types/control.types";

export async function saveMaterialAction(data: { id?: number; name: string; total_pages: number; notes?: string }) {
  try {
    const supabase = createAdminClient();

    if (data.id) {
      // UPDATE MATERI
      const { error } = await supabase
        .from("control_material")
        .update({
          name: data.name,
          total_pages: data.total_pages,
          notes: data.notes,
        })
        .eq("id", data.id);
      
      if (error) throw error;
    } else {
      // INSERT MATERI BARU
      const { error } = await supabase
        .from("control_material")
        .insert([{
          name: data.name,
          total_pages: data.total_pages,
          notes: data.notes,
        }]);

      if (error) throw error;
    }

    revalidatePath("/control");
    return { success: true, message: "Materi berhasil disimpan." };
  } catch (error: any) {
    console.error("Save Material Error:", error);
    return { success: false, message: error.message || "Gagal menyimpan materi." };
  }
}

export async function deleteMaterialAction(id: number) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("control_material").delete().eq("id", id);
    
    if (error) throw error;

    revalidatePath("/control");
    return { success: true, message: "Materi berhasil dihapus." };
  } catch (error: any) {
    console.error("Delete Material Error:", error);
    return { success: false, message: error.message || "Gagal menghapus materi." };
  }
}

// 1. Fetch Generus secara dinamis berdasarkan Kelompok dan Kategori
export async function fetchGenerusForControlAction(groupId: number, categoryId: number) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profile")
      .select("user_id, full_name, username, group_id, category_id")
      .eq("group_id", groupId)
      .eq("category_id", categoryId)
      .order("full_name", { ascending: true });

    if (error) throw error;
    
    return { success: true, data };
  } catch (err: any) {
    console.error("Fetch Generus Error:", err);
    return { success: false, message: err.message };
  }
}

// 2. Memuat Array Recap JSONB dari DB
export async function loadUserMaterialRecapAction(userId: string, materialId: number) {
  try {
    const recapArray = await getUserMaterialRecap(userId, materialId);
    return { success: true, recapitulation: recapArray };
  } catch (err: any) {
    return { success: false, recapitulation: [] };
  }
}

// 3. Simpan Perubahan Satu Halaman
export async function saveUserMaterialRecapAction(userId: string, materialId: number, pageNumber: number, status: PageStatus) {
  try {
    const currentRecap = await getUserMaterialRecap(userId, materialId);
    const targetIndex = pageNumber - 1;
    const newRecap = [...currentRecap];
    
    // Auto-fill "E" jika ada gap index
    while (newRecap.length <= targetIndex) {
      newRecap.push("E");
    }
    newRecap[targetIndex] = status;

    await saveUserMaterialRecap(userId, materialId, newRecap);
    return { success: true };
  } catch (err: any) {
    console.error("Save Recap Error:", err);
    return { success: false, message: err.message };
  }
}

// 4. Simpan Masal (Bulk Update)
export async function saveBulkUserMaterialRecapAction(userId: string, materialId: number, startPage: number, endPage: number, status: PageStatus) {
  try {
    const currentRecap = await getUserMaterialRecap(userId, materialId);
    const newRecap = [...currentRecap];
    
    const targetEndIndex = endPage - 1;
    while (newRecap.length <= targetEndIndex) {
      newRecap.push("E");
    }

    for (let i = startPage - 1; i <= targetEndIndex; i++) {
      newRecap[i] = status;
    }

    await saveUserMaterialRecap(userId, materialId, newRecap);
    return { success: true };
  } catch (err: any) {
    console.error("Save Bulk Recap Error:", err);
    return { success: false, message: err.message };
  }
}

export async function saveFullUserMaterialRecapAction(userId: string, materialId: number, recapitulation: PageStatus[]) {
  try {
    await saveUserMaterialRecap(userId, materialId, recapitulation);
    return { success: true };
  } catch (err: any) {
    console.error("Save Full Recap Error:", err);
    return { success: false, message: err.message };
  }
}