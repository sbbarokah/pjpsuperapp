import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { Suspense } from "react";
import Link from "next/link";
import { getAvailableReportPeriods } from "@/lib/services/reportService";
import { KbmPeriodCard } from "@/components/cards/kbmPeriodCard"; // Pastikan path ini benar

export const metadata = {
  title: "Laporan KBM | Admin",
};

function CardListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 w-full rounded-lg bg-gray-100 dark:bg-boxdark-2 animate-pulse"></div>
      ))}
    </div>
  );
}

/**
 * Komponen Server untuk menampilkan list
 */
async function ReportPeriodList({ profile }: { profile: any }) {
  const villageId = Number(profile.village_id);
  // Jika admin kelompok, kita kirim groupId agar list hanya menampilkan bulan dimana kelompoknya aktif
  const groupId = profile.role === 'admin_kelompok' ? Number(profile.group_id) : undefined;

  if (!villageId) return <div className="text-red-500">Data profil tidak lengkap (Desa hilang).</div>;

  // [PANGGIL FUNGSI BARU]
  const periods = await getAvailableReportPeriods(villageId, groupId);

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Data Laporan
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          Belum ada aktivitas presensi, penilaian, atau laporan manual yang tercatat.
        </p>
        {/* Tombol Call to Action */}
        <Link
            href="/kbmreport/new" // Atau arahkan ke /admin/presensi/create jika ingin mendorong presensi dulu
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
          >
            Mulai Buat Laporan
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {periods.map((period) => (
        <KbmPeriodCard
          key={`${period.period_year}-${period.period_month}`}
          period={period}
          // Kita bisa pass role jika Card butuh logic href yang berbeda
          // userRole={profile.role} 
        />
      ))}
    </div>
  );
}

export default async function KbmReportsPage() {
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error: any) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Anda harus login untuk mengakses halaman ini.</p>
      </>
    );
  }
  
  const canAccess = profile.role === "admin_kelompok" || profile.role === "admin_desa";
  if (!canAccess) {
      return <p>Akses Ditolak</p>;
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Breadcrumb pageName="Laporan KBM" />
        
        <Link
          href="/kbmreport/new" // Pastikan ini mengarah ke Form Manual (jika itu yang diinginkan)
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-6"
        >
          + Input Manual
        </Link>
      </div>
      
      <div className="space-y-10">
        <Suspense fallback={<CardListSkeleton />}>
           <ReportPeriodList profile={profile} />
        </Suspense>
      </div>
    </>
  );
}