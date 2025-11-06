// app/generus/edit/[id]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import { getUserDetails } from "@/lib/services/userService";
import {
  getGroups,
  getVillages,
  getCategories,
} from "@/lib/services/masterService";
import { UserForm } from "../../_components/user_form";

export const metadata = {
  title: "Ubah Generus | Admin",
};

// Skeleton loader sederhana untuk form
function FormSkeleton() {
  return (
    // Gunakan Fragment <>...</> karena wrapper sudah ada di luar Suspense
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Skeleton untuk Kolom 1 */}
        <div className="flex flex-col gap-4.5">
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
        </div>
        {/* Skeleton untuk Kolom 2 */}
        <div className="flex flex-col gap-4.5">
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
        </div>
      </div>
      {/* Skeleton untuk Tombol Submit */}
      <div className="mt-6 h-12 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-boxdark-2"></div>
    </>
  );
}

export default async function EditGenerusPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = await params;
  console.log("isi params", userId);
  const [userData, groups, villages, categories] = await Promise.all([
    getUserDetails(userId).catch(() => null), // Ambil detail user
    getGroups(),
    getVillages(),
    getCategories(),
  ]);

  // 2. Jika user tidak ditemukan, tampilkan halaman 404
  if (!userData) {
    notFound();
  }

  return (
    <>
      <Breadcrumb pageName="Ubah Generus" showNav={false} />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Formulir Ubah Generus
            </h3>

            <Suspense fallback={<FormSkeleton />}>
              <UserForm
                user={userData}
                villages={villages}
                groups={groups}
                categories={categories}
              />
            </Suspense>
          </div>
          
        </div>
      </div>
      {/* <div className="mt-6">
        <Suspense fallback={<FormSkeleton />}>
          <UserForm 
            user={userData}
            villages={villages}
            groups={groups}
            categories={categories} 
          />
        </Suspense>
      </div> */}
    </>
  );
}