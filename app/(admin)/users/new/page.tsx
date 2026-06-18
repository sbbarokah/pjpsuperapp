import Breadcrumb from "@/components/ui/breadcrumb";
import type { Metadata } from "next";
import { getVillages, getGroups } from "@/lib/services/masterService";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { notFound, redirect } from "next/navigation";
import { canViewMenuUsers } from "@/lib/utils/rbac";
import { AdminForm } from "../_components/admin_form";

export const metadata: Metadata = {
  title: "Tambah Admin/Pengurus | Superadmin",
};

export default async function NewAdminPage() {
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    notFound();
  }

  // Proteksi: Hanya Superadmin yang boleh mengakses halaman ini
  if (!canViewMenuUsers(profile.role)) {
    redirect("/");
  }

  // Ambil data wilayah untuk penugasan admin
  const villages = await getVillages();
  const groups = await getGroups();

  return (
    <>
      <Breadcrumb pageName="Tambah Admin / Pengurus Baru" />

      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white border-b border-stroke pb-4 dark:border-strokedark">
              Formulir Akses Pengurus
            </h3>
            
            <AdminForm
              admin={profile}
              user={null}
              villages={villages}
              groups={groups}
            />
          </div>
        </div>
      </div>
    </>
  );
}