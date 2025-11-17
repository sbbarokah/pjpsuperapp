import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getMaterialCategories } from "@/lib/services/masterService";
import { MaterialForm } from "../_components/material_form";

export const metadata = {
  title: "Tambah Materi | Admin",
};

export default async function CreateMaterialPage() {
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canCreate = profile.role === 'superadmin' || profile.role === 'admin_desa';
    if (!canCreate) throw new Error("Akses ditolak");
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const categories = await getMaterialCategories();
  if (categories.length === 0) {
    return (
      <>
        <Breadcrumb pageName="Error" />
        <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p>Harap buat "Kategori Materi" di Master Data terlebih dahulu sebelum menambahkan materi.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Tambah Materi Baru" />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <MaterialForm categories={categories} />
      </div>
    </>
  );
}