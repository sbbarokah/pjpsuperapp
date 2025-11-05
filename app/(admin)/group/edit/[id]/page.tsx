import Breadcrumb from "@/components/ui/breadcrumb";
import type { Metadata } from "next";
import { getGroupById, getVillageById, getVillages } from "@/lib/services/masterService"; // Asumsi fungsi ini ada
import { notFound } from "next/navigation";
import { GroupForm } from "../../_components/group_form";

/**
 * Props untuk halaman ini, berisi 'params' dari URL.
 */
interface EditVillagePageProps {
  params: { id: string };
}

/**
 * Hasilkan metadata dinamis berdasarkan kelompok yang diedit.
 */
export async function generateMetadata(
  // --- PERUBAHAN DI SINI ---
  // 1. Ambil 'props' sebagai promise, jangan destructuring dulu
  propsPromise: Promise<EditVillagePageProps>,
): Promise<Metadata> {
  const { params } = await propsPromise;
  const { id } = await params;

  const group = await getVillageById(id);

  return {
    title: `Ubah Kelompok: ${
      group?.name || "Tidak Ditemukan"
    } | Admin`,
  };
}

/**
 * Halaman Server untuk mengedit Kelompok.
 * Ini mengambil data dan memberikannya ke komponen 'VillageForm'.
 */
export default async function EditVillagePage(
  // --- PERUBAHAN DI SINI ---
  // 1. Ambil 'props' sebagai promise
  propsPromise: Promise<EditVillagePageProps>,
) {
  // 2. Await promise-nya
  const { params } = await propsPromise;
  const { id } = await params;

  // Ambil data kelompok spesifik dari server
  const group = await getGroupById(id);
  const villages = await getVillages();

  // Jika kelompok tidak ditemukan, tampilkan halaman 404
  if (!group) {
    notFound();
  }

  return (
    <>
      {/* Gunakan nama kelompok di breadcrumb */}
      <Breadcrumb pageName={`Edit Kelompok: ${group.name}`} showNav={false} />

      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          {/* Wrapper yang sama dengan halaman 'new' */}
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Edit Kelompok
            </h3>

            {/* Berikan 'group' yang sudah di-fetch ke form.
              Ini akan otomatis mengaktifkan 'Update Mode' di dalam form.
            */}
            <GroupForm group={group} villages={villages} />
          </div>
        </div>
      </div>
    </>
  );
}