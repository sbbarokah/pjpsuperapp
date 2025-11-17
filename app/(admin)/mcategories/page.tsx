import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getMaterialCategories } from "@/lib/services/masterService";
import { Suspense } from "react";
import Link from "next/link";
import { MaterialCategoryListClient } from "./_components/mcategory_list_client";

export const metadata = {
  title: "Master Kategori Materi | Admin",
};

const ListSkeleton = () => (
  <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="h-12 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2 mb-2"></div>
    <div className="h-12 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2"></div>
  </div>
);

async function MaterialCategoryList() {
  const categories = await getMaterialCategories();
  return <MaterialCategoryListClient categories={categories} />;
}

export default async function KategoriMateriPage() {
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const canCreate = profile.role === 'superadmin' || profile.role === 'admin_desa';

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Breadcrumb pageName="Master Kategori Materi" />
        {canCreate && (
          <Link
            href="/admin/master/kategori-materi/create"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-6"
          >
            Tambah Kategori Baru
          </Link>
        )}
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <MaterialCategoryList />
      </Suspense>
    </>
  );
}