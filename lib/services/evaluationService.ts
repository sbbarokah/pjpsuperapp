
import {
  EvaluationRecapModel,
  EvaluationRecapWithRelations,
} from "@/lib/types/evaluation.types";
import { createAdminClient } from "../supabase/server_admin";

const supabase = createAdminClient();

/**
 * Mengambil daftar rekap penilaian
 * difilter berdasarkan scope admin
 */
export async function getEvaluationRecapList(filters: {
  villageId: number;
  groupId?: number;
}): Promise<EvaluationRecapWithRelations[]> {
  
  let query = supabase
    .from("evaluation_recap")
    .select(
      `
      *,
      group (name),
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
    console.error("Error fetching evaluation recap list:", error.message);
    return [];
  }
  return data as any;
}

/**
 * Mengambil satu rekap penilaian berdasarkan ID (untuk edit)
 * Termasuk raw_data
 */
export async function getEvaluationRecapById(
  id: string
): Promise<EvaluationRecapModel | null> {
  const { data, error } = await supabase
    .from("evaluation_recap")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching evaluation recap by ID:", error.message);
    return null;
  }
  return data;
}