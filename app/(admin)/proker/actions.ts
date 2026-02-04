"use server";

import { createClient } from "@/lib/supabase/server_user";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { CreateProkerDto, UpdateProkerDto, WorkProgramModel } from "@/lib/types/proker.types";
import { revalidatePath } from "next/cache";

const ADMIN_PATH = "/proker";

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

// --- Helper Auth ---
async function checkAuth() {
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    return { success: true, profile };
  } catch (error: any) {
    return { success: false, message: "Akses ditolak.", error: error.message };
  }
}

// --- Helper Kalkulasi Total ---
function calculateTotalBudget(rab: CreateProkerDto['rab']): number {
  return rab.reduce((acc, item) => acc + (Number(item.harga) * Number(item.jumlah)), 0);
}

/**
 * CREATE Program Kerja
 */
export async function createProkerAction(payload: CreateProkerDto) {
  const { profile } = await getAuthenticatedUserAndProfile();
  if (!profile) return { success: false, message: "Sesi tidak valid." };

  // 1. Cek Role: Superadmin dilarang input
  if (profile.role === 'superadmin') {
    return { success: false, message: "Superadmin hanya memiliki akses baca." };
  }

  // 2. Tentukan Level Otomatis
  const level = profile.role === 'admin_kelompok' ? 'kelompok' : 'desa';

  const supabase = await createClient();
  const { error } = await supabase.from("work_programs").insert({
    author_user_id: profile.user_id,
    village_id: profile.village_id,
    group_id: profile.group_id,
    level: level, // Otomatis
    name: payload.nama_kegiatan,
    team: payload.tim,
    year: payload.tahun,
    description: payload.deskripsi,
    location: payload.tempat,
    participants: payload.peserta,
    objective: payload.tujuan,
    budget_items: payload.rab,
    timeline: payload.timeline,
    total_budget: payload.rab.reduce((acc: number, r: any) => acc + (r.harga * r.jumlah), 0),
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/proker");
  return { success: true, message: "Program kerja berhasil disimpan." };
}

/**
 * UPDATE Program Kerja
 */
export async function updateProkerAction(payload: UpdateProkerDto): Promise<ActionResponse> {
  const auth = await checkAuth();
  if (!auth.success || !auth.profile) return { success: false, message: auth.message || "Auth Error" };

  const supabase = await createClient();
  const { id, ...data } = payload;

  // Siapkan data update
  const updates: any = {};
  if (data.tim) updates.team = data.tim;
  if (data.tahun) updates.year = data.tahun;
  if (data.nama_kegiatan) updates.name = data.nama_kegiatan;
  if (data.deskripsi) updates.description = data.deskripsi;
  if (data.tujuan) updates.objective = data.tujuan;
  if (data.tempat) updates.location = data.tempat;
  if (data.peserta) updates.participants = data.peserta;
  if (data.rab) {
    updates.budget_items = data.rab;
    updates.total_budget = calculateTotalBudget(data.rab);
  }
  if (data.timeline) updates.timeline = data.timeline;

  updates.updated_at = new Date().toISOString();

  // Update dengan RLS check otomatis dari Supabase
  const { error } = await supabase
    .from("work_programs")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, message: "Gagal memperbarui program kerja.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Perubahan berhasil disimpan." };
}

/**
 * DELETE Program Kerja
 */
export async function deleteProkerAction(id: string): Promise<ActionResponse> {
  const auth = await checkAuth();
  if (!auth.success) return { success: false, message: "Auth Error" };

  const supabase = await createClient();
  const { error } = await supabase.from("work_programs").delete().eq("id", id);

  if (error) {
    return { success: false, message: "Gagal menghapus data.", error: error.message };
  }

  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Program kerja dihapus." };
}