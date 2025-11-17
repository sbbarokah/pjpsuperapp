import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getAttendanceRecapList } from "@/lib/services/attendanceService";
import { Suspense } from "react";
import Link from "next/link";
import { Profile } from "@/lib/types/user.types";
import { RecapListClient } from "./_components/recap_list_client";

export const metadata = {
  title: "Rekap Presensi | Admin",
};

const ListSkeleton = () => (
  <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="h-40 w-full animate-pulse rounded bg-gray-100 dark:bg-boxdark-2"></div>
  </div>
);

async function RecapList({ profile }: { profile: Profile }) {
  const recaps = await getAttendanceRecapList({
    villageId: profile.village_id as number,
    groupId: profile.role === 'admin_kelompok' ? (profile.group_id as number) : undefined,
  });
  
  return <RecapListClient recaps={recaps} profile={profile} />;
}

export default async function AttendanceRecapPage() {
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error: any) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }
  
  const canAccess = (profile.role === 'admin_desa' || profile.role === 'admin_kelompok');
  if (!canAccess || !profile.village_id) {
     return (
       <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Hanya Admin Desa atau Admin Kelompok yang dapat mengakses halaman ini.</p>
       </>
     );
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Breadcrumb pageName="Rekap Presensi KBM" />
        <Link
          href="/kbmattendance/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-6"
        >
          Buat Rekap Baru
        </Link>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <RecapList profile={profile} />
      </Suspense>
    </>
  );
}