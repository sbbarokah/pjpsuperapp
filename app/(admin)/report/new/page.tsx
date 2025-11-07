import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server_user";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { ReportForm } from "../_components/report_form";

export const metadata = {
  title: "Buat Laporan KBM | Admin",
};

export default async function NewKbmReportPage() {
  const supabase = await createClient();

  // [PERBAIKAN] Ganti getSession() dengan getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Ambil profil admin (role & village_id)
  const { data: adminProfile } = await supabase
    .from("profile")
    .select("role, village_id, group_id")
    .eq("user_id", user.id)
    .single();

  if (
    !adminProfile ||
    (adminProfile.role !== "admin_desa" &&
      adminProfile.role !== "admin_kelompok") ||
    !adminProfile.village_id // Keduanya wajib punya village_id
  ) {
    return (
      <div className="p-6">
        <p className="text-red-500">
          Hanya Admin Desa atau Admin Kelompok yang dapat membuat laporan ini.
        </p>
      </div>
    );
  }

  // [UBAH] Ambil data groups dan categories secara bersamaan
  const [groups, categories] = await Promise.all([
    getGroupsByVillage(adminProfile.village_id),
    getCategories(), // Asumsi getCategories ada di masterService
  ]);

  return (
    <>
      <Breadcrumb pageName="Buat Laporan KBM" />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Laporan KBM Kelompok
            </h3>
            <ReportForm
              admin={adminProfile}
              groups={groups}
              categories={categories}
            />
          </div>
        </div>
      </div>
    </>
  );
}