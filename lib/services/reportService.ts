"use server";

import { createAdminClient } from "@/lib/supabase/server_admin";
import { CreateKbmReportPayload } from "@/lib/types/report.types";

/**
 * Membuat Laporan KBM baru di database.
 * Ini dipanggil oleh Server Action, bukan langsung oleh klien.
 *
 * @param payload Data laporan dari form
 * @param author_user_id ID pengguna (admin) yang membuat laporan
 * @param village_id ID desa dari admin yang membuat laporan
 */
export async function createKbmReport(
  payload: CreateKbmReportPayload,
  author_user_id: string,
  village_id: string,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("kbm_reports") // NAMA TABEL BARU ANDA
    .insert({
      ...payload,
      author_user_id: author_user_id,
      village_id: village_id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating KBM report:", error.message);
    return { error: error.message };
  }

  return { success: true, data: data };
}