import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { AttendanceRecapForm } from "../_components/recap_form";

export const metadata = {
  title: "Buat Rekap Presensi | Admin",
};

export default async function CreateRecapPage() {
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
    // Admin desa ambil semua grup di desanya, admin kelompok hanya grupnya
    (profile.role === 'admin_desa') 
      ? getGroupsByVillage(profile.village_id) 
      : getGroupsByVillage(profile.village_id).then(g => g.filter(group => group.id === profile.group_id)),
    getCategories()
  ]);

  return (
    <>
      <Breadcrumb pageName="Buat Rekap Presensi Baru" showNav={false} />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
          Formulir Rekap Presensi
        </h3> */}
        <AttendanceRecapForm
          admin={profile}
          groups={groups}
          categories={categories}
        />
      </div>
    </>
  );
}