import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { EvaluationRecapForm } from "../_components/recap_eval_form";

export const metadata = {
  title: "Buat Rekap Penilaian | Admin",
};

export default async function CreateEvaluationPage() {
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

  // Ambil data master untuk dropdown
  const [groups, categories] = await Promise.all([
    (profile.role === 'admin_desa') 
      ? getGroupsByVillage(profile.village_id) 
      : getGroupsByVillage(profile.village_id).then(g => g.filter(group => group.id === profile.group_id)),
    getCategories()
  ]);

  return (
    <>
      <Breadcrumb pageName="Buat Rekap Penilaian Baru" />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <EvaluationRecapForm
          admin={profile}
          groups={groups}
          categories={categories}
        />
      </div>
    </>
  );
}