import { KbmPeriodCard } from "@/components/cards/kbmPeriodCard";
import { getAggregatedReportsForVillage } from "@/lib/services/reportService";
import { Profile } from "@/lib/types/user.types";
import Link from "next/link";


/**
 * Server Component untuk mengambil dan menampilkan
 * daftar laporan teragregasi per bulan untuk 'admin_desa'.
 */
export async function VillageReportList({ profile }: { profile: Profile }) {
  const periods = await getAggregatedReportsForVillage(profile);

  if (periods.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        Belum ada laporan KBM yang terkumpul di desa Anda.
        <Link
          href="/report/new" // Arahkan ke halaman 'Buat Laporan'
          className="text-primary ml-2 hover:underline"
        >
          Buat Laporan Baru
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
        />
      ))}
    </div>
  );
}