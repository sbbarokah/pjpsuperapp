"use server";

import { createClient } from "@/lib/supabase/server_user";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server_admin";
import { CreateMeetingAttendanceDto } from "@/lib/types/presence.types";

const ADMIN_PATH = "/kbmpresence";

export async function getStudentsByCategoriesAction(groupId: number, categoryIds: number[]) {
  const supabase = createAdminClient();
  
  if (!categoryIds || categoryIds.length === 0) return { success: true, data: [] };

  const { data, error } = await supabase
    .from("profile")
    .select("user_id, full_name, gender, category_id, category(name)")
    .eq("role", "user")
    .eq("group_id", groupId)
    .in("category_id", categoryIds)
    .order("category_id")
    .order("full_name");

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createMeetingAttendanceAction(payload: CreateMeetingAttendanceDto) {
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canMutate = ['superadmin', 'admin_desa', 'admin_kelompok'].includes(profile.role);
    
    if (!canMutate) return { success: false, message: "Akses ditolak." };

    const supabase = await createClient();
    const { error } = await supabase.from("meeting_attendances").insert({
      ...payload,
      created_by: profile.user_id,
    });

    if (error) throw error;

    revalidatePath(ADMIN_PATH);
    return { success: true, message: "Presensi pertemuan berhasil disimpan." };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal menyimpan data." };
  }
}

export async function createDailyAttendanceAction(payload: any) {
  const supabase = await createClient();
  
  // Ambil user yang login untuk audit
  const { profile } = await getAuthenticatedUserAndProfile();
  const canMutate = ['superadmin', 'admin_desa', 'admin_kelompok'].includes(profile.role);
  
  if (!canMutate) return { success: false, message: "Akses ditolak." };

  try {
    const { data, error } = await supabase
      .from("meeting_attendances")
      .insert({
        village_id: payload.village_id,
        group_id: payload.group_id,
        category_ids: payload.category_ids,
        datetime: payload.datetime,
        activity: payload.activity,
        place: payload.place,
        material: payload.material, // Array of objects
        recapitulation: payload.recapitulation, // Data kehadiran H/I/A
        notes: payload.notes,
        created_by: profile.user_id
      });

    if (error) throw error;

    revalidatePath("/kbmattendance"); // Sesuaikan path untuk refresh halaman
    return { success: true, message: "Data kehadiran berhasil disimpan" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getMeetingAttendancesList(villageId: number, groupId?: number) {
  const supabase = createAdminClient();
  let query = supabase
    .from("meeting_attendances")
    .select(`
      *,
      author:profile!created_by(full_name),
      village(name),
      group(name)
    `)
    .eq("village_id", villageId)
    .order("datetime", { ascending: false });

  if (groupId) query = query.eq("group_id", groupId);

  const { data, error } = await query;
  if (error) console.error("Error fetching meeting attendances:", error);
  return data as any[] || [];
}

export async function deleteMeetingAttendanceAction(id: string) {
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canMutate = ['superadmin', 'admin_desa', 'admin_kelompok'].includes(profile.role);
    
    if (!canMutate) return { success: false, message: "Akses ditolak." };

    const supabase = await createClient();
    const { error } = await supabase.from("meeting_attendances").delete().eq("id", id);

    if (error) throw error;

    revalidatePath(ADMIN_PATH);
    return { success: true, message: "Data pertemuan berhasil dihapus." };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal menghapus data." };
  }
}

// Ambil satu record berdasarkan ID
export async function getMeetingAttendanceByIdAction(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meeting_attendances")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// Update record
export async function updateMeetingAttendanceAction(
  id: string,
  payload: CreateMeetingAttendanceDto
) {
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canMutate = ['superadmin', 'admin_desa', 'admin_kelompok'].includes(profile.role);
    if (!canMutate) return { success: false, message: "Akses ditolak." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("meeting_attendances")
      .update({
        village_id: payload.village_id,
        group_id: payload.group_id,
        category_ids: payload.category_ids,
        datetime: payload.datetime,
        activity: payload.activity,
        activity_type: payload.activity_type,
        activity_level: payload.activity_level,
        place: payload.place,
        material: payload.material,
        recapitulation: payload.recapitulation,
        notes: payload.notes,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath('/kbmpresence');
    return { success: true, message: "Presensi pertemuan berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal memperbarui data." };
  }
}