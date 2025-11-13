import Breadcrumb from "@/components/ui/breadcrumb";
import { CategoryForm } from "../../_components/category_form"; // Path disesuaikan
import type { Metadata } from "next";
import { getCategoryById } from "@/lib/services/masterService"; // Asumsi fungsi ini ada
import { notFound } from "next/navigation";

/**
 * Props untuk halaman ini, berisi 'params' dari URL.
 */
interface EditCategoryPageProps {
  params: { id: string };
}

/**
 * Hasilkan metadata dinamis berdasarkan kategori yang diedit.
 */
export async function generateMetadata(
  // --- PERUBAHAN DI SINI ---
  // 1. Ambil 'props' sebagai promise, jangan destructuring dulu
  propsPromise: Promise<EditCategoryPageProps>,
): Promise<Metadata> {
  const { params } = await propsPromise;
  const { id } = await params;

  const category = await getCategoryById(id);

  return {
    title: `Edit Kategori: ${
      category?.name || "Tidak Ditemukan"
    } | Admin`,
  };
}

/**
 * Halaman Server untuk mengedit Kategori.
 * Ini mengambil data dan memberikannya ke komponen 'CategoryForm'.
 */
export default async function EditCategoryPage(
  // --- PERUBAHAN DI SINI ---
  // 1. Ambil 'props' sebagai promise
  propsPromise: Promise<EditCategoryPageProps>,
) {
  // 2. Await promise-nya
  const { params } = await propsPromise;
  const { id } = await params;

  // Ambil data kategori spesifik dari server
  const category = await getCategoryById(id);

  // Jika kategori tidak ditemukan, tampilkan halaman 404
  if (!category) {
    notFound();
  }

  return (
    <>
      {/* Gunakan nama kategori di breadcrumb */}
      <Breadcrumb pageName={`Edit Kategori: ${category.name}`} showNav={false} />

      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          {/* Wrapper yang sama dengan halaman 'new' */}
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Edit Kategori
            </h3>

            {/* Berikan 'category' yang sudah di-fetch ke form.
              Ini akan otomatis mengaktifkan 'Update Mode' di dalam form.
            */}
            <CategoryForm category={category} />
          </div>
        </div>
      </div>
    </>
  );
}