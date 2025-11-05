import Breadcrumb from "@/components/ui/breadcrumb";
import type { Metadata } from "next";
import { VillageForm } from "../_components/village_form";

export const metadata: Metadata = {
  title: "Tambah Desa Baru | Admin",
};

/**
 * Halaman untuk membuat Desa baru.
 * Ini bertindak sebagai 'wrapper' seperti file `form/page.tsx` Anda.
 */
export default function NewVillagePage() {
  return (
    <>
      <Breadcrumb pageName="Tambah Desa Baru" showNav={false} />

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
              Formulir Desa
            </h3>
            
            {/* Kita panggil komponen form.
              Kita berikan 'village={null}' untuk menandakan
              ini adalah mode 'Create' (bukan 'Update').
            */}
            <VillageForm village={null} />
          </div>
        </div>
      </div>
    </>
  );
}
