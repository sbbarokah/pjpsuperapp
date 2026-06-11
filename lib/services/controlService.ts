import { createAdminClient } from "../supabase/server_admin";
import { 
  ControlMaterialModel, 
  ControlUserRecapWithRelations, 
  MaterialProgressCardDto,
  PageStatus
} from "../types/control.types";

/**
 * 1. MENGAMBIL DATA UNTUK DASHBOARD UTAMA DENGAN FILTER DINAMIS
 */
export async function getControlDashboardData(
  villageId?: number, 
  groupId?: number,
  categoryId?: number,
  userId?: string
) {
  const supabase = createAdminClient();

  // A. Ambil Semua Master Materi
  const { data: materials, error: matError } = await supabase
    .from("control_material")
    .select("*")
    .order("id", { ascending: true });

  if (matError) throw new Error(matError.message);

  // B. Mengatasi Error Relasi Profile: Lakukan Two-Step Query
  // Tahap 1: Ambil data profile dengan filter (Wilayah, Kelompok, Kelas, Spesifik User)
  let profileQuery = supabase
    .from("profile")
    .select("user_id, full_name, username, village_id, group_id, category_id");

  if (villageId) profileQuery = profileQuery.eq("village_id", villageId);
  if (groupId) profileQuery = profileQuery.eq("group_id", groupId);
  if (categoryId) profileQuery = profileQuery.eq("category_id", categoryId);
  if (userId) profileQuery = profileQuery.eq("user_id", userId);

  const { data: profiles, error: profileError } = await profileQuery;
  if (profileError) throw new Error(profileError.message);

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
  const validUserIds = profiles?.map(p => p.user_id) || [];
  
  // Total Siswa Target (Untuk pembagi persentase)
  const totalTargetStudents = validUserIds.length; 

  // Tahap 2: Ambil Rekap User khusus untuk user_id yang valid
  let allRecaps: any[] = [];
  let historyWithProfiles: any[] = [];

  if (validUserIds.length > 0) {
    // Ambil semua rekap untuk kalkulasi persentase
    const { data: recapData, error: recapError } = await supabase
      .from("control_user_recap")
      .select(`*, control_material (name, total_pages)`)
      .in("user_id", validUserIds);
      
    if (recapError) throw new Error(recapError.message);
    allRecaps = recapData || [];

    // Ambil 15 History Terakhir untuk user yang valid
    const { data: historyData, error: historyError } = await supabase
      .from("control_user_recap")
      .select(`*, control_material (name, total_pages)`)
      .in("user_id", validUserIds)
      .order("created_at", { ascending: false })
      .limit(15);

    if (historyError) throw new Error(historyError.message);

    // Gabungkan data history dengan data profile yang sudah diambil
    historyWithProfiles = (historyData || []).map(h => ({
      ...h,
      profile: profileMap.get(h.user_id)
    }));
  }

  // C. Kalkulasi Persentase Penyelesaian per Materi
  const progressCards: MaterialProgressCardDto[] = (materials || []).map((mat) => {
    const matRecaps = allRecaps.filter((r) => r.control_material_id === mat.id);

    let totalFilledPages = 0;
    let uniqueUsersCount = 0;

    matRecaps.forEach(recap => {
      const recapArr = Array.isArray(recap.recapitulation) ? recap.recapitulation : [];
      const filledCount = recapArr.filter((status: any) => status !== "E").length;
      
      if (filledCount > 0) {
        totalFilledPages += filledCount;
        uniqueUsersCount++;
      }
    });

    // Total halaman yang seharusnya diisi oleh seluruh siswa hasil filter
    const totalExpectedPages = mat.total_pages * totalTargetStudents;
    const percentage = totalExpectedPages > 0 
      ? Math.round((totalFilledPages / totalExpectedPages) * 100) 
      : 0;

    return {
      material_id: mat.id,
      name: mat.name,
      total_pages: mat.total_pages,
      percentage: Math.min(percentage, 100), 
      total_recap: uniqueUsersCount,
    };
  });

  return {
    progressCards,
    materials: (materials || []) as ControlMaterialModel[],
    history: historyWithProfiles as unknown as ControlUserRecapWithRelations[],
  };
}

/**
 * 2. MENGAMBIL ARRAY STATUS UNTUK 1 USER & 1 MATERI (DIPAKAI DI MANAGER LEMBAR KONTROL)
 */
export async function getUserMaterialRecap(userId: string, materialId: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("control_user_recap")
    .select("recapitulation")
    .eq("user_id", userId)
    .eq("control_material_id", materialId)
    .single();

  // Jika tidak ada data, kembalikan array kosong (nanti diisi "E" di sisi klien)
  if (error && error.code === "PGRST116") {
    return []; 
  }
  if (error) throw new Error(error.message);

  return (data?.recapitulation || []) as PageStatus[];
}

/**
 * 3. MENYIMPAN/UPSERT ARRAY JSONB REKAPITULASI (SATUAN ATAU MASAL)
 */
export async function saveUserMaterialRecap(userId: string, materialId: number, newRecapArray: PageStatus[]) {
  const supabase = createAdminClient();

  // Karena ada UNIQUE constraint (user_id, control_material_id), 
  // kita bisa pakai mekanisme upsert dengan nyaman.
  const { error } = await supabase
    .from("control_user_recap")
    .upsert({
      user_id: userId,
      control_material_id: materialId,
      recapitulation: newRecapArray,
      // created_at otomatis terisi default
    }, {
      onConflict: "user_id, control_material_id"
    });

  if (error) throw new Error(error.message);
  return true;
}