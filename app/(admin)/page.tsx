import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { Suspense } from "react";
import {
  getRecentAttendanceReports,
  getRecentEvaluationReports,
  getRecentKbmReports,
  getRecentMeetingReports,
} from "@/lib/services/dashboardService";
import { ActivityFeed } from "./dashboard/_components/activity_feed";
import { CategoryStatsGroup } from "./dashboard/_components/category_stats_card";

export const metadata = {
  title: "Dashboard | Admin",
};

/**
 * Komponen Server untuk mengambil Data Aktivitas
 */
async function RecentActivity() {
  // [PERUBAHAN] Ambil 3 data secara paralel
  const [attendance, evaluation, meeting] = await Promise.all([
    getRecentAttendanceReports(),
    getRecentEvaluationReports(),
    getRecentMeetingReports(),
  ]);

  return (
    <ActivityFeed 
      attendanceReports={attendance} 
      evaluationReports={evaluation} 
      meetingReports={meeting} 
    />
  );
}

// --- Halaman Utama ---
export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ view?: string }> 
}) {
  const awaitedParams = await searchParams; // Next.js 15 mewajibkan await params

  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error: any) {
    // ... handling error
  }

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

      <div className="mt-4 md:mt-6 2xl:mt-9">
        <Suspense fallback={<CategoryStatsSkeleton />}>
          <CategoryStatsGroup profile={profile} searchParams={awaitedParams} />
        </Suspense>
      </div>

      <div className="mt-6 md:mt-8 2xl:mt-10">
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