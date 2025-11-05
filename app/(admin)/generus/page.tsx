// app/generus/page.tsx

import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";

import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server_user"; // Client untuk sesi
import { getUsersForAdmin } from "@/lib/services/userService"; // Service yg kita buat tadi
import { DeleteUserButton } from "./_components/delete_user_button";
import { UserCard } from "@/components/cards/carduser";

export const metadata = {
  title: "Daftar Generus | Admin",
};

// --- Skeleton Loader ---
// Disesuaikan agar lebih mirip UserCard
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
  // 1. [INI DIA] Panggil client dari 'server_user.ts'
  //    Ini secara otomatis membaca cookie dan memvalidasi sesi.
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <p className="text-center">Sesi tidak valid atau Anda tidak login.</p>;
  }

  // 2. Dapatkan profil admin yang login untuk filter
  const { data: adminProfile } = await supabase
    .from("profile")
    .select("role, village_id, group_id")
    .eq("user_id", session.user.id)
    .single();

  if (!adminProfile) {
    return <p className="text-center">Profil admin tidak ditemukan.</p>;
  }

  // 3. Panggil service dengan data admin yang login
  const users = await getUsersForAdmin(adminProfile);

  if (users.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        Belum ada data Generus.
        <Link
          href="/generus/new"
          className="ml-2 text-primary hover:underline"
        >
          Buat Baru
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.map((user) => {
        const userName =
          `${user.front_name || ""} ${user.last_name || ""}`.trim() ||
          user.username;

        return (
          <UserCard
            key={user.user_id} // Pastikan key unik, user_id adalah kandidat bagus
            user={user}
            href={`/generus/edit/${user.user_id}`}
            actions={
              <DeleteUserButton id={user.user_id} name={userName} />
            }
          />
        );
      })}
    </div>
  );
}

// --- Halaman Utama ---
export default function GenerusListPage() {
  return (
    <>
      {/* Header: Breadcrumb dan Tombol Tambah Baru */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Breadcrumb pageName="Generus" showNav={false} />
        <Link
          href="/generus/new"
          className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
        >
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

      {/* Grid Data dengan Suspense */}
      <div className="mt-6">
        <Suspense fallback={<CardGridSkeleton />}>
          <UserList />
        </Suspense>
      </div>
    </>
  );
}