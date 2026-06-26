import { GroupModel, VillageModel } from "./master.types";
import { Profile } from "./user.types";

export type MeetingMaterial = {
  id: string;
  topic: string;
  presenter: string;
  pages?: string;
};

export type RecapStats = {
  h: number;
  i: number;
  a: number;
  pct_h: number;
};

export type MeetingRecapitulation = {
  summary: RecapStats;
  by_category: Record<string, RecapStats>; // Key is category_id
  students?: { name: string; gender: "L" | "P"; status: "H" | "I" | "A" }[];
};

export type MeetingAttendanceModel = {
  id: string;
  created_at: string;
  created_by: string;
  village_id: number;
  group_id: number;
  category_ids: number[];
  datetime: string;
  activity: string;
  activity_type: "Sambung" | "Khusus" | null;
  activity_level: "Kelompok" | "Desa" | "Daerah" | null;
  place: string | null;
  material: MeetingMaterial[];
  recapitulation: MeetingRecapitulation;
  notes: string | null;
};

export type MeetingAttendanceWithRelations = MeetingAttendanceModel & {
  author: Pick<Profile, 'full_name'> | null;
  village: Pick<VillageModel, 'name'>;
  group: Pick<GroupModel, 'name'>;
};

export type CreateMeetingAttendanceDto = Omit<MeetingAttendanceModel, "id" | "created_at" | "created_by">;