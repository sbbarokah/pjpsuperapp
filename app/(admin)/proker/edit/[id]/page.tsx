import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage } from "@/lib/services/masterService";
import { getMeetingReportById } from "@/lib/services/mReportService";
import { notFound } from "next/navigation";
import { ProkerForm } from "../../_components/proker_form";

export const metadata = {
  title: "Edit Proker | Admin",
};

interface EditProkerPageProps {
  params: { id: string };
}

export default async function EditProkerPage(propsPromise: Promise<EditProkerPageProps>) {
  const { params } = await propsPromise;
  const { id } = await params;

  let user, profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    user = authData.user;
    profile = authData.profile;
  } catch (error) {
    notFound();
  }

  if (!profile.village_id) {
    return <p>Profil Anda tidak terhubung ke desa.</p>;
  }

  // Ambil data master DAN data laporan yang ada
  const [groups, report] = await Promise.all([
    getGroupsByVillage(profile.village_id),
    getMeetingReportById(id),
  ]);

  // Validasi 1: Laporan tidak ditemukan
  if (!report) {
    notFound();
  }
  
  if (profile.role === "admin_desa" && (report.village_id?.toString() !== profile.village_id?.toString())) {
     return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-red-500">
            Anda hanya dapat mengedit proker untuk desa Anda sendiri.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Ubah Proker" showNav={false} />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Edit Proker
            </h3>
            <ProkerForm
              initialData={report} // <-- Kirim data proker ke form
            />
          </div>
        </div>
      </div>
    </>
  );
}