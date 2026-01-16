"use server";


import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { revalidatePath } from "next/cache";
import {
  CreateEvaluationPayload,
  EvaluationRawData,
  EvaluationRecapModel,
  EvaluationRowState,
  UpdateEvaluationPayload,
} from "@/lib/types/evaluation.types";
import { Profile } from "@/lib/types/user.types";
import { createClient } from "@/lib/supabase/server_user";
import { createAdminClient } from "@/lib/supabase/server_admin";
import { MaterialWithRelations } from "@/lib/types/material.types";
import { MaterialCategoryModel } from "@/lib/types/master.types";

const ADMIN_PATH = "/kbmevaluation";

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  profile?: Profile;
};

// ... (Helper 'checkAuth' tetap sama) ...
async function checkAuth(
  villageId?: number,
  groupId?: number
): Promise<ActionResponse | { success: true; profile: Profile }> {
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (authError: any) {
    return { success: false, message: "Akses ditolak.", error: authError.message };
  }
  const canAccess = profile.role === "admin_desa" || profile.role === "admin_kelompok";
  if (!canAccess) return { success: false, message: "Hanya admin yang diizinkan." };
  if (villageId && profile.village_id !== villageId) return { success: false, message: "Akses ke data desa lain ditolak." };
  if (profile.role === "admin_kelompok" && groupId && profile.group_id !== groupId) return { success: false, message: "Akses ke data kelompok lain ditolak." };
  return { success: true, profile };
}


/**
 * [REVISI] Helper untuk mengubah state form (array)
 * menjadi struktur JSONB (objek)
 */
function processAndBuildJson(
  rows: EvaluationRowState[]
): EvaluationRawData {
  // Filter baris yang kosong (tanpa materi), lalu map ke struktur baru
  return rows
    .filter(row => row.material_id && row.material_category_id)
    .map(row => ({
      material_id: row.material_id,
      material_name: row.material_name,
      material_category_id: row.material_category_id, // Simpan ini!
      material_category_name: row.material_category_name,
      scores: row.scores,
      evaluation_note: row.evaluation_note || "",
      show_details: row.show_details || false,
    }));
}

function processAndBuildJson2(
  rows: EvaluationRowState[]
): EvaluationRawData {
  const rawData: any = {};
  
  for (const row of rows) {
    // Hanya proses jika material_id dipilih
    if (row.material_id) {
      rawData[row.material_id] = {
        material_category_id: row.material_category_id,
        material_id: row.material_id,
        scores: row.scores,
        evaluation_note: row.evaluation_note || "", // Pastikan ada string kosong
      };
    }
  }
  return rawData;
}

/**
 * [REVISI] CREATE Rekap Penilaian
 */
