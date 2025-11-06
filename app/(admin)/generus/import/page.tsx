import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/client"; // Client untuk sesi
import { getGroupsByVillage } from "@/lib/services/masterService";
import { Suspense } from "react";
import { ImportForm } from "../_components/import_form";

export const metadata = {
  title: "Impor Generus | Admin",
};

// Skeleton sederhana untuk form
function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-24 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-boxdark-2"></div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-boxdark-2"></div>
      <div className="h-12 w-full animate-pulse rounded-lg bg-primary/50"></div>
    </div>
  );
}

// Helper untuk mengambil data admin yang login
async function getAdminData() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: adminProfile } = await supabase
    .from("profile")
    .select("role, village_id, group_id")
    .eq("user_id", session.user.id)
    .single();
    
  return adminProfile;
}

// Komponen Server untuk mengambil data
async function ImportPageLoader() {
  const adminProfile = await getAdminData();

  if (!adminProfile) {
    return <p>Sesi tidak valid atau profil admin tidak ditemukan.</p>;
  }

  // Ambil daftar kelompok HANYA jika admin adalah admin_desa
  let groupsForSelection = [];
  if (adminProfile.role === 'admin_desa' && adminProfile.village_id) {
    groupsForSelection = await getGroupsByVillage(adminProfile.village_id);
  }

  return <ImportForm admin={adminProfile} groups={groupsForSelection} />;
}


export default function ImportGenerusPage() {
  return (
    <>
      <Breadcrumb pageName="Impor Generus" />

      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-6.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-4.5 text-xl font-semibold text-black dark:text-white">
              Upload File Generus
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Upload file .xlsx, .xls, atau .csv. Pastikan file Anda memiliki
              kolom: `email`, `username`, `full_name`, `gender`,
              `birth_place`, `birth_date`, `category_id`, `school_level`,
              `school_name`, `father_name`, `father_occupation`, `mother_name`,
              `mother_occupation`, `parent_contact`.
            </p>
            <Suspense fallback={<FormSkeleton />}>
              <ImportPageLoader />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}