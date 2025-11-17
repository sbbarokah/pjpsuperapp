import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { MaterialCategoryForm } from "../_components/mcategory_form";

export const metadata = {
  title: "Tambah Kategori Materi | Admin",
};

export default async function CreateKategoriMateriPage() {
  // Cek otentikasi & otorisasi
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canCreate = profile.role === 'superadmin' || profile.role === 'admin_desa';
    if (!canCreate) throw new Error("Akses ditolak");
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  return (
    <>
      <Breadcrumb pageName="Tambah Kategori Materi" />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <MaterialCategoryForm />
      </div>
    </>
  );
}