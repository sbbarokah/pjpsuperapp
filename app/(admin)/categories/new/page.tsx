import Breadcrumb from "@/components/ui/breadcrumb";
import { CategoryForm } from "../_components/category_form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Kategori Baru | Admin",
};

/**
 * Halaman untuk membuat Kategori baru.
 * Ini bertindak sebagai 'wrapper' seperti file `form/page.tsx` Anda.
 */
export default function NewCategoryPage() {
  return (
    <>
      <Breadcrumb pageName="Tambah Kategori Baru" />

      {/* Kita adaptasi layout grid dari template Anda.
        Karena kita hanya punya satu form, kita gunakan 'grid-cols-1'.
      */}
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          {/* Kita tambahkan wrapper 'rounded-lg' di sini 
            (seperti yang mungkin digunakan oleh SignInForm/SignUpForm Anda)
            untuk membungkus komponen form.
          */}
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Kategori
            </h3>
            
            {/* Kita panggil komponen form.
              Kita berikan 'category={null}' untuk menandakan
              ini adalah mode 'Create' (bukan 'Update').
            */}
            <CategoryForm category={null} />
          </div>
        </div>
      </div>
    </>
  );
}
