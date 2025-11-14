import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { Suspense } from "react";
import {
  getRecentMeetingReports,
  getRecentKbmReports,
} from "@/lib/services/dashboardService";
import { ActivityFeed } from "./dashboard/_components/activity_feed";
import { CategoryStatsGroup } from "./dashboard/_components/category_stats_card";
// [FIX] Impor dari path _components yang benar

export const metadata = {
  title: "Dashboard | Admin",
};

/**
 * Komponen Server untuk mengambil Data Aktivitas
 */
async function RecentActivity() {
  // Ambil data secara paralel
  const [meetingReports, kbmReports] = await Promise.all([
    getRecentMeetingReports(),
    getRecentKbmReports(),
  ]);

  return <ActivityFeed meetingReports={meetingReports} kbmReports={kbmReports} />;
}

// --- Halaman Utama ---
export default async function DashboardPage() {
  // Cek otentikasi (profile akan diambil di dalam komponen anak)
  try {
    await getAuthenticatedUserAndProfile();
  } catch (error: any) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Anda harus login untuk mengakses halaman ini.</p>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Dashboard" />

      {/* [FIX] Memuat Grup Statistik (yang akan mengambil datanya sendiri) */}
      <div className="mt-4 md:mt-6 2xl:mt-9">
        <Suspense fallback={<CategoryStatsSkeleton />}>
          <CategoryStatsGroup />
        </Suspense>
      </div>

      <div className="mt-4 md:mt-6 2xl:mt-9">
        <h2 className="mb-6 text-2xl font-semibold text-black dark:text-white">
          Aktivitas Terbaru
        </h2>
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>
    </>
  );
}

// --- Komponen Skeleton ---
const CategoryStatsSkeleton = () => (
  <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
    <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
      Statistik Generus
    </h3>
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-boxdark-2"></div>
      <div className="h-28 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-boxdark-2"></div>
    </div>
  </div>
);

const ActivitySkeleton = () => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:gap-7.5">
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Aktivitas...
      </h3>
      <div className="h-20 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2 mb-4"></div>
    </div>
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Aktivitas...
      </h3>
      <div className="h-20 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2 mb-4"></div>
    </div>
  </div>
);