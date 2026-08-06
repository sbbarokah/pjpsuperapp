// app/generus/page.tsx

import { Suspense } from "react";
import Link from "next/link";

import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server_user";
import { getUsersForAdmin, getUsersForAdminServerSide, getUsersWithFiltersForAdminServerSide } from "@/lib/services/userService";
import {
  getGroups,
  getVillages,
  getCategories,
} from "@/lib/services/masterService";
import { FilteredUserListClient } from "./_components/filtered_user_list";
import { ExportButton } from "./_components/export_button";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { canMutateData } from "@/lib/utils/rbac";
import { Plus, Upload } from "lucide-react";

export const metadata = {
  title: "Daftar Generus | Admin",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    group?: string;
    category?: string;
    page?: string;
    limit?: string;
    sort?: string;
  }>;
}

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
async function UserList2() {
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
  const allClass = await getCategories();

  // 4. [PERUBAHAN]
  //    Kita tidak me-render list di sini lagi.
  //    Kita kirim 'users' ke Client Component untuk di-filter dan di-render.
  // return <FilteredUserListClient users={users} allClass={allClass} />;
}

async function UserList({ resolvedParams }: { resolvedParams: Awaited<PageProps["searchParams"]> }) {
  const search = resolvedParams.search || "";
  const group = resolvedParams.group || "";
  const category = resolvedParams.category || "";
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 12;
  const sort = resolvedParams.sort === "desc" ? "desc" : "asc";

  const supabase = await createClient();

  // 1. Dapatkan session admin yang login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="text-center">Sesi tidak valid.</p>;

  const { data: adminProfile } = await supabase
    .from("profile")
    .select("role, village_id, group_id")
    .eq("user_id", user.id)
    .single();

  if (!adminProfile) {
    return <p className="text-center">Profil admin tidak ditemukan.</p>;
  }

  // 2. Ambil data terfilter & ter-paginate langsung dari DB
  // old
  // const { users, totalItems } = await getUsersForAdminServerSide({
  //   admin: adminProfile,
  //   search,
  //   group,
  //   category,
  //   page,
  //   limit,
  // });
  const groupParam = resolvedParams.group || "";
  const categoryParam = resolvedParams.category || "";
  const groupsArray = groupParam ? groupParam.split(",") : [];
  const categoriesArray = categoryParam ? categoryParam.split(",") : [];

  const { users, totalItems } = await getUsersWithFiltersForAdminServerSide({
    admin: adminProfile,
    search,
    groups: groupsArray.length > 0 ? groupsArray : undefined,
    categories: categoriesArray.length > 0 ? categoriesArray : undefined,
    page,
    limit,
  });

  const allClass = await getCategories();

  return (
    <FilteredUserListClient 
      users={users} 
      allClass={allClass} 
      totalItems={totalItems}
      currentPage={page}
      itemsPerPage={limit}
      canMutate={canMutateData(adminProfile.role)}
    />
  );
}

// --- Halaman Utama ---
export default async function GenerusListPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const { profile } = await getAuthenticatedUserAndProfile();

  const canMutate = canMutateData(profile.role);

  const [groups, categories] = await Promise.all([
    getGroups(),
    getCategories(),
  ]);

  return (
    <>
      {/* Header: Breadcrumb dan Tombol Tambah Baru */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Breadcrumb pageName="Generus" showNav={false} />

        {/* Grup Tombol Impor dan Tambah Baru */}
        {canMutate && (
          <div className="flex items-center gap-3">
            <ExportButton groups={groups} categories={categories} />
            {/* Tombol Impor Baru */}
            <Link
              href="/generus/import"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-primary bg-white px-4 py-2 text-center font-medium text-primary hover:bg-primary/10 dark:border-primary dark:bg-boxdark dark:text-white dark:hover:bg-primary/10"
            >
              <Upload size={18} />
              Impor Generus
            </Link>

            {/* Tombol Tambah Baru (Sudah Ada) */}
            <Link
              href="/generus/new"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              <Plus size={18} />
              Tambah Generus Baru
            </Link>
          </div>
        )}
      </div>

      {/* Grid Data dengan Suspense */}
      <div className="mt-6">
        <Suspense key={JSON.stringify(resolvedParams)} fallback={<CardGridSkeleton />}>
          <UserList resolvedParams={resolvedParams} />
        </Suspense>
      </div>
    </>
  );
}