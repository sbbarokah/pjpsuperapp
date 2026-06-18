import { Suspense } from "react";
import { getGroups } from "@/lib/services/masterService";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import { GroupCard } from "@/components/cards/cardgroup";
import { DeleteGroupButton } from "./_components/delete_group_button";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { Plus } from "lucide-react";
import { isSuperNDesaAdmin } from "@/lib/utils/rbac";

export const metadata = {
  title: "Daftar Kelompok | Admin",
};

// Komponen 'loading skeleton' sederhana
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="h-24 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-boxdark-2"
        ></div>
      ))}
    </div>
  );
}

// Komponen Server untuk mengambil dan menampilkan data
async function GroupList({canMutate}: {canMutate: boolean}) {
  // Ambil data (ini terjadi di server)
  const groups = await getGroups(); // Asumsi service ini ada

  if (canMutate && (groups.length === 0)) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        Belum ada data Kelompok.
        {/* Tombol Buat Baru tetap ada di header, tapi ini juga boleh */}
        <Link
          href="/group/new"
          className="ml-2 text-primary hover:underline"
        >
          Buat Baru
        </Link>
      </div>
    );
  }

  return (
    // Ini adalah grid responsif yang Anda inginkan
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map((item) => (
        <GroupCard
          key={item.id}
          group={item}
          href={`/group/edit/${item.id}`}
          // PERUBAHAN 2: Tambahkan 'actions' prop
          // Kita berikan komponen Client 'DeleteitemButton'
          // ke prop 'actions' dari Server Component 'itemCard'.
          actions={
            canMutate && (
              <DeleteGroupButton id={String(item.id)} name={item.name} />
            )
          }
        />
      ))}
    </div>
  );
}

// Halaman utama
export default async function CategoryListPage() {
  const { profile } = await getAuthenticatedUserAndProfile();
  
  const canMutate = isSuperNDesaAdmin(profile.role);

  return (
    <>
      {/* PERUBAHAN 1: Flex Header dengan Tombol Tambah */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Breadcrumb pageName="Kelompok" showNav={false} />
        {canMutate && (
          <Link
            href="/group/new"
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
          >
            <Plus size={18} />
            Tambah Kelompok Baru
          </Link>
        )}
      </div>
      {/* --- AKHIR PERUBAHAN 1 --- */}

      {/* 'space-y-10' diganti 'mt-6' agar spasi lebih rapi */}
      <div className="mt-6">
        <Suspense fallback={<CardGridSkeleton />}>
          <GroupList canMutate={canMutate} />
        </Suspense>
      </div>
    </>
  );
}