"use client";

import { KbmReportWithRelations } from "@/lib/types/report.types";
import { AttendanceRecapWithRelations } from "@/lib/types/attendance.types";
import { EvaluationRecapWithRelations } from "@/lib/types/evaluation.types";
import Link from "next/link";
import { FaClipboardCheck, FaListAlt, FaFileAlt } from "react-icons/fa";
// [PERUBAHAN] Menggunakan date-fns sesuai permintaan
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";

/**
 * Helper untuk format waktu relatif (misal: "2 jam yang lalu")
 * Menggunakan date-fns dengan locale Indonesia
 */
const timeAgo = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: id 
    });
  } catch (error) {
    return dateString;
  }
};

interface ActivityFeedProps {
  attendanceReports: AttendanceRecapWithRelations[];
  evaluationReports: EvaluationRecapWithRelations[];
  meetingReports: MeetingReportWithRelations[];
}

export function ActivityFeed({ 
  attendanceReports, 
  evaluationReports, 
  meetingReports 
}: ActivityFeedProps) {
  
  /**
   * Helper untuk merender daftar aktivitas berdasarkan tipe
   */
  const renderList = (items: any[], type: 'attendance' | 'evaluation' | 'muslimun') => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-gray-500 italic">Belum ada aktivitas.</p>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          let href = "";
          let actionText = "";
          
          // Tentukan rute dan teks label berdasarkan tipe aktivitas
          if (type === 'attendance') {
            href = `/kbmattendance/edit/${item.id}`;
            actionText = "input presensi";
          } else if (type === 'evaluation') {
            href = `/kbmevaluation/edit/${item.id}`;
            actionText = "input penilaian";
          } else {
            href = `/muslimun/edit/${item.id}`;
            actionText = "laporan Muslimun";
          }

          return (
            <li key={item.id} className="group border-b border-stroke pb-3 last:border-0 dark:border-strokedark">
              <Link href={href} className="block transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-black dark:text-white group-hover:text-primary transition-colors truncate">
                    {item.group?.name || "Kelompok"}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap ml-2 uppercase">
                    {item.category?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                   <span className="text-gray-500 dark:text-gray-400">
                     {actionText} {item.period_month}/{item.period_year}
                   </span>
                   <span className="text-gray-400 italic">
                     {timeAgo(item.created_at)}
                   </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 2xl:gap-7.5">

      {/* Laporan Muslimun (Kolom 1) */}
      <div className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stroke dark:border-strokedark">
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20">
             <FaFileAlt size={20} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-black dark:text-white">
               Muslimun
             </h3>
             <p className="text-xs text-gray-500">Terakhir diproses</p>
           </div>
        </div>
        {renderList(meetingReports, 'muslimun')}
      </div>
      
      {/* Kolom 1: Rekap Presensi */}
      <div className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stroke dark:border-strokedark">
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20">
             <FaClipboardCheck size={20} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-black dark:text-white">
               Presensi
             </h3>
             <p className="text-xs text-gray-500">Terakhir diinput</p>
           </div>
        </div>
        {renderList(attendanceReports, 'attendance')}
      </div>

      {/* Kolom 2: Rekap Penilaian */}
      <div className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stroke dark:border-strokedark">
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">
             <FaListAlt size={20} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-black dark:text-white">
               Penilaian
             </h3>
             <p className="text-xs text-gray-500">Terakhir diinput</p>
           </div>
        </div>
        {renderList(evaluationReports, 'evaluation')}
      </div>

    </div>
  );
}