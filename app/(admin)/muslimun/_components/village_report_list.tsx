import { DataCard } from "@/components/cards/datacard";
// Impor helper untuk mengubah angka bulan menjadi nama (misal: 11 -> "November")
// Anda mungkin perlu membuat helper ini jika belum ada.
import { getMonthName } from "@/lib/utils"; 
import { getConsolidatedMuslimunPeriods } from "@/lib/services/mReportService"; // <-- PERHATIKAN INI

type PeriodData = {
  period_year: number;
  period_month: number;
  count: number;
};

// --- Komponen Card untuk Periode ---
function PeriodCard({ period }: { period: PeriodData }) {
  // Link ke halaman detail untuk periode tersebut
  const href = `/muslimun/detail/${period.period_year}/${period.period_month}`;
  const monthName = getMonthName(period.period_month); // Gunakan helper Anda

  return (
    <DataCard href={href}>
      <div className="flex flex-col gap-1 p-2">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          {monthName} {period.period_year}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {period.count} Laporan Terkumpul
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Klik untuk melihat detail
        </p>
      </div>
    </DataCard>
  );
}

// --- Komponen Data Asinkron ---
export async function MuslimunVillageList({ profile }: { profile: any }) {
  // Panggil service function baru Anda
  const periods = await getConsolidatedMuslimunPeriods(profile.village_id);

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Laporan
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Belum ada Laporan Muslimun yang dibuat di desa ini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {periods.map((period) => (
        <PeriodCard
          key={`${period.period_year}-${period.period_month}`}
          period={period}
        />
      ))}
    </div>
  );
}