import { Suspense } from "react";
import { getCategories } from "@/lib/services/masterService";
import Link from "next/link";
import { CategoryCard } from "@/components/cards/cardcategory";
import Breadcrumb from "@/components/ui/breadcrumb";
// PERUBAHAN 2: Impor tombol hapus
import { DeleteCategoryButton } from "./_components/delete_category_button"; 

export const metadata = {
  title: "Daftar Kategori | Admin",
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
async function CategoryList() {
  // Ambil data (ini terjadi di server)
  const categories = await getCategories(); // Asumsi service ini ada

  if (categories.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        Belum ada data kategori.
        {/* Tombol Buat Baru tetap ada di header, tapi ini juga boleh */}
        <Link
          href="/categories/new"
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
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          href={`/categories/edit/${category.id}`}
          // PERUBAHAN 2: Tambahkan 'actions' prop
          // Kita berikan komponen Client 'DeleteCategoryButton'
          // ke prop 'actions' dari Server Component 'CategoryCard'.
          actions={
            <DeleteCategoryButton id={category.id} name={category.name} />
          }
        />
      ))}
    </div>
  );
}

// Halaman utama
export default function CategoryListPage() {
  return (
    <>
      {/* PERUBAHAN 1: Flex Header dengan Tombol Tambah */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Breadcrumb pageName="Kategori" showNav={false} />
        <Link
          href="/categories/new"
          className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
        >
          {/* Ikon Plus Sederhana */}
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Tambah Kategori Baru
        </Link>
      </div>
      {/* --- AKHIR PERUBAHAN 1 --- */}

      {/* 'space-y-10' diganti 'mt-6' agar spasi lebih rapi */}
      <div className="mt-6">
        <Suspense fallback={<CardGridSkeleton />}>
          <CategoryList />
        </Suspense>
      </div>
    </>
  );
}