import { createAdminClient } from "@/lib/supabase/server_admin";
import { MaterialWithRelations } from "../types/material.types";

const supabase = createAdminClient();

interface MaterialFilters {
  categoryId?: number;
  classId?: number;
  search?: string;
}

/**
 * Mengambil daftar materi dengan relasi,
 * difilter berdasarkan kategori.
 */
export async function getMaterialsList(filters: MaterialFilters) {
  const isFilteringByClass = !!filters.classId;
  const assignmentRelation = isFilteringByClass 
    ? "material_category_assignment!inner" 
    : "material_category_assignment";

  let query = supabase
    .from("material")
    .select(`
      *,
      material_category (name),
      ${assignmentRelation} (
        category (id, name)
      )
    `)
    .order("material_name");

  if (filters.categoryId) {
    query = query.eq("material_category_id", filters.categoryId);
  }

  if (filters.classId) {
    query = query.eq("material_category_assignment.category_id", filters.classId);
  }

  // Tambahkan filter search
  if (filters.search && filters.search.length >= 3) {
    query = query.ilike("material_name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching materials list:", error.message);
    return [];
  }
  
  return data as MaterialWithRelations[];
}

/**
 * Mengambil satu materi berdasarkan ID.
 */
export async function getMaterialById(id: string): Promise<MaterialWithRelations | null> {
  const { data, error } = await supabase
    .from("material")
    .select(`
      *,
      author:profile!fk_material_author_profile (
         username,
         full_name
      ),
      material_category (name)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching material by ID:", error.message);
    return null;
  }
  
  return data as MaterialWithRelations;
}