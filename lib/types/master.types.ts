// Tabel Master Data
export type GroupModel = {
  id: string; // atau number, sesuaikan dengan DB Anda
  name: string;
  description?: string;
  village_id?: string;
};

export type ClassModel = {
  id: string; // atau number
  name: string;
  description?: string;
};