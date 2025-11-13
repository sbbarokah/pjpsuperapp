import Breadcrumb from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server_user"; 
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
  const supabase = await createClient();
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
              Impor Generus
            </h3>
            
            {/* --- [PERUBAHAN] Teks Instruksi --- */}
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Anda dapat mengimpor generus baru melalui dua cara:
              <strong className="text-black dark:text-white"> (1) Upload File</strong> 
              atau <strong className="text-black dark:text-white">(2) Input Teks</strong>.
              Silakan pilih mode di bawah ini.
            </p>

            {/* --- Bagian Unduh Template (Opsional, tapi bagus untuk Tab 1) --- */}
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
              <h4 className="mb-2 font-semibold text-primary">
                Unduh Template (untuk Impor File)
              </h4>
              <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">
                Jika Anda menggunakan mode "Impor via File", gunakan template ini
                untuk memastikan semua kolom sesuai.
              </p>
              <a
                href="/template_generus.xlsx"
                download="template_generus.xlsx"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                {/* ... (SVG Ikon Download) ... */}
                Unduh Template Generus
              </a>
            </div>
            
            {/* --- Bagian Upload (Form) --- */}
            <h4 className="mb-3 text-lg font-semibold text-black dark:text-white">
              Metode Impor
            </h4>
            <Suspense fallback={<FormSkeleton />}>
              <ImportPageLoader />
            </Suspense>

          </div>
        </div>
      </div>
    </>
  );
}