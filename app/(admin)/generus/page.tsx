// app/generus/page.tsx

import { Suspense } from "react";
import Link from "next/link";

import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server_user";
import { getUsersForAdmin } from "@/lib/services/userService";
import {
  getGroups,
  getVillages,
  getCategories,
} from "@/lib/services/masterService";
import { FilteredUserListClient } from "./_components/filtered_user_list";

export const metadata = {
  title: "Daftar Generus | Admin",
};

export type UserFormMasterData = {
  groups: Awaited<ReturnType<typeof getGroups>>;
  villages: Awaited<ReturnType<typeof getVillages>>;
  categories: Awaited<ReturnType<typeof getCategories>>;
};

// --- Skeleton Loader ---
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex h-44 w-full flex-col gap-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-boxdark-2 dark:bg-boxdark"
        >
          <div className="flex flex-col gap-2">
            <div className="h-5 w-3/4 animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
            <div className="h-4 w-1/4 animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
          </div>
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
          <div className="mt-auto h-4 w-1/2 animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
        </div>
      ))}
    </div>
  );
}

// --- Komponen Server untuk Fetching Data ---
async function UserList() {
  // 1. Panggil client dari 'server_user.ts'
  const supabase = await createClient();

  // 2. Logika getSession dan get adminProfile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="text-center">Sesi tidak valid atau Anda tidak login.</p>;
  }

  const { data: adminProfile } = await supabase
    .from("profile")
    .select("role, village_id, group_id")
    .eq("user_id", user.id)
    .single();

  if (!adminProfile) {
    return <p className="text-center">Profil admin tidak ditemukan.</p>;
  }

  // 3. Panggil service dengan data admin yang login
  const users = await getUsersForAdmin(adminProfile);

  // 4. [PERUBAHAN]
  //    Kita tidak me-render list di sini lagi.
  //    Kita kirim 'users' ke Client Component untuk di-filter dan di-render.
  return <FilteredUserListClient users={users} />;
}

// --- Halaman Utama ---
export default function GenerusListPage() {
  return (
    <>
      {/* Header: Breadcrumb dan Tombol Tambah Baru */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Breadcrumb pageName="Generus" showNav={false} />

        {/* Grup Tombol Impor dan Tambah Baru */}
        <div className="flex items-center gap-3">
          {/* Tombol Impor Baru */}
          <Link
            href="/generus/import"
            className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-primary bg-white px-4 py-2 text-center font-medium text-primary hover:bg-primary/10 dark:border-primary dark:bg-boxdark dark:text-white dark:hover:bg-primary/10"
          >
            {/* Ikon Upload Sederhana */}
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              ></path>
            </svg>
            Impor Generus
          </Link>

          {/* Tombol Tambah Baru (Sudah Ada) */}
          <Link
            href="/generus/new"
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
          >
            {/* Ikon Tambah Sederhana */}
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
            Tambah Generus Baru
          </Link>
        </div>
      </div>

      {/* Grid Data dengan Suspense */}
      <div className="mt-6">
        <Suspense fallback={<CardGridSkeleton />}>
          <UserList />
        </Suspense>
      </div>
    </>
  );
}