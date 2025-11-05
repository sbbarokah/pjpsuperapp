import Breadcrumb from "@/components/ui/breadcrumb";
import type { Metadata } from "next";
import { GroupForm } from "../_components/group_form";
import { getVillages } from "@/lib/services/masterService";

export const metadata: Metadata = {
  title: "Tambah Kelompok Baru | Admin",
};

/**
 * Halaman untuk membuat Kelompok baru.
 * Ini bertindak sebagai 'wrapper' seperti file `form/page.tsx` Anda.
 */
export default async function NewGroupPage() {
  const villages = await getVillages();
  
  return (
    <>
      <Breadcrumb pageName="Tambah Kelompok Baru" showNav={false} />

      {/* Kita adaptasi layout grid dari template Anda.
        Karena kita hanya punya satu form, kita gunakan 'grid-cols-1'.
      */}
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Kelompok
            </h3>
            
            {/* Kita panggil komponen form.
              Kita berikan 'group={null}' untuk menandakan
              ini adalah mode 'Create' (bukan 'Update').
            */}
            <GroupForm group={null} villages={villages} />
          </div>
        </div>
      </div>
    </>
  );
}
