
import { Suspense } from "react";
import { getCategories } from "@/lib/services/masterService";
import Link from "next/link";
import { CategoryCard } from "@/components/cards/cardcategory";
import Breadcrumb from "@/components/ui/breadcrumb";

export const metadata = {
  title: "Daftar Kategori | Admin",
};

// Komponen 'loading skeleton' sederhana
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-24 w-full rounded-lg bg-gray-100 dark:bg-boxdark-2 animate-pulse"></div>
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
          <Link href="/admin/categories/new" className="text-primary ml-2 hover:underline">
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
          href={`/admin/categories/edit/${category.id}`}
          // 'actions' bisa ditambahkan di sini, cth:
          // actions={<CategoryActionsDropdown id={category.id} />}
        />
      ))}
    </div>
  );
}

// Halaman utama
export default function CategoryListPage() {
  return (
    <>
      <Breadcrumb pageName="Kategori" />

      {/* Gunakan 'space-y' seperti di template Anda */}
      <div className="space-y-10">
        <Suspense fallback={<CardGridSkeleton />}>
          <CategoryList />
        </Suspense>
      </div>
    </>
  );
}