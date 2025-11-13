import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { Suspense } from "react";
import { GroupReportList } from "./_components/group_report_list";
import { VillageReportList } from "./_components/village_report_list";


export const metadata = {
  title: "Laporan KBM | Admin",
};

// Buat skeleton sederhana untuk 'loading state'
// Anda bisa pindahkan ini ke file sendiri jika mau
function CardListSkeleton() {
   return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 w-full rounded-lg bg-gray-100 dark:bg-boxdark-2 animate-pulse"></div>
      ))}
    </div>
  );
}

/**
 * Halaman ini bertindak sebagai 'router' berdasarkan peran pengguna.
 * Ia akan memvalidasi pengguna dan kemudian me-render
 * komponen daftar yang sesuai.
 */
export default async function KbmReportsPage() {
  let profile;
  try {
    // 1. Validasi pengguna
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error: any) {
    // Tangani jika tidak login
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Anda harus login untuk mengakses halaman ini.</p>
      </>
    );
  }

  // 2. Tentukan komponen yang akan di-render
  let ReportViewComponent = null;

  if (profile.role === "admin_kelompok") {
    ReportViewComponent = <GroupReportList profile={profile} />;
  } else if (profile.role === "admin_desa") {
    ReportViewComponent = <VillageReportList profile={profile} />;
  }

  // 3. Render
  return (
    <>
      <Breadcrumb pageName="Laporan KBM" />
      <div className="space-y-10">
        <Suspense fallback={<CardListSkeleton />}>
          {ReportViewComponent ? (
            ReportViewComponent
          ) : (
            <p>
              Peran Anda ({profile.role}) tidak memiliki akses untuk melihat
              laporan.
            </p>
          )}
        </Suspense>
      </div>
    </>
  );
}