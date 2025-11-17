import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getDocumentsList } from "@/lib/services/documentService";
import { Suspense } from "react";
import Link from "next/link";
import { DocumentListClient } from "./_components/document_list";

export const metadata = {
  title: "Manajemen Berkas | Admin",
};

// --- Skeleton ---
const ListSkeleton = () => (
  <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="h-8 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-boxdark-2 mb-4"></div>
    <div className="h-12 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2 mb-2"></div>
    <div className="h-12 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2"></div>
  </div>
);

// --- Komponen Data Asinkron ---
async function DocumentList({ profile }: { profile: any }) {
  // Tentukan filter berdasarkan role
  let filters = {};
  if (profile.role === 'admin_kelompok') {
    filters = { groupId: profile.group_id };
  } else if (profile.role === 'admin_desa') {
    filters = { villageId: profile.village_id };
  }
  // Superadmin tidak memiliki filter (filters = {})

  const documents = await getDocumentsList(filters);
  
  return <DocumentListClient documents={documents} profile={profile} />;
}


// --- Halaman Utama ---
export default async function DocumentsPage() {
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error: any) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Anda harus login untuk mengakses halaman ini.</p>
      </>
    );
  }
  
  // [MODIFIKASI] Tentukan siapa yang bisa membuat berkas
  const canCreate = profile.role === 'superadmin' || profile.role === 'admin_desa';

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Breadcrumb pageName="Manajemen Berkas" />
        
        {/* [MODIFIKASI] Tampilkan tombol hanya jika diizinkan */}
        {canCreate && (
          <Link
            href="/admin/berkas/create"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-6"
          >
            Tambah Berkas Baru
          </Link>
        )}
      </div>

      <div className="space-y-10">
        <Suspense fallback={<ListSkeleton />}>
          <DocumentList profile={profile} />
        </Suspense>
      </div>
    </>
  );
}