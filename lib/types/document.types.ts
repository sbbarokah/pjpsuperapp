import { GroupModel, VillageModel } from "./master.types";
import { Profile } from "./user.types";

export type DocumentType = 'FILE' | 'LINK';

export type DocumentModel = {
  id: string;
  created_at: string;
  author_user_id: string;
  title: string;
  description?: string | null;
  document_type: DocumentType;
  village_id?: string | number | null;
  group_id?: number | null;
  
  /* File props */
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  
  /* Link props */
  external_url?: string | null;
};

// Tipe data gabungan untuk tampilan list
export type DocumentWithRelations = DocumentModel & {
  author: Pick<Profile, 'full_name'> | null;
  group: Pick<GroupModel, 'name'> | null;
  village: Pick<VillageModel, 'name'> | null;
};

// DTO untuk form
export type CreateDocumentDto = Omit<DocumentModel, "id" | "created_at" | "author_user_id">;
export type UpdateDocumentDto = Partial<CreateDocumentDto> & { id: string };