import { AggregatedPeriod } from "@/lib/services/reportService";
import { getMonthName } from "@/lib/utils";
import { DataCard } from "./datacard";

type KbmPeriodCardProps = {
  period: AggregatedPeriod;
};

export function KbmPeriodCard({ period }: KbmPeriodCardProps) {
  // Link ke halaman detail (yang akan Anda buat nanti)
  const href = `/kbmreport/detail/${period.period_year}/${period.period_month}`;
  
  const monthName = getMonthName(period.period_month);

  return (
    <DataCard href={href}>
      <div className="flex flex-col gap-1 text-center">
        {/*  */}
        <h3 className="text-xl font-semibold text-black dark:text-white truncate">
          {/* Tampilkan Nama Bulan */}
          {monthName}
        </h3>
        <p className="text-base text-gray-600 dark:text-gray-300">
          {/* Tampilkan Tahun */}
          {period.period_year}
        </p>
      </div>
    </DataCard>
  );
}