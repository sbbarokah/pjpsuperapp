
import { createAdminClient } from "@/lib/supabase/server_admin";
import { WorkProgramWithAuthor } from "@/lib/types/proker.types";
import { Profile } from "../types/user.types";

const supabase = createAdminClient();

/**
 * Mengambil daftar program kerja untuk tahun tertentu
 * dengan filter keamanan berdasarkan Role.
 */
export async function getProkersByYear(
  year: number,
  profile: Profile,
  filterLevel: string = "desa" // default level
) {
  let query = supabase
    .from("work_programs")
    .select("*")
    .eq("year", year);

  // Filter berdasarkan Role & Level
  if (profile.role === 'superadmin') {
    // Superadmin melihat berdasarkan filter level yang dipilih di URL
    query = query.eq("level", filterLevel);
  } else if (profile.role === 'admin_desa') {
    // Admin Desa melihat data desanya (level desa)
    // Opsional: Bisa juga melihat level kelompok di desanya jika diinginkan, 
    // tapi sesuai request sebelumnya: admin_desa -> level desa.
    query = query
      .eq("village_id", profile.village_id)
      .eq("level", "desa");
  } else if (profile.role === 'admin_kelompok') {
    // Admin Kelompok hanya melihat data kelompoknya
    query = query
      .eq("group_id", profile.group_id)
      .eq("level", "kelompok");
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    console.error("Error getProkersByYear:", error.message);
    return [];
  }

  return data;
}

/**
 * Mengambil satu program kerja by ID (untuk halaman Edit nanti)
 */
export async function getProkerById(id: string) {
  const { data, error } = await supabase
    .from("work_programs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

/**
 * Mengambil daftar program kerja berdasarkan filter
 */
export async function getProkersByYear2(
  villageId: number, 
  year: number,
  groupId?: number // Opsional: Filter untuk admin_kelompok
): Promise<WorkProgramWithAuthor[]> {
  
  let query = supabase
    .from("work_programs")
    .select(`
      *,
      author:profile!author_user_id (full_name)
    `)
    .eq("village_id", villageId)
    .eq("year", year)
    .order("created_at", { ascending: false });

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error getProkersByYear:", error.message);
    return [];
  }

  // Mapping nama kolom DB ke nama yang dipakai frontend jika perlu,
  // TAPI di sini saya return sesuai model DB (name, team, dll).
  // Frontend perlu disesuaikan untuk membaca 'name' bukan 'nama_kegiatan' saat menampilkan list.
  return data as WorkProgramWithAuthor[];
}

/**
 * Mengambil rekap budget bulanan via RPC
 */
export async function getMonthlyBudgetRecap(year: number, villageId: number) {
  const { data, error } = await supabase.rpc("get_monthly_budget_recap", {
    p_year: year,
    p_village_id: villageId
  });

  if (error) {
    console.error("Error getMonthlyBudgetRecap:", error.message);
    return [];
  }
  return data as { month_name: string; total_budget: number; activity_count: number }[];
}

/**
 * Mengambil daftar tahun unik berdasarkan Role dan Level aktif
 */
export async function getAvailableProkerYears(profile: Profile, activeLevel: string): Promise<number[]> {
  let query = supabase
    .from("work_programs")
    .select("year")
    .eq("level", activeLevel);

  // Filter wilayah jika bukan superadmin
  if (profile.role !== 'superadmin') {
    query = query.eq("village_id", profile.village_id);
    
    if (profile.role === 'admin_kelompok') {
      query = query.eq("group_id", profile.group_id);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error getAvailableProkerYears:", error.message);
    return [];
  }

  // Mengambil tahun unik dan mengurutkan dari yang terbaru
  const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => b - a);
  
  return years;
}