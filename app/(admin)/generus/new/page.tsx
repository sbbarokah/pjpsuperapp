import Breadcrumb from "@/components/ui/breadcrumb";
import type { Metadata } from "next";
import {
  getVillages,
  getGroups,
  getCategories,
} from "@/lib/services/masterService";
import { UserForm } from "../_components/user_form";

export const metadata: Metadata = {
  title: "Tambah Pengguna Baru | Admin",
};

/**
 * Halaman untuk membuat Pengguna/Siswa baru.
 */
export default async function NewUserPage() {
  // Ambil semua data relasi untuk dropdown di server
  const villages = await getVillages();
  const groups = await getGroups(); // <-- Anda perlu membuat fungsi ini
  const categories = await getCategories(); // <-- Anda sudah punya ini

  return (
    <>
      <Breadcrumb pageName="Tambah Generus Baru" />

      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Generus
            </h3>

            <UserForm
              user={null}
              villages={villages}
              groups={groups}
              categories={categories}
            />
          </div>
        </div>
      </div>
    </>
  );
}