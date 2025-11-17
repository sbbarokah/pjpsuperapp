import { createAdminClient } from "@/lib/supabase/server_admin";
import { DocumentModel, DocumentWithRelations } from "@/lib/types/document.types";

const supabase = createAdminClient();

interface DocumentFilters {
  villageId?: number;
  groupId?: number;
}

/**
 * Mengambil daftar berkas dengan relasi,
 * difilter berdasarkan scope admin.
 */
export async function getDocumentsList(
  filters: DocumentFilters
): Promise<DocumentWithRelations[]> {
  
  let query = supabase
    .from("documents")
    .select(`
      *,
      author:profile!fk_documents_author_profile (
         username,
         full_name
      ),
      group (name),
      village (name)
    `)
    .order("created_at", { ascending: false });

  // Terapkan filter scope
  if (filters.groupId) {
    query = query.eq("group_id", filters.groupId);
  } else if (filters.villageId) {
    query = query.eq("village_id", filters.villageId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching documents list:", error.message);
    return [];
  }
  
  return data as DocumentWithRelations[];
}

/**
 * Mengambil satu berkas berdasarkan ID.
 */
export async function getDocumentById(id: string): Promise<DocumentModel | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching document by ID:", error.message);
    return null;
  }
  
  return data;
}