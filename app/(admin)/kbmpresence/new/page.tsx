import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { CreateMeetingAttendanceForm } from "../_components/create_meeting_attendance_form";

export const metadata = {
  title: "Tambah Kehadiran Per KBM | Admin",
};

export default async function CreateMeetingAttendancePage() {
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    notFound();
  }

  const canAccess = profile.role === "admin_desa" || profile.role === "admin_kelompok";
  if (!canAccess || !profile.village_id) {
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
      <Breadcrumb pageName="Tambah Kehadiran Per KBM" showNav={false} />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <CreateMeetingAttendanceForm
          admin={profile}
          groups={groups}
          categories={categories}
        />
      </div>
    </>
  );
}