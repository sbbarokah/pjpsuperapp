"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server_user";
import { createKbmReport } from "@/lib/services/reportService";
import { CreateKbmReportDto, UpdateKbmReportDto } from "@/lib/types/report.types";

type FormResponse = {
  success: boolean;
  message: string;
  data?: any;
};

/**
 * Server Action untuk membuat Laporan KBM.
 * Ini akan dipanggil oleh <form>.
 */
export async function createKbmReportAction(payload: CreateKbmReportDto) {
  // 1. Validasi Sesi Pengguna
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Akses ditolak. Silakan login kembali." };
  }

  // 2. Dapatkan profil admin (terutama village_id)
  const { data: profile } = await supabase
    .from("profile")
    .select("village_id")
    .eq("user_id", user.id)
    .single();

  if (!profile || !profile.village_id) {
    return {
      success: false,
      message: "Profil admin tidak ditemukan atau tidak terdaftar di desa.",
    };
  }

  // 3. Panggil service untuk menyimpan ke database
  try {
    const result = await createKbmReport(
      payload,
      user.id,
      profile.village_id,
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // 4. Revalidasi cache jika berhasil
    revalidatePath("/reports"); // Halaman daftar laporan (jika ada)

    return {
      success: true,
      message: "Laporan berhasil disimpan.",
      data: result.data,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateKbmReportAction(
  payload: UpdateKbmReportDto,
): Promise<FormResponse> {
  const supabase = await createClient();

  // Ambil ID dan sisa data
  const { id, ...dataToUpdate } = payload;

  if (!id) {
    return { success: false, message: "ID Laporan tidak ditemukan." };
  }

  // Validasi Keamanan Sisi Server (SANGAT PENTING)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Akses ditolak: Tidak terotentikasi." };
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("role, group_id")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin_kelompok") {
    return { success: false, message: "Akses ditolak: Bukan Admin Kelompok." };
  }

  // Cek kepemilikan laporan
  const { data: existingReport, error: fetchError } = await supabase
    .from("kbm_reports")
    .select("group_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingReport) {
    return { success: false, message: "Laporan yang akan di-update tidak ditemukan." };
  }

  if (existingReport.group_id !== profile.group_id) {
    return {
      success: false,
      message: "Akses ditolak: Anda tidak bisa mengedit laporan kelompok lain.",
    };
  }

  // Lakukan Update
  const { error: updateError } = await supabase
    .from("kbm_reports")
    .update(dataToUpdate)
    .eq("id", id);

  if (updateError) {
    console.error("updateKbmReportAction Error:", updateError.message);
    return {
      success: false,
      message: `Gagal memperbarui laporan: ${updateError.message}`,
    };
  }

  revalidatePath("/report"); // Revalidasi halaman daftar
  revalidatePath(`/report/edit/${id}`); // Revalidasi halaman edit ini
  return { success: true, message: "Laporan berhasil diperbarui." };
}