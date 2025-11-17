import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getMaterialCategoryById } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { CategoryForm } from "../../_components/category_form";

export const metadata = {
  title: "Edit Kategori Materi | Admin",
};

interface EditPageProps { params: { id: string } }

export default async function EditKategoriMateriPage({ params }: EditPageProps) {
  // Cek otentikasi & otorisasi
  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canEdit = profile.role === 'superadmin' || profile.role === 'admin_desa';
    if (!canEdit) throw new Error("Akses ditolak");
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const category = await getMaterialCategoryById(Number(params.id));
  if (!category) {
    notFound();
  }

  return (
    <>
      <Breadcrumb pageName="Edit Kategori Materi" />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <CategoryForm initialData={category} />
      </div>
    </>
  );
}