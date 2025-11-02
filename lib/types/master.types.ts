// Tabel Master Data
export type VillageModel = {
  id: string; // atau number, sesuaikan dengan DB Anda
  name: string;
  description?: string;
};

export type GroupModel = {
  id: string; // atau number, sesuaikan dengan DB Anda
  name: string;
  description?: string;
  village_id?: string;
};

export type CategoryModel = {
  id: string; // atau number
  name: string;
  description?: string;
};