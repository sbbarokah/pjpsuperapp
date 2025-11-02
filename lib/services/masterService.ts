import { createAdminClient } from "@/lib/supabase/server_admin";

// --- Fungsi Helper untuk Master Data ---

/**
 * Mengambil semua data 'group'
 */
export async function getGroups() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("group").select("*");
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Mengambil semua data 'class'
 */
export async function getClasses() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("class").select("*");
  if (error) throw new Error(error.message);
  return data;
}
