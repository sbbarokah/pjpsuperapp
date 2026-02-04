import { formatReportDate } from "@/lib/utils";
import { getMeetingReportsList } from "@/lib/services/mReportService";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { Profile } from "@/lib/types/user.types";
import Link from "next/link";
import { FaEdit, FaCalendarAlt, FaChevronRight } from "react-icons/fa";

// --- Komponen Card (Dimodifikasi) ---
function MeetingReportCard({ report }: { report: MeetingReportWithRelations }) {
  const detailHref = `/muslimun/detail/${report.period_year}/${report.period_month}`;
  const editHref = `/muslimun/edit/${report.id}`;
  
  return (
    <div className="group relative flex flex-col justify-between rounded-lg border border-stroke bg-white p-5 shadow-default transition hover:border-primary dark:border-strokedark dark:bg-boxdark dark:hover:border-primary">
      {/* Area Klik Utama ke Detail */}
      <Link href={detailHref} className="block flex-grow">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
           <FaCalendarAlt size={18} />
        </div>
        <h3 className="text-xl font-bold text-black dark:text-white truncate">
          {report.group.name}
        </h3>
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tanggal: {formatReportDate(report.muroh_date)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Periode: {report.period_month}/{report.period_year}
          </p>
        </div>
      </Link>

      {/* Footer Aksi: Edit & Detail */}
      <div className="mt-4 flex items-center justify-between border-t border-stroke pt-4 dark:border-strokedark">
        <Link 
          href={detailHref}
          className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-black dark:hover:text-white transition"
        >
          Detail <FaChevronRight className="text-xs" />
        </Link>
        
        <Link 
          href={editHref}
          className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-white transition"
        >
          <FaEdit /> Edit
        </Link>
      </div>
    </div>
  );
}

// --- Komponen Data Asinkron ---
export async function MuslimunGroupList({ profile }: { profile: Profile }) {
  // Ambil data HANYA untuk kelompoknya
  const reports = await getMeetingReportsList({
    villageId: Number(profile.village_id),
    groupId: Number(profile.group_id), 
  });

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Laporan
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          Belum ada Laporan Musyawarah 5 Unsur yang dibuat untuk kelompok Anda.
        </p>
        <Link
          href="/muslimun/create"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
        >
          Buat Laporan Baru
        </Link>
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