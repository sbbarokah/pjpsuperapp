
import { Profile } from "@/lib/types/user.types";
import { createAdminClient } from "../supabase/server_admin";
import { AttendanceRecapModel, AttendanceRecapWithRelations } from "../types/attendance.types";

const supabase = createAdminClient();

/**
 * Mengambil daftar rekap presensi
 * difilter berdasarkan scope admin
 */
export async function getAttendanceRecapList(filters: {
  villageId: number;
  groupId?: number;
}): Promise<AttendanceRecapWithRelations[]> {
  
  // let query = supabase
  //   .from("attendance_recap")
  //   .select(
  //     `
  //     id, created_at, author_user_id, group_id, village_id, category_id,
  //     period_month, period_year, meeting_count, generus_count,
  //     present_amount, present_percentage,
  //     permission_amount, permission_percentage,
  //     absent_amount, absent_percentage, notes,
      
  //     author:profile!author_user_id (full_name),
  //     group (name),
  //     category (name)
  //   `
  //   )
  //   .eq("village_id", filters.villageId)
  //   .order("period_year", { ascending: false })
  //   .order("period_month", { ascending: false });
  let query = supabase
    .from("attendance_recap")
    .select(
      `*,
      author:profile!fk_attendance_author_profile (full_name),
      group (name),
      village (name),
      category (name)
    `
    )
    .eq("village_id", filters.villageId)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  if (filters.groupId) {
    query = query.eq("group_id", filters.groupId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching recap list:", error.message);
    return [];
  }
  return data as any;
}

/**
 * Mengambil satu rekap presensi berdasarkan ID (untuk edit)
 * Termasuk raw_data
 */
export async function getAttendanceRecapById(
  id: string
): Promise<AttendanceRecapModel | null> {
  const { data, error } = await supabase
    .from("attendance_recap")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching recap by ID:", error.message);
    return null;
  }
  return data;
}

/**
 * [BARU] Mengambil daftar generus (hanya profile)
 * untuk mengisi form presensi.
 */
export async function getGenerusByFilter(
  groupId: number,
  categoryId: number
): Promise<Pick<Profile, "user_id" | "full_name">[]> {
  
  const { data, error } = await supabase
    .from("profile")
    .select("user_id, full_name")
    .eq("role", "user") // Hanya ambil generus
    .eq("group_id", groupId)
    .eq("category_id", categoryId)
    .order("full_name");

  if (error) {
    console.error("Error fetching generus list:", error.message);
    return [];
  }
  return data;
}