export async function createEvaluationAction(
  payload: CreateEvaluationPayload
): Promise<ActionResponse> {
  const authCheck = await checkAuth(undefined, payload.group_id);
  if (!authCheck.success) return authCheck;

  const { profile } = authCheck;
  const supabase = await createClient();

  // 1. Proses data mentah
  const raw_data = processAndBuildJson(payload.evaluationRows);

  const dataToInsert: Omit<EvaluationRecapModel, "id" | "created_at" | "author_user_id"> = {
    group_id: payload.group_id,
    village_id: profile?.village_id as number,
    category_id: payload.category_id,
    period_month: payload.period_month,
    period_year: payload.period_year,
    achievement: payload.achievement,
    challenges: payload.challenges,
    solutions: payload.solutions,
    notes: payload.notes,
    raw_data: raw_data,
  };

  // 2. Insert ke DB
  const { error } = await supabase.from("evaluation_recap").insert({
    ...dataToInsert,
    author_user_id: profile?.user_id,
  });

  if (error) {
    console.error("createEvaluationAction Error:", error.message);
    return { success: false, message: "Gagal menyimpan rekap.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Rekap penilaian berhasil disimpan." };
}

/**
 * [REVISI] UPDATE Rekap Penilaian
 */
export async function updateEvaluationAction(
  payload: UpdateEvaluationPayload
): Promise<ActionResponse> {
  const { id, ...data } = payload;
  const authCheck = await checkAuth(undefined, data.group_id);
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();

  // Cek kepemilikan
  const { data: existing } = await supabase.from("evaluation_recap").select("village_id").eq("id", id).single();
  if (existing?.village_id !== authCheck.profile?.village_id) {
    return { success: false, message: "Akses ditolak." };
  }

  // 1. Proses data mentah
  const raw_data = processAndBuildJson(data.evaluationRows);

  const dataToUpdate: Partial<EvaluationRecapModel> = {
    group_id: data.group_id,
    category_id: data.category_id,
    period_month: data.period_month,
    period_year: data.period_year,
    achievement: data.achievement,
    challenges: data.challenges,
    solutions: data.solutions,
    notes: data.notes, // Menggunakan 'notes'
    raw_data: raw_data,
  };
  
  // 2. Update DB
  const { error } = await supabase
    .from("evaluation_recap")
    .update(dataToUpdate)
    .eq("id", id);

  if (error) {
    console.error("updateEvaluationAction Error:", error.message);
    return { success: false, message: "Gagal memperbarui rekap.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath(`${ADMIN_PATH}/edit/${id}`);
  return { success: true, message: "Rekap penilaian berhasil diperbarui." };
}

/**
 * DELETE Rekap Penilaian
 */
export async function deleteEvaluationRecapAction(id: string): Promise<ActionResponse> {
  // ... (Logika delete tetap sama) ...
  const supabase = await createClient();

  const { data: existing } = await supabase.from("evaluation_recap").select("village_id, group_id").eq("id", id).single();
  if (!existing) return { success: false, message: "Data tidak ditemukan." };
  const authCheck = await checkAuth(existing.village_id, existing.group_id);
  if (!authCheck.success) return authCheck;
  const { error } = await supabase.from("evaluation_recap").delete().eq("id", id);
  if (error) return { success: false, message: "Gagal menghapus rekap.", error: error.message };
  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Rekap penilaian berhasil dihapus." };
}

/**
 * [UNTUK FORM] Mengambil daftar generus
 */
type GenerusResponse = {
  success: boolean;
  data?: Pick<Profile, "user_id" | "full_name">[];
  error?: string;
};
export async function getGenerusForFormAction(
  groupId: number,
  categoryId: number
): Promise<GenerusResponse> {
  const authCheck = await checkAuth(undefined, groupId);
  if (!authCheck.success) return { success: false, error: authCheck.message };
  const supabase = await createAdminClient();

  const { data, error } = await supabase.from("profile").select("user_id, full_name")
    // .eq("role", "user")
    .eq("group_id", String(groupId))
    .eq("category_id", String(categoryId))
    .order("full_name");
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * [REVISI] Mengambil SEMUA daftar materi untuk populasi dropdown
 * Kita tidak memfilter by category di sini, karena filtering dilakukan di client (per row)
 */
export async function getAllMaterialsForFormAction(): Promise<MaterialsResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return { success: false, error: authCheck.message };
  
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("material")
    .select("*, material_category (name)")
    .order("material_name");
    
  if (error) {
    console.error("getAllMaterialsForFormAction Error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as MaterialWithRelations[] };
}

/**
 * [MODIFIKASI] Mengambil daftar materi berdasarkan KATEGORI SISWA
 * (Asumsi: Kategori siswa sama dengan kategori materi)
 */
type MaterialsResponse = {
  success: boolean;
  data?: MaterialWithRelations[];
  error?: string;
};
export async function getMaterialsForFormAction(
  studentCategoryId: number // Ini ID dari tabel 'category' (Caberawit, Praja, dll)
): Promise<MaterialsResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return { success: false, error: authCheck.message };
  
  const supabase = await createAdminClient();

  // [LOGIKA BARU]
  // Kita asumsikan 'category.id' (Praja) == 'material_category.id' (Praja)
  // Jika tidak, Anda perlu tabel penghubung (mapping table)
  
  const { data, error } = await supabase
    .from("material")
    .select("*, material_category (name)")
    // [FIX] Filter materi berdasarkan Kategori Generus (cth: Praja)
    .eq("material_category_id", studentCategoryId) 
    .order("material_name");
    
  if (error) {
    console.error("getMaterialsForFormAction Error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as MaterialWithRelations[] };
}


/**
 * [BARU] Mengambil daftar KATEGORI MATERI
 * (Aqidah, Fiqih, dll)
 */
type MaterialCategoriesResponse = {
  success: boolean;
  data?: MaterialCategoryModel[];
  error?: string;
};
export async function getMaterialCategoriesForFormAction(): Promise<MaterialCategoriesResponse> {
  const authCheck = await checkAuth();
  if (!authCheck.success) return { success: false, error: authCheck.message };
  
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("material_category")
    .select("*")
    .order("name");
    
  if (error) {
    console.error("getMaterialCategoriesForFormAction Error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data: data as MaterialCategoryModel[] };
}