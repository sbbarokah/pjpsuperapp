import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { createAdminClient } from "@/lib/supabase/server_admin";
import { notFound } from "next/navigation";
import ControlRecapManager from "../_components/control_user_recap_manager";
import { fetchGenerusForControlAction, loadUserMaterialRecapAction, saveBulkUserMaterialRecapAction, saveFullUserMaterialRecapAction, saveUserMaterialRecapAction } from "../actions";

export const metadata = {
  title: "Isi Lembar Kontrol Materi | Admin",
};

export default async function ControlRecapPage() {
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    notFound();
  }

  const canAccess = (profile.role === 'admin_desa' || profile.role === 'admin_kelompok');
  if (!canAccess || !profile.village_id) {
     return <Breadcrumb pageName="Akses Ditolak" />;
  }

  // 1. Ambil data master untuk dropdown (Kelompok dan Kategori)
  const [groups, categories] = await Promise.all([
    (profile.role === 'admin_desa') 
      ? getGroupsByVillage(profile.village_id) 
      : getGroupsByVillage(profile.village_id).then(g => g.filter(group => group.id === profile.group_id)),
    getCategories()
  ]);

  // 2. Ambil data materi khusus dari master tabel control_material
  const supabase = createAdminClient();
  const { data: materials } = await supabase
    .from("control_material")
    .select("id, name, total_pages")
    .order("name", { ascending: true });

  return (
    <>
      <div className="mb-6">
        <Breadcrumb pageName="Isi Lembar Kontrol Materi" showNav={false} />
      </div>
      <ControlRecapManager
        admin={profile}
        groups={groups || []}
        categories={categories || []}
        materials={materials || []}
        onFetchGenerus={fetchGenerusForControlAction}
        onLoadRecap={loadUserMaterialRecapAction}
        onSaveFullRecap={saveFullUserMaterialRecapAction}
      />
    </>
  );
}