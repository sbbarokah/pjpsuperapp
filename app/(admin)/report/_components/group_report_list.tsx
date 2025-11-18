import { KbmReportCard } from "@/components/cards/kbmReportCard";
import { getReportsForGroup } from "@/lib/services/reportService";
import { Profile } from "@/lib/types/user.types";
import Link from "next/link";


/**
 * Server Component untuk mengambil dan menampilkan
 * daftar laporan spesifik untuk 'admin_kelompok'.
 */
export async function GroupReportList({ profile }: { profile: Profile }) {
  const reports = await getReportsForGroup(profile);

  if (reports.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        Anda belum membuat laporan KBM.
        <Link
          href="/kbmreport/new" // Arahkan ke halaman 'Buat Laporan'
          className="text-primary ml-2 hover:underline"
        >
          Buat Laporan Baru
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reports.map((report) => (
        <KbmReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}