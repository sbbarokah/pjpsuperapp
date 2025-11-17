"use server";

import { createClient } from "@/lib/supabase/server_user";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { revalidatePath } from "next/cache";
import {
  AttendanceRecapModel,
  CreateRecapPayload,
  UpdateRecapPayload,
} from "@/lib/types/attendance.types";
import { Profile } from "@/lib/types/user.types";

const ADMIN_PATH = "/kbmattendance";

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
  profile?: Profile;
};

// Helper untuk Otorisasi
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

  const canAccess =
    profile.role === "admin_desa" || profile.role === "admin_kelompok";
  if (!canAccess) {
    return { success: false, message: "Hanya admin yang diizinkan." };
  }

  // Cek otorisasi data (jika ID disediakan)
  if (villageId && profile.village_id !== villageId) {
    return { success: false, message: "Akses ke data desa lain ditolak." };
  }
  if (
    profile.role === "admin_kelompok" &&
    groupId &&
    profile.group_id !== groupId
  ) {
    return { success: false, message: "Akses ke data kelompok lain ditolak." };
  }

  return { success: true, profile };
}

/**
 * Kalkulasi rekapitulasi di server
 */
function calculateRecap(
  payload: CreateRecapPayload
): Omit<AttendanceRecapModel, "id" | "created_at" | "author_user_id" | "village_id"> {
  const generus_count = Object.keys(payload.raw_data).length;
  const meeting_count = payload.meeting_count;
  const total_possible_attendance = meeting_count * generus_count;

  let present_amount = 0;
  let permission_amount = 0;
  let absent_amount = 0;

  for (const studentData of Object.values(payload.raw_data)) {
    present_amount += studentData.p;
    permission_amount += studentData.i;
    absent_amount += studentData.a;
  }

  // Handle pembagian dengan nol
  const getPercentage = (amount: number) => {
    if (total_possible_attendance === 0) return 0;
    return (amount / total_possible_attendance) * 100;
  };

  return {
    group_id: payload.group_id,
    category_id: payload.category_id,
    period_month: payload.period_month,
    period_year: payload.period_year,
    raw_data: payload.raw_data,
    meeting_count: payload.meeting_count,
    generus_count: generus_count,
    present_amount,
    present_percentage: getPercentage(present_amount),
    permission_amount,
    permission_percentage: getPercentage(permission_amount),
    absent_amount,
    absent_percentage: getPercentage(absent_amount),
  };
}

/**
 * CREATE Rekap Presensi
 */
export async function createRecapAction(
  payload: CreateRecapPayload
): Promise<ActionResponse> {
  const authCheck = await checkAuth(undefined, payload.group_id);
  if (!authCheck.success) return authCheck;

  const { profile } = authCheck;
  const supabase = await createClient();

  const calculatedData = calculateRecap(payload);

  const { error } = await supabase.from("attendance_recap").insert({
    ...calculatedData,
    author_user_id: profile?.user_id,
    village_id: profile?.village_id as number,
  });

  if (error) {
    console.error("createRecapAction Error:", error.message);
    return { success: false, message: "Gagal menyimpan rekap.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Rekap presensi berhasil disimpan." };
}

/**
 * UPDATE Rekap Presensi
 */
export async function updateRecapAction(
  payload: UpdateRecapPayload
): Promise<ActionResponse> {
  const { id, ...data } = payload;
  const authCheck = await checkAuth(undefined, data.group_id);
  if (!authCheck.success) return authCheck;

  const supabase = await createClient();
  const calculatedData = calculateRecap(data);

  // Ambil village_id dari data lama (untuk keamanan)
  const { data: existing } = await supabase.from("attendance_recap").select("village_id").eq("id", id).single();
  if (existing?.village_id !== authCheck.profile?.village_id) {
    return { success: false, message: "Akses ditolak." };
  }

  const { error } = await supabase
    .from("attendance_recap")
    .update({
      ...calculatedData,
      // village_id dan author_user_id tidak diubah
    })
    .eq("id", id);

  if (error) {
    console.error("updateRecapAction Error:", error.message);
    return { success: false, message: "Gagal memperbarui rekap.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath(`${ADMIN_PATH}/edit/${id}`);
  return { success: true, message: "Rekap presensi berhasil diperbarui." };
}

/**
 * DELETE Rekap Presensi
 */
export async function deleteRecapAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();

  // Ambil data untuk cek otorisasi sebelum hapus
  const { data: existing } = await supabase.from("attendance_recap").select("village_id, group_id").eq("id", id).single();
  if (!existing) {
    return { success: false, message: "Data tidak ditemukan." };
  }

  const authCheck = await checkAuth(existing.village_id, existing.group_id);
  if (!authCheck.success) return authCheck;

  const { error } = await supabase.from("attendance_recap").delete().eq("id", id);

  if (error) {
    console.error("deleteRecapAction Error:", error.message);
    return { success: false, message: "Gagal menghapus rekap.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Rekap presensi berhasil dihapus." };
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
  if (!authCheck.success) {
    return { success: false, error: authCheck.message };
  }
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile")
    .select("user_id, full_name")
    .eq("role", "user") // Hanya ambil generus
    .eq("group_id", groupId)
    .eq("category_id", categoryId)
    .order("full_name");

  if (error) {
    console.error("Error fetching generus list:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}