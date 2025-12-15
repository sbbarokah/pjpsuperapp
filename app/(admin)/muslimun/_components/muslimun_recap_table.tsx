"use client";

import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface MuslimunRecapTableProps {
  reports: MeetingReportWithRelations[];
  groups: { id: number; name: string }[]; // List semua grup untuk cek kelengkapan
}

export function MuslimunRecapTable({ reports, groups }: MuslimunRecapTableProps) {
  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Rekap Pelaksanaan Musyawarah 5 Unsur
      </h3>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="p-3 border border-stroke dark:border-strokedark font-bold min-w-[150px]">Kelompok</th>
              <th className="p-3 border border-stroke dark:border-strokedark font-bold text-center">Status</th>
              <th className="p-3 border border-stroke dark:border-strokedark font-bold min-w-[120px]">Tanggal & Tempat</th>
              <th className="p-3 border border-stroke dark:border-strokedark font-bold">Keimaman</th>
              <th className="p-3 border border-stroke dark:border-strokedark font-bold">Pengurus</th>
              <th className="p-3 border border-stroke dark:border-strokedark font-bold">Pakar Pendidik</th>
              <th className="p-3 border border-stroke dark:border-strokedark font-bold">Mubaligh</th>
              <th className="p-3 border border-stroke dark:border-strokedark font-bold">Orang Tua</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              // Cari laporan untuk grup ini
              const report = reports.find(r => r.group_id === group.id);

              return (
                <tr key={group.id}>
                  <td className="p-3 border border-stroke dark:border-strokedark font-medium">
                    {group.name}
                  </td>
                  <td className="p-3 border border-stroke dark:border-strokedark text-center">
                    {report ? (
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                        <FaCheckCircle /> Terlaksana
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                        <FaTimesCircle /> Belum
                      </span>
                    )}
                  </td>
                  <td className="p-3 border border-stroke dark:border-strokedark">
                    {report ? (
                      <>
                        <div className="font-bold">{format(new Date(report.muroh_date), "d MMM yyyy", { locale: id })}</div>
                        <div className="text-xs text-gray-500">{report.muroh_place || "-"}</div>
                      </>
                    ) : "-"}
                  </td>
                  {/* 5 Unsur Columns */}
                  <td className="p-3 border border-stroke dark:border-strokedark">{report?.element_ki || "-"}</td>
                  <td className="p-3 border border-stroke dark:border-strokedark">{report?.element_management || "-"}</td>
                  <td className="p-3 border border-stroke dark:border-strokedark">{report?.element_expert || "-"}</td>
                  <td className="p-3 border border-stroke dark:border-strokedark">{report?.element_mubaligh || "-"}</td>
                  <td className="p-3 border border-stroke dark:border-strokedark">{report?.element_parent || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tampilkan Rundown jika ada */}
      <div className="mt-8 flex flex-col gap-4">
         <h4 className="font-semibold text-black dark:text-white">Rangkaian Acara:</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.filter(r => r.rundown).map(r => (
                <div key={r.id} className="p-4 border border-stroke rounded bg-gray-50 dark:bg-meta-4 dark:border-strokedark">
                    <span className="text-xs font-bold text-primary mb-1 block">{r.group.name}</span>
                    <p className="text-sm italic">"{r.rundown}"</p>
                </div>
            ))}
         </div>
      </div>
      
      {/* Tampilkan Notulen jika ada */}
      <div className="mt-8 flex flex-col gap-4">
         <h4 className="font-semibold text-black dark:text-white">Catatan / Notulen Penting:</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.filter(r => r.muroh_notes).map(r => (
                <div key={r.id} className="p-4 border border-stroke rounded bg-gray-50 dark:bg-meta-4 dark:border-strokedark">
                    <span className="text-xs font-bold text-primary mb-1 block">{r.group.name}</span>
                    <p className="text-sm italic">"{r.muroh_notes}"</p>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}