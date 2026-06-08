"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, XCircle, Printer, Layout } from "lucide-react";

interface MuslimunRecapTableProps {
  reports: MeetingReportWithRelations[];
  groups: { id: number; name: string }[];
}

export function MuslimunRecapTable({ reports, groups }: MuslimunRecapTableProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  // State untuk memilih format tampilan (default: format 1)
  const [activeFormat, setActiveFormat] = useState<1 | 2>(1);

  // 1. Fungsi Cetak Asli Web (Tetap Dipertahankan)
  const handlePrintWeb = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Rekap_Musyawarah_5_Unsur_${format(new Date(), "yyyy-MM-dd")}`,
    pageStyle: `
      @page { size: A4; margin: 5mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        #print-content-wrapper { transform: scale(0.85); transform-origin: top left; width: 117.6%; }
      }
    `,
  });

  // 2. Fungsi Interseptor Khusus Mobile App
  const handlePrintAction = () => {
    if (typeof window !== "undefined" && (window as any).FlutterChannel) {
      // Mengambil seluruh HTML mentah dari area tabel rekap yang ingin dicetak
      const printHtml = componentRef.current?.innerHTML || "";
      
      // Kirim data HTML ke Flutter via Channel
      (window as any).FlutterChannel.postMessage(
        JSON.stringify({
          action: "trigger_print",
          htmlContent: printHtml,
          title: `Rekap_Musyawarah_5_Unsur_${format(new Date(), "yyyy-MM-dd")}`
        })
      );
    } else {
      // Jika dibuka di browser PC biasa, jalankan print web normal
      handlePrintWeb();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* ================= BAR AKSI (TOMBOL FORMAT & PRINT) ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-boxdark-2/50 p-4 rounded-lg border border-stroke dark:border-strokedark print:hidden">
        {/* Tombol Navigasi Pilih Format */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black dark:text-white mr-2 flex items-center gap-1.5">
            <Layout size={18} className="text-gray-500" />
            Format Dokumen:
          </span>
          <button
            type="button"
            onClick={() => setActiveFormat(1)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
              activeFormat === 1
                ? "bg-primary border-primary text-white shadow-sm"
                : "bg-white border-stroke text-body hover:bg-gray-100 dark:bg-boxdark dark:border-strokedark dark:text-white"
            }`}
          >
            Format 1 (Terpisah)
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat(2)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
              activeFormat === 2
                ? "bg-primary border-primary text-white shadow-sm"
                : "bg-white border-stroke text-body hover:bg-gray-100 dark:bg-boxdark dark:border-strokedark dark:text-white"
            }`}
          >
            Format 2 (Per Kelompok)
          </button>
        </div>

        {/* Tombol Cetak / Print */}
        <button
          type="button"
          onClick={() => handlePrintAction()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition-all"
        >
          <Printer size={18} />
          Cetak Laporan A4
        </button>
      </div>

      <div 
        ref={componentRef} 
        className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark print:border-0 print:shadow-none print:p-0 text-black"
      >
        {/* Judul Dokumen Saat Dicetak */}
        <h3 className="mb-6 text-xl font-bold text-black dark:text-white print:text-black print:text-center print:text-2xl print:mb-8">
          Rekap Pelaksanaan Musyawarah 5 Unsur
        </h3>
        
        {/* --- TABEL UTAMA REKAP (Selalu Muncul di Kedua Format) --- */}
        <div className="max-w-full overflow-x-auto print:overflow-visible">
          <table className="w-full table-auto border-collapse text-sm print:text-[10pt] print:w-full">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4 print:bg-gray-100">
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold min-w-[140px]">Kelompok</th>
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold text-center w-[100px]">Status</th>
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold min-w-[120px]">Tanggal & Tempat</th>
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold">Keimaman</th>
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold">Pengurus</th>
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold">Pakar Pendidik</th>
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold">Mubaligh</th>
                <th className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-bold">Orang Tua</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const report = reports.find(r => r.group_id === group.id);

                return (
                  <tr key={group.id} className="print:break-inside-avoid">
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 font-medium">
                      {group.name}
                    </td>
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400 text-center">
                      {report ? (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs print:text-green-700 print:bg-transparent print:p-0 print:font-semibold">
                          <CheckCircle2 size={14} className="print:hidden" /> Terlaksana
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs print:text-red-700 print:bg-transparent print:p-0 print:font-semibold">
                          <XCircle size={14} className="print:hidden" /> Belum
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400">
                      {report ? (
                        <>
                          <div className="font-bold">{format(new Date(report.muroh_date), "d MMM yyyy", { locale: id })}</div>
                          <div className="text-xs text-gray-500 print:text-gray-700">{report.muroh_place || "-"}</div>
                        </>
                      ) : "-"}
                    </td>
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400">{report?.element_ki || "-"}</td>
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400">{report?.element_management || "-"}</td>
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400">{report?.element_expert || "-"}</td>
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400">{report?.element_mubaligh || "-"}</td>
                    <td className="p-2.5 border border-stroke dark:border-strokedark print:border-gray-400">{report?.element_parent || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- KONDISIONAL RENDER BERDASARKAN SELEKSI FORMAT --- */}
        {activeFormat === 1 ? (
          /* ================= INTERFACE FORMAT 1 (TERPISAH) ================= */
          <div className="print:mt-6">
            {/* Bagian Rangkaian Acara */}
            <div className="mt-8 flex flex-col gap-4 print:break-inside-avoid">
               <h4 className="font-semibold text-lg text-black dark:text-white print:text-black print:border-b print:pb-1">
                 Rangkaian Acara:
               </h4>
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
            
            {/* Bagian Catatan */}
            <div className="mt-8 flex flex-col gap-4 print:break-inside-avoid">
               <h4 className="font-semibold text-lg text-black dark:text-white print:text-black print:border-b print:pb-1">
                 Catatan / Notulen Penting:
               </h4>
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
        ) : (
          /* ================= INTERFACE FORMAT 2 (PER KELOMPOK) ================= */
          <div className="mt-8 flex flex-col gap-5 print:mt-6">
            <h4 className="font-semibold text-lg text-black dark:text-white print:text-black border-b border-stroke pb-2 dark:border-strokedark print:border-gray-400">
              Detail Dokumen Hasil Musyawarah per Kelompok:
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
              {reports
                .filter((r) => r.rundown || r.muroh_notes)
                .map((r) => (
                  <div 
                    key={r.id} 
                    className="p-4 border border-stroke rounded-lg bg-gray-50 dark:bg-meta-4 dark:border-strokedark print:bg-transparent print:border-gray-300 print:break-inside-avoid print:mb-4"
                  >
                    {/* Header Kelompok */}
                    <div className="mb-3 border-b border-stroke pb-1.5 dark:border-strokedark print:border-gray-300">
                      <span className="text-sm font-bold text-primary print:text-black block">
                        {r.group?.name}
                      </span>
                      {r.muroh_place && (
                        <span className="text-xs text-gray-500 print:text-gray-700 block mt-0.5">
                          Tempat: {r.muroh_place}
                        </span>
                      )}
                    </div>

                    {/* Rundown */}
                    {r.rundown && (
                      <div className="mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 print:text-gray-600 block mb-0.5">
                          Rangkaian Acara
                        </span>
                        <p className="text-sm text-black dark:text-white print:text-black whitespace-pre-wrap leading-relaxed bg-white dark:bg-boxdark print:bg-transparent p-2.5 rounded border border-stroke dark:border-form-strokedark print:border-0 print:p-0">
                          {r.rundown}
                        </p>
                      </div>
                    )}

                    {/* Catatan / Notulen */}
                    {r.muroh_notes && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 print:text-gray-600 block mb-0.5">
                          Catatan / Notulen Penting
                        </span>
                        <p className="text-sm text-black dark:text-white print:text-black whitespace-pre-wrap leading-relaxed bg-white dark:bg-boxdark print:bg-transparent p-2.5 rounded border border-stroke dark:border-form-strokedark print:border-0 print:p-0">
                          {r.muroh_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}