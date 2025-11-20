"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FaPrint, FaFilePdf } from "react-icons/fa";
import { KbmDetailContext } from "@/lib/types/report.types";
import { KbmCategorySection } from "@/app/(admin)/kbmreport/_components/kbm_category_section";

interface KbmReportPrintViewProps {
  context: KbmDetailContext;
  monthName: string;
  year: number;
}

export function GroupKbmReportPrintView({ context, monthName, year }: KbmReportPrintViewProps) {
  // 1. Buat referensi ke elemen yang ingin dicetak
  const contentRef = useRef<HTMLDivElement>(null);

  // 2. Hook untuk handle print
  const handlePrint = useReactToPrint({
    contentRef: contentRef, // Gunakan contentRef (versi terbaru react-to-print)
    documentTitle: `Laporan KBM - ${context.groupName} - ${monthName} ${year}`,
    // onBeforeGetContent: () => {
    //     // Opsional: Logika sebelum print (misal set loading state)
    // },
  });

  return (
    <>
      {/* --- Tombol Download PDF (Muncul di UI Web) --- */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => handlePrint()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition"
        >
          <FaFilePdf />
          Download PDF / Cetak
        </button>
      </div>

      {/* --- Area Konten Laporan (Akan dicetak) --- */}
      <div ref={contentRef}>
        {/* Wrapper ini untuk memastikan styling cetak (background putih, text hitam) */}
        <div className="print:p-8 print:bg-white print:text-black">
            
          {/* Header Laporan (Khusus Tampilan Cetak/Web) */}
          <div className="mb-6 rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark print:shadow-none print:border-none print:p-0">
            <h2 className="text-2xl font-bold text-black dark:text-white print:text-black">
              Laporan Kegiatan Belajar Mengajar
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 print:text-gray-600">
              Periode: <span className="font-medium text-primary print:text-black">{monthName} {year}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2 print:text-gray-600">
              Kelompok: <span className="font-semibold text-black dark:text-white print:text-black">{context.groupName}</span>
            </p>
          </div>

          {/* List Data */}
          <div className="flex flex-col gap-10">
            {context.data.map((item) => (
              <div key={item.category.id} className="break-inside-avoid"> 
                {/* 'break-inside-avoid' mencegah potongan halaman di tengah tabel */}
                <KbmCategorySection 
                  data={item} 
                  context={context}
                />
              </div>
            ))}
          </div>

          {/* Footer Cetak (Hanya muncul saat diprint) */}
          <div className="hidden print:block mt-12 text-center text-xs text-gray-500">
            Dicetak pada: {new Date().toLocaleDateString('id-ID')} - PJP Super App
          </div>
        </div>
      </div>
    </>
  );
}