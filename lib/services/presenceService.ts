"use server";

import { createClient } from "@/lib/supabase/server_user";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { revalidatePath } from "next/cache";
import { Profile } from "@/lib/types/user.types";
import { CreateMeetingAttendanceDto } from "../types/presence.types";
import { createAdminClient } from "../supabase/server_admin";

const ADMIN_PATH = "/kbm/meeting-attendance";

export async function getStudentsByCategoriesAction(groupId: number, categoryIds: number[]) {
  const supabase = createAdminClient();
  
  if (!categoryIds || categoryIds.length === 0) return { success: true, data: [] };

  const { data, error } = await supabase
    .from("profile")
    .select("user_id, full_name, category_id, category(name)")
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