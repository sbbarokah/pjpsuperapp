"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FaFilePdf, FaPrint } from "react-icons/fa";
import Breadcrumb from "@/components/ui/breadcrumb";

// Import komponen-komponen bagian laporan
import { VillageCensusTable } from "./cencus_table";
import { VillageAttendanceTable } from "./attendance_table";
import { VillageDescriptiveSection } from "./descriptive_section";
import { VillageDetailContext } from "@/lib/types/report.types";

interface VillagePrintViewProps {
  context: VillageDetailContext;
  monthName: string;
  year: number;
}

export function VillageKBMPrintView({ context, monthName, year }: VillagePrintViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Laporan KBM Desa ${context.villageName} - ${monthName} ${year}`,
  });

  return (
    <>
      {/* --- Header & Tombol Print (Hanya Tampil di Web) --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
        <Breadcrumb pageName={`Laporan Lengkap Desa ${context.villageName}`} showNav={false} />
        
        <button
          onClick={() => handlePrint()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition"
        >
          <FaFilePdf />
          Download PDF / Cetak
        </button>
      </div>

      {/* --- Area Konten yang Akan Dicetak --- */}
      <div ref={contentRef}>
        {/* Wrapper untuk styling cetak (Background Putih) */}
        <div className="print:bg-white print:text-black print:p-8">
          
          {/* Judul Laporan */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-black dark:text-white uppercase mb-2 print:text-black">
              Laporan KBM Desa {context.villageName}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 print:text-gray-600">
              Bulan {monthName} Tahun {year}
            </p>
          </div>

          <div className="flex flex-col gap-12">
            {/* 1. Sensus */}
            <section className="break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3 print:text-black print:border-black">
                1. Sensus Generus
              </h3>
              <VillageCensusTable context={context} />
            </section>

            {/* 2. Kehadiran */}
            <section className="break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3 print:text-black print:border-black">
                2. Rata-Rata Kehadiran (%)
              </h3>
              <VillageAttendanceTable context={context} />
            </section>

            {/* 3. Materi */}
            <section className="break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3 print:text-black print:border-black">
                3. Evaluasi Materi Kurikulum
              </h3>
              <VillageDescriptiveSection context={context} type="MATERIALS" />
            </section>
            
            {/* 4. Tantangan */}
            <section className="break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3 print:text-black print:border-black">
                4. Tantangan / Kendala
              </h3>
              <VillageDescriptiveSection context={context} type="CHALLENGES" />
            </section>

            {/* 5. Solusi */}
            <section className="break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3 print:text-black print:border-black">
                5. Solusi / Usulan
              </h3>
              <VillageDescriptiveSection context={context} type="SOLUTIONS" />
            </section>
            
            {/* 6. Keberhasilan */}
            <section className="break-inside-avoid">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3 print:text-black print:border-black">
                6. Catatan / Keberhasilan
              </h3>
              <VillageDescriptiveSection context={context} type="SUCCESS" />
            </section>
          </div>

          {/* Footer Cetak */}
          <div className="hidden print:block mt-12 text-center text-xs text-gray-500 border-t pt-4">
             Dicetak pada: {new Date().toLocaleDateString('id-ID')} - PJP Super App
          </div>

        </div>
      </div>
    </>
  );
}