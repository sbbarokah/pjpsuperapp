import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { getMeetingAttendanceByIdAction } from "../../actions";
import { EditMeetingAttendanceForm } from "../../_components/edit_meeting_attendance_form";

export const metadata = {
  title: "Edit Kehadiran Per KBM | Admin",
};

interface EditPageProps { params: { id: string } }

export default async function EditMeetingAttendancePage(propsPromise: Promise<EditPageProps>) {
  const { params } = await propsPromise;
  const { id } = await params;
  let profile;

  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    notFound();
  }

  const canAccess =
    profile.role === "admin_desa" || profile.role === "admin_kelompok";
  if (!canAccess || !profile.village_id) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  console.log("isi params", params)

  // Ambil data record
  const { success, data: record } = await getMeetingAttendanceByIdAction(id);
  
  if (!success || !record) {
    return <Breadcrumb pageName="Data tidak ditemukan" />;
  }

  // Otorisasi: pastikan record sesuai dengan scope admin
  if (
    profile.role === "admin_desa" &&
    record.village_id !== profile.village_id
  ) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }
  if (
    profile.role === "admin_kelompok" &&
    record.group_id !== profile.group_id
  ) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const [groups, categories] = await Promise.all([
    profile.role === "admin_desa"
      ? getGroupsByVillage(profile.village_id)
      : getGroupsByVillage(profile.village_id).then((g) =>
          g.filter((group) => group.id === profile.group_id)
        ),
    getCategories(),
  ]);

  return (
    <>
      <Breadcrumb pageName="Edit Kehadiran Per KBM" showNav={false} />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <EditMeetingAttendanceForm
          admin={profile}
          groups={groups}
          categories={categories}
          initialData={record}
        />
      </div>
    </>
  );
}