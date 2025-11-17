// Tipe Model dasar (ini mungkin sudah Anda miliki)
export type VillageModel = {
  id: string | number; // atau number, sesuaikan dengan DB Anda
  name: string;
  description?: string;
};

export type GroupModel = {
  id: string | number; // atau number, sesuaikan dengan DB Anda
  name: string;
  description?: string;
  village_id?: string;
};

export type CategoryModel = {
  id: string; // atau number
  name: string;
  description?: string;
};

export type MaterialCategoryModel = {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
};

// --- TIPE DTO (DATA TRANSFER OBJECT) ---
// Tambahkan tipe-tipe di bawah ini

// DTO untuk Village
export type CreateVillageDto = Omit<VillageModel, "id">;
export type UpdateVillageDto = Partial<CreateVillageDto> & { id: string };

// DTO untuk Group
export type CreateGroupDto = Omit<GroupModel, "id">;
export type UpdateGroupDto = Partial<CreateGroupDto> & { id: string };

// DTO untuk Category
export type CreateCategoryDto = Omit<CategoryModel, "id">;
export type UpdateCategoryDto = Partial<CreateCategoryDto> & { id: string };
