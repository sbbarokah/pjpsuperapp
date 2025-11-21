import Breadcrumb from "@/components/ui/breadcrumb";
import { MaterialForm } from "../../_components/material_form";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getMaterialCategories } from "@/lib/services/masterService";
import { getMaterialById } from "@/lib/services/materialService";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Materi | Admin",
};

interface EditPageProps { params: { id: string } }

export default async function EditMaterialPage(propsPromise: Promise<EditPageProps>) {
  const { params } = await propsPromise;
  const { id } = await params;

  try {
    const { profile } = await getAuthenticatedUserAndProfile();
    const canEdit = profile.role === 'superadmin' || profile.role === 'admin_desa';
    if (!canEdit) throw new Error("Akses ditolak");
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const [material, categories] = await Promise.all([
    getMaterialById(id),
    getMaterialCategories()
  ]);
  
  if (!material) {
    notFound();
  }

  return (
    <>
      <Breadcrumb pageName="Edit Materi" />
      <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <MaterialForm initialData={material} categories={categories} />
      </div>
    </>
  );
}