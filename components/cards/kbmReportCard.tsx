import { KbmReportWithRelations } from "@/lib/types/report.types";
import { DataCard } from "./datacard";
import { formatReportDate } from "@/lib/utils";

type KbmReportCardProps = {
  report: KbmReportWithRelations;
};

export function KbmReportCard({ report }: KbmReportCardProps) {
  const href = `/kbmreport/edit/${report.id}`;
  
  return (
    <DataCard href={href}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-black dark:text-white truncate">
          {/* Tampilkan Kategori Laporan */}
          {report.category?.name || "Tanpa Kategori"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {/* Tampilkan Tanggal Dibuat */}
          Dibuat pada: {formatReportDate(report.created_at)}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Periode: {report.period_month}/{report.period_year}
        </p>
      </div>
    </DataCard>
  );
}