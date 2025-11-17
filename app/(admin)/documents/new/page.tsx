import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { DocumentForm } from "../_components/document_form";

export const metadata = {
  title: "Tambah Berkas Baru | Admin",
};

export default async function NewDocumentPage() {
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (error) {
    notFound();
  }

  // Blokir akses halaman jika role tidak sesuai
  const canCreate = profile.role === 'superadmin' || profile.role === 'admin_desa';
  if (!canCreate) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-red-500">
            Peran Anda ({profile.role}) tidak diizinkan untuk menambah berkas baru.
          </p>
        </div>
      </>
    );
  }

  // Ambil data group untuk admin_desa
  const groups = (profile.role === 'admin_desa' && profile.village_id)
    ? await getGroupsByVillage(profile.village_id)
    : [];
  
  // Superadmin mungkin perlu semua grup (logika bisa ditambah di sini)

  return (
    <>
      <Breadcrumb pageName="Tambah Berkas Baru" />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Berkas
            </h3>
            <DocumentForm
              admin={profile}
              groups={groups}
              // Mode create, tidak ada initialData
            />
          </div>
        </div>
      </div>
    </>
  );
}