import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { MeetingReportForm } from "../_components/mreport_form";

export const metadata = {
  title: "Buat Laporan Muslimun | Admin",
};

export default async function NewMeetingReportPage() {
  let user, profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    user = authData.user;
    profile = authData.profile;
  } catch (error) {
    notFound();
  }

  // Hanya admin desa & kelompok yg bisa buat
  const canCreate = profile.role === "admin_desa" || profile.role === "admin_kelompok";
  if (!canCreate || !profile.village_id) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-red-500">
            Hanya Admin Desa atau Admin Kelompok yang dapat membuat laporan ini.
          </p>
        </div>
      </>
    );
  }

  // Ambil data groups
  const groups = await getGroupsByVillage(profile.village_id);

  return (
    <>
      <Breadcrumb pageName="Buat Laporan Muslimun" showNav={false} />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Laporan Muslimun
            </h3>
            <MeetingReportForm
              authorId={user.id}
              admin={profile}
              groups={groups}
            />
          </div>
        </div>
      </div>
    </>
  );
}