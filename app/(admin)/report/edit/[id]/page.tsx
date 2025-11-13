import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server_user";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { ReportForm } from "../../_components/report_form";
import { getKbmReportById } from "@/lib/services/reportService";

export const metadata = {
  title: "Edit Laporan KBM | Admin",
};

// Props untuk halaman dinamis
interface EditReportPageProps {
  params: {
    id: string; // 'id' dari folder [id]
  };
}

export default async function EditKbmReportPage({
  params,
}: EditReportPageProps) {
  const supabase = await createClient();
  const reportId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Ambil profil admin
  const { data: adminProfile } = await supabase
    .from("profile")
    .select("role, village_id, group_id")
    .eq("user_id", user.id)
    .single();

  if (
    !adminProfile ||
    adminProfile.role !== "admin_kelompok" || // Hanya admin kelompok
    !adminProfile.village_id ||
    !adminProfile.group_id // Admin kelompok wajib punya group_id
  ) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-red-500">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </>
    );
  }

  // [UBAH] Ambil data master DAN data laporan yang ada
  const [groups, categories, report] = await Promise.all([
    getGroupsByVillage(adminProfile.village_id),
    getCategories(),
    getKbmReportById(reportId), // <-- Ambil laporan yg mau di-edit
  ]);

  // Validasi 1: Laporan tidak ditemukan
  if (!report) {
    notFound();
  }

  // Validasi 2: Keamanan - Admin kelompok hanya bisa edit laporannya sendiri
  if (report.group_id !== adminProfile.group_id) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-red-500">
            Anda hanya dapat mengedit laporan untuk kelompok Anda sendiri (
            {report.group_id} vs {adminProfile.group_id}).
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Edit Laporan KBM" showNav={false} />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Edit Laporan KBM Kelompok
            </h3>
            <ReportForm
              authorId={user.id} // ID pengguna yg sedang MENGEDIT
              admin={adminProfile}
              groups={groups}
              categories={categories}
              initialData={report} // <-- Kirim data laporan ke form
            />
          </div>
        </div>
      </div>
    </>
  );
}