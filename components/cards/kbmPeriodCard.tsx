import Link from "next/link";
import { AggregatedPeriod } from "@/lib/services/reportService";
import { monthOptions } from "@/lib/constants";
import { FaCalendarAlt, FaChevronRight } from "react-icons/fa";

export function KbmPeriodCard({ period }: { period: AggregatedPeriod }) {
  // Helper nama bulan
  const monthName = monthOptions.find(m => Number(m.value) === period.period_month)?.label || period.period_month;
  
  // [PENTING] Link mengarah ke halaman Detail Konsolidasi
  // Halaman ini akan menampilkan status kelengkapan (Presensi, Penilaian, Laporan)
  const href = `/kbmreport/detail/${period.period_year}/${period.period_month}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-lg border border-stroke bg-white p-5 shadow-default transition hover:border-primary dark:border-strokedark dark:bg-boxdark dark:hover:border-primary"
    >
      <div>
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
           <FaCalendarAlt size={18} />
        </div>
        <h4 className="text-xl font-bold text-black dark:text-white">
          {monthName}
        </h4>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Tahun {period.period_year}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
        <span className="text-sm font-medium text-primary">Lihat Detail</span>
        <FaChevronRight className="text-primary transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}