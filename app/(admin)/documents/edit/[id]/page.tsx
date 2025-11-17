import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage } from "@/lib/services/masterService";
import { getDocumentById } from "@/lib/services/documentService";
import { notFound } from "next/navigation";
import { DocumentForm } from "../../_components/document_form";

export const metadata = {
  title: "Ubah Berkas | Admin",
};

interface EditPageProps {
  params: { id: string };
}

export default async function EditDocumentPage(propsPromise: Promise<EditPageProps>) {
  const { params } = await propsPromise;
  const { id } = await params;

  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (error) {
    notFound();
  }

  // Ambil data berkas yang akan diedit
  const document = await getDocumentById(id);
  if (!document) {
    notFound();
  }

  // Validasi: Hanya superadmin dan admin_desa yang bisa mengakses halaman edit
  const canEdit =
    profile.role === 'superadmin' ||
    (profile.role === 'admin_desa' && profile.village_id === document.village_id);

  if (!canEdit) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" showNav={false} />
        <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-red-500">
            Anda tidak memiliki izin untuk mengedit berkas ini.
          </p>
        </div>
      </>
    );
  }

  // Ambil data groups untuk dropdown
  const villageIdForGroups = profile.village_id || document.village_id;
  const groups = (profile.role !== 'admin_kelompok' && villageIdForGroups)
    ? await getGroupsByVillage(villageIdForGroups)
    : [];

  return (
    <>
      <Breadcrumb pageName="Ubah Berkas" showNav={false} />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            {/* <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Edit Berkas
            </h3> */}
            <DocumentForm
              admin={profile}
              groups={groups}
              initialData={document} // <-- Mode edit
            />
          </div>
        </div>
      </div>
    </>
  );
}