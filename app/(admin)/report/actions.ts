"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server_user";
import { createKbmReport } from "@/lib/services/reportService";
import { CreateKbmReportPayload } from "@/lib/types/report.types";

/**
 * Server Action untuk membuat Laporan KBM.
 * Ini akan dipanggil oleh <form>.
 */
export async function createKbmReportAction(payload: CreateKbmReportPayload) {
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