import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { getAttendanceRecapById } from "@/lib/services/attendanceService";
import { notFound } from "next/navigation";
import { AttendanceRecapForm } from "../../_components/recap_form";

export const metadata = {
  title: "Edit Rekap Presensi | Admin",
};

interface EditPageProps { params: { id: string } }

export default async function EditRecapPage({ params }: EditPageProps) {
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

  // Ambil data rekap yang ada
  const recapData = await getAttendanceRecapById(params.id);
  if (!recapData) {
    notFound();
  }
  
  // Validasi: Pastikan admin hanya bisa edit data di desanya
  if (recapData.village_id !== profile.village_id) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }
  
  // Validasi: Admin kelompok hanya bisa edit grupnya sendiri
  if (profile.role === 'admin_kelompok' && recapData.group_id !== profile.group_id) {
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
      <Breadcrumb pageName="Edit Rekap Presensi" showNav={false} />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
          Formulir Edit Rekap
        </h3> */}
        <AttendanceRecapForm
          admin={profile}
          groups={groups}
          categories={categories}
          initialData={recapData} // <-- Kirim data untuk mode edit
        />
      </div>
    </>
  );
}