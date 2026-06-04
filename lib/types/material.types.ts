import { CategoryModel, MaterialCategoryModel } from "./master.types";
import { Profile } from "./user.types";

export type MaterialModel = {
  id: string; // UUID
  created_at: string;
  author_user_id: string;
  material_name: string;
  description?: string | null;
  evaluation?: string | null; // Penilaian
  material_category_id: number;
};

export type MaterialAssignmentModel = {
  category: Pick<CategoryModel, 'id' | 'name'> | null;
};

// Tipe data gabungan untuk tampilan list
export type MaterialWithRelations = MaterialModel & {
  author: Pick<Profile, 'full_name'> | null;
  material_category: Pick<MaterialCategoryModel, 'name'> | null;
  material_category_assignment: MaterialAssignmentModel[];
};

// DTO untuk form
export type CreateMaterialDto = Omit<MaterialModel, "id" | "created_at" | "author_user_id">;
export type UpdateMaterialDto = Partial<CreateMaterialDto> & { id: string };