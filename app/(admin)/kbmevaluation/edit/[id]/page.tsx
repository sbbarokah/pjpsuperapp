import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { getEvaluationRecapById } from "@/lib/services/evaluationService";
import { notFound } from "next/navigation";
import { EvaluationRecapForm } from "../../_components/recap_eval_form";

export const metadata = {
  title: "Edit Rekap Penilaian | Admin",
};

interface EditPageProps { params: { id: string } }

export default async function EditEvaluationPage(propsPromise: Promise<EditPageProps>) {
  const { params } = await propsPromise;
  const { id } = await params;

  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (error) {
    notFound();
  }
  
  const canAccess = (profile.role === 'admin_desa' || profile.role === 'admin_kelompok');
  if (!canAccess || !profile.village_id) {
     return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const recapData = await getEvaluationRecapById(id);
  if (!recapData) notFound();
  
  // Validasi Keamanan
  if (recapData.village_id !== profile.village_id) return <Breadcrumb pageName="Akses Ditolak" />;
  if (profile.role === 'admin_kelompok' && recapData.group_id !== profile.group_id) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const [groups, categories] = await Promise.all([
    (profile.role === 'admin_desa') 
      ? getGroupsByVillage(profile.village_id) 
      : getGroupsByVillage(profile.village_id).then(g => g.filter(group => group.id === profile.group_id)),
    getCategories()
  ]);

  return (
    <>
      <Breadcrumb pageName="Edit Rekap Penilaian" />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <EvaluationRecapForm
          admin={profile}
          groups={groups}
          categories={categories}
          initialData={recapData} // <-- Kirim data untuk mode edit
        />
      </div>
    </>
  );
}