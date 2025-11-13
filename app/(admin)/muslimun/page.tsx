import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { Suspense } from "react";
import Link from "next/link";

// Asumsi komponen UI ini di-import
import { formatReportDate } from "@/lib/utils"; // Asumsi ada helper format tanggal
import { DataCard } from "@/components/cards/datacard";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { getMeetingReportsList } from "@/lib/services/mReportService";
import { MuslimunGroupList } from "./_components/group_report_list";
import { MuslimunVillageList } from "./_components/village_report_list";

export const metadata = {
  title: "Laporan Muslimun | Admin",
};

// --- Komponen Card ---
function MeetingReportCard({ report }: { report: MeetingReportWithRelations }) {
  // [PERUBAHAN] Tautan sekarang mengarah ke halaman detail konsolidasi
  // berdasarkan tahun dan bulan laporan, bukan ke halaman edit.
  const href = `/muslimun/detail/${report.period_year}/${report.period_month}`;
  
  return (
    <DataCard href={href}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-black dark:text-white truncate">
          {report.group.name}
        </h3>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tanggal: {formatReportDate(report.muroh_date)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Periode: {report.period_month}/{report.period_year}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Dibuat pada: {formatReportDate(report.created_at)}
        </p>
      </div>
    </DataCard>
  );
}

// --- Skeleton ---
function CardListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 w-full rounded-lg bg-gray-100 dark:bg-boxdark-2 animate-pulse"></div>
      ))}
    </div>
  );
}

// --- Komponen Data Asinkron ---
async function ReportList({ profile }: { profile: any }) {
  // Ambil data berdasarkan role
  const reports = await getMeetingReportsList({
    villageId: profile.village_id,
    groupId: profile.role === "admin_kelompok" ? profile.group_id : undefined,
  });

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Laporan
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Belum ada Laporan Muslimun yang dibuat untuk kelompok ini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reports.map((report) => (
        <MeetingReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

// --- Halaman Utama ---
export default async function MeetingReportsPage() {
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

  // Hanya admin desa & kelompok yg bisa lihat
  const canAccess = profile.role === "admin_desa" || profile.role === "admin_kelompok";
  if (!canAccess) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Peran Anda ({profile.role}) tidak memiliki akses ke halaman ini.</p>
      </>
    );
  }

  // Tentukan komponen yang akan ditampilkan
  let ReportViewComponent = null;
  if (profile.role === "admin_kelompok") {
    ReportViewComponent = <MuslimunGroupList profile={profile} />;
  } else if (profile.role === "admin_desa") {
    ReportViewComponent = <MuslimunVillageList profile={profile} />;
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <Breadcrumb pageName="Laporan Muslimun" />
        <Link
          href="/muslimun/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-6"
        >
          Buat Laporan Baru
        </Link>
      </div>

      <div className="space-y-10">
        <Suspense fallback={<CardListSkeleton />}>
          {ReportViewComponent ? (
            ReportViewComponent
          ) : (
            // Pesan jika peran tidak sesuai
            <p>
              Peran Anda ({profile.role}) tidak memiliki akses untuk melihat
              laporan ini.
            </p>
          )}
        </Suspense>
      </div>
    </>
  );
}