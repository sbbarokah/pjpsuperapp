import { DataCard } from "@/components/cards/datacard";
import { formatReportDate } from "@/lib/utils"; // Asumsi path helper benar
import { getMeetingReportsList } from "@/lib/services/mReportService";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";

// --- Komponen Card ---
// (Ini adalah card yang sama dari file asli Anda)
function MeetingReportCard({ report }: { report: MeetingReportWithRelations }) {
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

// --- Komponen Data Asinkron ---
export async function MuslimunGroupList({ profile }: { profile: any }) {
  // Ambil data HANYA untuk kelompoknya
  const reports = await getMeetingReportsList({
    villageId: profile.village_id,
    groupId: profile.group_id, // Ini memastikan hanya data grupnya yg diambil
  });

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Laporan
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Belum ada Laporan Muslimun yang dibuat untuk kelompok Anda.
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