"use client";

import { KbmReportWithRelations } from "@/lib/types/report.types";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale"; // Untuk format "X hari yang lalu"
import Link from "next/link";

interface ActivityFeedProps {
  meetingReports: MeetingReportWithRelations[];
  kbmReports: KbmReportWithRelations[];
}

// Helper untuk format waktu
const timeAgo = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: id,
    });
  } catch (error) {
    return dateString;
  }
};

export function ActivityFeed({ meetingReports, kbmReports }: ActivityFeedProps) {
  return (
    // [PERUBAHAN] Menggunakan grid 2 kolom di layar besar
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:gap-7.5">
      {/* Laporan Muslimun (Kolom 1) */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Aktivitas Laporan Muslimun
        </h3>
        {meetingReports.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada aktivitas.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {meetingReports.map((report) => (
              <li key={report.id} className="text-sm">
                <Link
                  href={`/muslimun/edit/${report.id}`}
                  className="hover:text-primary"
                >
                  <span className="font-medium text-black dark:text-white">
                    {report.group.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {" "}
                    membuat laporan periode {report.period_month}/{report.period_year}
                  </span>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {timeAgo(report.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Laporan KBM (Kolom 2) */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Aktivitas Laporan KBM
        </h3>
        {kbmReports.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada aktivitas.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {kbmReports.map((report) => (
              <li key={report.id} className="text-sm">
                <Link
                  href={`/kbmreport/edit/${report.id}`} // Asumsi path edit KBM
                  className="hover:text-primary"
                >
                  <span className="font-medium text-black dark:text-white">
                    {report.group.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {" "}
                    mengisi laporan KBM untuk{" "}
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {report.category.name}
                  </span>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {timeAgo(report.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}