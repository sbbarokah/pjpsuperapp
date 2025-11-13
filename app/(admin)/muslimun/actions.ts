"use server";

import { createClient } from "@/lib/supabase/server_user";
import {
  CreateMeetingReportDto,
  UpdateMeetingReportDto,
} from "@/lib/types/mreport.types";
import { revalidatePath } from "next/cache";

// Tipe standar untuk response action
type FormResponse = {
  success: boolean;
  message: string;
  data?: any;
};

/**
 * CREATE Action
 * Membuat Laporan Muslimun baru.
 */
export async function createMeetingReportAction(
  payload: CreateMeetingReportDto,
): Promise<FormResponse> {
  const supabase = await createClient();

  // Validasi data (opsional tapi disarankan)
  if (!payload.group_id || !payload.village_id) {
    return { success: false, message: "Desa dan Kelompok wajib diisi." };
  }

  const { data, error } = await supabase
    .from("meeting_reports")
    .insert(payload)
    .single();

  if (error) {
    console.error("createMeetingReportAction Error:", error.message);
    return {
      success: false,
      message: `Gagal menyimpan laporan: ${error.message}`,
    };
  }

  revalidatePath("/muslimun"); // Revalidasi halaman daftar
  return { success: true, message: "Laporan Muslimun berhasil disimpan." };
}

/**
 * UPDATE Action
 * Memperbarui Laporan Muslimun yang ada.
 */
export async function updateMeetingReportAction(
  payload: UpdateMeetingReportDto,
): Promise<FormResponse> {
  const supabase = await createClient();
  const { id, ...dataToUpdate } = payload;

  if (!id) {
    return { success: false, message: "ID Laporan tidak ditemukan." };
  }

  // TODO: Tambahkan validasi keamanan (cek kepemilikan)
  // ... (Logika cek profile vs dataToUpdate.group_id) ...

  const { error } = await supabase
    .from("meeting_reports")
    .update(dataToUpdate)
    .eq("id", id);

  if (error) {
    console.error("updateMeetingReportAction Error:", error.message);
    return {
      success: false,
      message: `Gagal memperbarui laporan: ${error.message}`,
    };
  }

  revalidatePath("/muslimun");
  revalidatePath(`/muslimun/edit/${id}`);
  return { success: true, message: "Laporan Muslimun berhasil diperbarui." };
}

/**
 * DELETE Action
 * Menghapus Laporan Muslimun.
 */
export async function deleteMeetingReportAction(
  reportId: string,
): Promise<FormResponse> {
  const supabase = await createClient();

  if (!reportId) {
    return { success: false, message: "ID Laporan tidak valid." };
  }

  // TODO: Tambahkan validasi keamanan (cek kepemilikan)
  // ... (Logika cek profile vs reportId) ...

  const { error } = await supabase
    .from("meeting_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    console.error("deleteMeetingReportAction Error:", error.message);
    return {
      success: false,
      message: `Gagal menghapus laporan: ${error.message}`,
    };
  }

  revalidatePath("/muslimun");
  return { success: true, message: "Laporan Muslimun berhasil dihapus." };
}