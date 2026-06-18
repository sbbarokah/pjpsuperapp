import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { canViewMenuUsers } from "@/lib/utils/rbac";
import Breadcrumb from "@/components/ui/breadcrumb";
import { PlusCircle, ShieldCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server_admin";
import { FilteredAdminListClient } from "./_components/admin_list_client";

export const metadata = {
  title: "Manajemen Admin & Pengurus | Superadmin",
};

// --- Skeleton Loader ---
function TableSkeleton() {
  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="h-10 w-full animate-pulse rounded-md bg-gray-200 dark:bg-meta-4 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-md bg-gray-100 dark:bg-boxdark-2"></div>
        ))}
      </div>
    </div>
  );
}

// --- Server Component untuk Fetching ---
async function AdminListFetcher() {
  // PASTIKAN menggunakan createAdminClient (Service Role Key)
  // karena hanya admin client yang punya akses ke auth.admin
  const supabase = await createAdminClient(); 

  // 1. Ambil data profil dari public.profile
  const { data: admins, error } = await supabase
    .from("profile") 
    .select(`
      id,
      user_id,
      full_name,
      username,
      role,
      village_id,
      group_id,
      villages:village_id (name),
      groups:group_id (name)
    `)
    .in("role", ["admin_desa", "pengurus_desa", "admin_kelompok", "pengurus_kelompok"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admins:", error);
    return <p className="text-red-500">Gagal memuat data admin.</p>;
  }

  // 2. Tarik Email dari auth.users dan gabungkan (Merge)
  // Menggunakan Promise.all agar request berjalan paralel dan lebih cepat
  const adminsWithEmail = await Promise.all(
    (admins || []).map(async (admin) => {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(admin.user_id);
        
        return {
          ...admin,
          // Sisipkan email jika ada, jika gagal beri fallback
          email: authData?.user?.email || "Tidak ada email", 
        };
      } catch (err) {
        return {
          ...admin,
          email: "Error memuat email",
        };
      }
    })
  );

  // 3. Kirim data yang sudah digabung ke Client Component
  return <FilteredAdminListClient admins={adminsWithEmail} />;
}

// --- Halaman Utama ---
export default async function UsersManagementPage() {
  // 1. PROTEKSI HALAMAN (HANYA SUPERADMIN)
  const { profile } = await getAuthenticatedUserAndProfile();
  
  if (!canViewMenuUsers(profile.role)) {
    redirect("/"); // Tendang ke dashboard jika bukan superadmin
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Breadcrumb pageName="Manajemen Pengguna" showNav={false} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-500" />
            Hak Akses Khusus Superadmin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/users/new"
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition-all"
          >
            <PlusCircle size={20} />
            Tambah Admin/Pengurus
          </Link>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AdminListFetcher />
      </Suspense>
    </>
  );
}