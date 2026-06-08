"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FaCheckCircle, FaTimesCircle, FaPrint } from "react-icons/fa";

interface MuslimunRecapTableProps {
  reports: MeetingReportWithRelations[];
  groups: { id: number; name: string }[];
}

export function MuslimunRecapTable({ reports, groups }: MuslimunRecapTableProps) {
  // 1. Buat referensi untuk elemen yang akan dicetak
  const componentRef = useRef<HTMLDivElement>(null);

  // 2. Setup fungsi handlePrint
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Rekap_Musyawarah_5_Unsur_${format(new Date(), "yyyy-MM-dd")}`,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Tombol Aksi Cetak - Disembunyikan saat proses cetak berlangsung */}
      <div className="flex justify-end print:hidden">
        <button
          onClick={() => handlePrint()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition"
        >
          <FaPrint />
          Cetak Laporan
        </button>
      </div>

      {/* Area yang akan dicetak (di-bind menggunakan componentRef) */}
      <div 
        ref={componentRef} 
        className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark print:border-0 print:shadow-none print:p-0 text-black"
      >
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white print:text-black">
          Rekap Pelaksanaan Musyawarah 5 Unsur
        </h3>
        
        {/* --- TABEL UTAMA REKAP --- */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm print:text-xs">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4 print:bg-gray-100">
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold min-w-[150px]">Kelompok</th>
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold text-center">Status</th>
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold min-w-[120px]">Tanggal & Tempat</th>
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold">Keimaman</th>
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold">Pengurus</th>
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold">Pakar Pendidik</th>
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold">Mubaligh</th>
                <th className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-bold">Orang Tua</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const report = reports.find(r => r.group_id === group.id);

                return (
                  <tr key={group.id} className="print:break-inside-avoid">
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 font-medium">
                      {group.name}
                    </td>
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300 text-center">
                      {report ? (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs print:text-green-700 print:bg-transparent print:p-0">
                          <FaCheckCircle className="print:hidden" /> Terlaksana
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs print:text-red-700 print:bg-transparent print:p-0">
                          <FaTimesCircle className="print:hidden" /> Belum
                        </span>
                      )}
                    </td>
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300">
                      {report ? (
                        <>
                          <div className="font-bold">{format(new Date(report.muroh_date), "d MMM yyyy", { locale: id })}</div>
                          <div className="text-xs text-gray-500 print:text-gray-700">{report.muroh_place || "-"}</div>
                        </>
                      ) : "-"}
                    </td>
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300">{report?.element_ki || "-"}</td>
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300">{report?.element_management || "-"}</td>
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300">{report?.element_expert || "-"}</td>
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300">{report?.element_mubaligh || "-"}</td>
                    <td className="p-3 border border-stroke dark:border-strokedark print:border-gray-300">{report?.element_parent || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- BAGIAN RANGKAIAN ACARA --- */}
        <div className="mt-8 flex flex-col gap-4 print:break-inside-avoid">
           <h4 className="font-semibold text-black dark:text-white print:text-black">Rangkaian Acara:</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
              {reports.filter(r => r.rundown).map(r => (
                  <div key={r.id} className="p-4 border border-stroke rounded bg-gray-50 dark:bg-meta-4 dark:border-strokedark print:bg-transparent print:border-gray-300 print:mb-2">
                      <span className="text-xs font-bold text-primary mb-1 block print:text-black">{r.group?.name}</span>
                      <p className="text-sm text-black dark:text-white print:text-black whitespace-pre-wrap leading-relaxed">
                        {r.rundown}
                      </p>
                  </div>
              ))}
           </div>
        </div>
        
        {/* --- BAGIAN NOTULEN PENTING --- */}
        <div className="mt-8 flex flex-col gap-4 print:break-inside-avoid">
           <h4 className="font-semibold text-black dark:text-white print:text-black">Catatan / Notulen Penting:</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
              {reports.filter(r => r.muroh_notes).map(r => (
                  <div key={r.id} className="p-4 border border-stroke rounded bg-gray-50 dark:bg-meta-4 dark:border-strokedark print:bg-transparent print:border-gray-300 print:mb-2">
                      <span className="text-xs font-bold text-primary mb-1 block print:text-black">{r.group?.name}</span>
                      <p className="text-sm text-black dark:text-white print:text-black whitespace-pre-wrap leading-relaxed">
                        {r.muroh_notes}
                      </p>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}