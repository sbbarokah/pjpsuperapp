"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { KbmDetailContext } from "@/lib/types/report.types";
import { KbmCategorySection } from "@/app/(admin)/kbmreport/_components/kbm_category_section";
import { FileText, Play } from "lucide-react";
import Link from "next/link";

interface KbmReportPrintViewProps {
  context: KbmDetailContext;
  monthName: string;
  year: number;
  month: number;
  groupId: number;
}

export function GroupKbmReportPrintView({ context, monthName, year, month, groupId }: KbmReportPrintViewProps) {
  // 1. Buat referensi ke elemen yang ingin dicetak
  const contentRef = useRef<HTMLDivElement>(null);

  // 2. Hook untuk handle print
  const handlePrintWeb = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Laporan_KBM_${context.groupName.replace(/\s+/g, "_")}_${monthName}_${year}`,
    pageStyle: `
      @page { size: A4; margin: 5mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        #print-content-wrapper { transform: scale(0.85); transform-origin: top left; width: 117.6%; }
      }
    `,
  });

  // 2. Fungsi Interseptor untuk Mendeteksi Flutter Mobile App
  const handlePrintAction = () => {
    if (typeof window !== "undefined" && (window as any).FlutterChannel) {
      // Ambil HTML mentah dari konten laporan
      const printHtml = contentRef.current?.innerHTML || "";
      const docTitle = `Laporan_KBM_${context.groupName.replace(/\s+/g, "_")}_${monthName}_${year}`;

      // Tembakkan data ke Flutter Channel
      (window as any).FlutterChannel.postMessage(
        JSON.stringify({
          action: "trigger_print",
          htmlContent: printHtml,
          title: docTitle,
        })
      );
    } else {
      // Jika di browser desktop, jalankan normal
      handlePrintWeb();
    }
  };

  return (
    <>
      {/* --- Tombol Download PDF (Muncul di UI Web) --- */}
      <div className="mb-6 flex flex-wrap justify-end gap-3 print:hidden">
        <Link
          href={`/presentation/kbm/${year}/${month}/${groupId}`}
          target="_blank" // Opsional: Buka di tab baru agar halaman admin tetap terbuka
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-white"
        >
          <Play size={18} /> Mode Presentasi
        </Link>
        <button
          onClick={() => handlePrintAction()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-center font-medium text-white hover:bg-red-700 shadow-md transition"
        >
          <FileText size={18} /> Download PDF / Cetak
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