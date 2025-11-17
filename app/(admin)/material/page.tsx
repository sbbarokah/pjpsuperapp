import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getMaterialsList } from "@/lib/services/materialService";
import { getMaterialCategories } from "@/lib/services/masterService";
import { Suspense } from "react";
import Link from "next/link";
import { MaterialListClient } from "./_components/material_list_client";

export const metadata = {
  title: "Manajemen Materi | Admin",
};

interface MateriPageProps {
  searchParams: {
    category?: string;
  };
}

const ListSkeleton = () => (
  <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="h-10 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-boxdark-2 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-40 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2"></div>
      <div className="h-40 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2"></div>
    </div>
  </div>
);

async function MaterialList({ categoryId, profile }: { categoryId?: number, profile: any }) {
  const materials = await getMaterialsList({ categoryId });
  return <MaterialListClient materials={materials} categories={[]} profile={profile} />;
}

export default async function MateriPage({ searchParams }: MateriPageProps) {
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }
  
  const canCreate = profile.role === 'superadmin' || profile.role === 'admin_desa';
  const categoryId = searchParams.category ? Number(searchParams.category) : undefined;

  // Ambil daftar kategori untuk dropdown filter
  const categories = await getMaterialCategories();

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Breadcrumb pageName="Materi Kurikulum" />
        {canCreate && (
          <Link
            href="/admin/materi/create"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-6"
          >
            Tambah Materi Baru
          </Link>
        )}
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <MaterialList categoryId={categoryId} profile={profile} />
      </Suspense>
    </>
  );
}