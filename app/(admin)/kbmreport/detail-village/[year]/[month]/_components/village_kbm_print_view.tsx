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

type SectionType = 'MATERIALS' | 'CHALLENGES' | 'SOLUTIONS' | 'SUCCESS' | 'ACHIEVEMENT';

export function VillageKBMPrintView({ context, monthName, year }: VillagePrintViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // --- STATE KONTROL VISIBILITAS SEKSI ---
  const [visibleSections, setVisibleSections] = useState({
    census: true,
    attendance: true,
    materials: true,
    achievement: true,
    challenges: true,
    solutions: true,
    success: true,
  });

  // --- STATE KONTROL VISIBILITAS KELOMPOK (COLUMN-LEVEL FILTERING) ---
  const [visibleGroupIds, setVisibleGroupIds] = useState<Set<number>>(() => {
    return new Set(context.groups.map(g => Number(g.id)));
  });

  // Toggle Seksi Laporan
  const toggleSection = (key: keyof typeof visibleSections) => {
    setVisibleSections((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle Kelompok Individual
  const toggleGroup = (groupId: number) => {
    setVisibleGroupIds((prev: any) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Set Semua Kelompok Aktif
  const handleSelectAllGroups = () => {
    setVisibleGroupIds(new Set(context.groups.map(g => Number(g.id))));
  };

  // Sembunyikan Semua Kelompok
  const handleDeselectAllGroups = () => {
    setVisibleGroupIds(new Set());
  };

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Laporan KBM Desa ${context.villageName} - ${monthName} ${year}`,
  });

  return (
    <div className="space-y-6">
      
      {/* ====================================================================
          PANEL KONTROL INTERAKTIF (DIS_EMBED SAAT PRINT: .print:hidden)
          ==================================================================== */}
      <div className="rounded-[2rem] border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark print:hidden no-print space-y-6">
        
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stroke dark:border-strokedark pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-black dark:text-white leading-tight">Konfigurator Kertas Cetak</h3>
              <p className="text-xs text-gray-500 mt-1">Sesuaikan elemen bab dan kelompok yang ingin ditampilkan pada dokumen laporan / PDF.</p>
            </div>
          </div>
          
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-center font-black text-xs uppercase tracking-wider text-white hover:bg-opacity-90 shadow-lg shadow-red-600/20 transition active:scale-95 self-start sm:self-center"
          >
            <Printer size={16} /> Cetak / Download PDF
          </button>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Kolom Kiri: Visibilitas Bab Laporan */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 mb-1">
              <Layers size={14} /> Visibilitas Bab Laporan
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: 'census', label: "1. Sensus Generus" },
                { key: 'attendance', label: "2. Rata-Rata Kehadiran" },
                { key: 'materials', label: "3. Evaluasi Materi" },
                { key: 'achievement', label: "4. Keberhasilan Program" },
                { key: 'challenges', label: "5. Tantangan / Kendala" },
                { key: 'solutions', label: "6. Solusi / Usulan" },
                { key: 'success', label: "7. Catatan Sukses" },
              ].map((sec) => {
                const isActive = visibleSections[sec.key as keyof typeof visibleSections];
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => toggleSection(sec.key as any)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border text-xs font-bold text-left transition-all active:scale-98",
                      isActive 
                        ? "bg-primary/5 border-primary text-primary" 
                        : "bg-gray-50 border-stroke text-gray-400 dark:bg-meta-4 dark:border-strokedark"
                    )}
                  >
                    <span>{sec.label}</span>
                    {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolom Kanan: Pemilihan Sektor Kelompok */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-stroke dark:border-strokedark pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                <Users size={14} /> Sektor Kelompok Aktif
              </span>
              <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                <button type="button" onClick={handleSelectAllGroups} className="text-primary hover:underline">Pilih Semua</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={handleDeselectAllGroups} className="text-red-500 hover:underline">Sembunyikan Semua</button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
              {context.groups.map((group) => {
                const isSelected = visibleGroupIds.has(Number(group.id));
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(Number(group.id))}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5",
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900 dark:border-white"
                        : "bg-white border-stroke text-gray-500 dark:bg-slate-800 dark:border-slate-700"
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-green-400" : "bg-gray-300"
                    )} />
                    {group.name}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ====================================================================
          AREA KERTAS CETAK LAPORAN (SINKRON KE PDF / PRINT)
          ==================================================================== */}
      {}
      <div className="bg-white rounded-[2rem] border border-stroke dark:border-strokedark p-10 md:p-14 shadow-default print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 w-full text-black">
        
        {/* Wrapper untuk memaksa background putih dan teks hitam pekat saat diprint */}
        <div className="print:bg-white print:text-black print:p-4">
          
          {/* Judul KOP Laporan */}
          <div className="mb-10 text-center border-b-4 border-double border-black pb-6">
            <h2 className="text-3xl font-black text-black uppercase mb-2">
              Laporan KBM Desa {context.villageName}
            </h2>
            <p className="text-lg text-gray-700 font-bold flex items-center justify-center gap-2">
              <Calendar size={18} className="print:text-black text-primary" />
              Bulan {monthName} Tahun {year}
            </p>
            <p className="text-xs font-black tracking-widest uppercase text-gray-400 mt-2 print:text-black">
              Lembaga Pendidikan PJP Desa {context.villageName}
            </p>
          </div>

          <div className="flex flex-col gap-12">
            
            {/* 1. SENSUS GENERUS */}
            {visibleSections.census && (
              <section className="break-inside-avoid space-y-4">
                <h3 className="text-lg font-black uppercase text-black border-l-4 border-black pl-3 tracking-tight">
                  1. Sensus Generus
                </h3>
                <VillageCensusTable context={context} visibleGroupIds={visibleGroupIds} />
              </section>
            )}

            {/* 2. KEHADIRAN KBM */}
            {visibleSections.attendance && (
              <section className="break-inside-avoid space-y-4">
                <h3 className="text-lg font-black uppercase text-black border-l-4 border-black pl-3 tracking-tight">
                  2. Rata-Rata Kehadiran (%)
                </h3>
                <VillageAttendanceTable context={context} visibleGroupIds={visibleGroupIds} />
              </section>
            )}

            {/* 3. EVALUASI MATERI */}
            {visibleSections.materials && (
              <section className="break-inside-avoid space-y-4">
                <h3 className="text-lg font-black uppercase text-black border-l-4 border-black pl-3 tracking-tight">
                  3. Evaluasi Materi Kurikulum
                </h3>
                <VillageDescriptiveSection context={context} type="MATERIALS" visibleGroupIds={visibleGroupIds} />
              </section>
            )}
            
            {/* 4. KEBERHASILAN PROGRAM */}
            {visibleSections.achievement && (
              <section className="break-inside-avoid space-y-4">
                <h3 className="text-lg font-black uppercase text-black border-l-4 border-black pl-3 tracking-tight">
                  4. Info Keberhasilan Program Generus
                </h3>
                <VillageDescriptiveSection context={context} type="ACHIEVEMENT" visibleGroupIds={visibleGroupIds} />
              </section>
            )}
            
            {/* 5. TANTANGAN / KENDALA */}
            {visibleSections.challenges && (
              <section className="break-inside-avoid space-y-4">
                <h3 className="text-lg font-black uppercase text-black border-l-4 border-black pl-3 tracking-tight">
                  5. Tantangan / Kendala
                </h3>
                <VillageDescriptiveSection context={context} type="CHALLENGES" visibleGroupIds={visibleGroupIds} />
              </section>
            )}

            {/* 6. SOLUSI / USULAN */}
            {visibleSections.solutions && (
              <section className="break-inside-avoid space-y-4">
                <h3 className="text-lg font-black uppercase text-black border-l-4 border-black pl-3 tracking-tight">
                  6. Solusi / Usulan
                </h3>
                <VillageDescriptiveSection context={context} type="SOLUTIONS" visibleGroupIds={visibleGroupIds} />
              </section>
            )}
            
            {/* 7. CATATAN SUKSES */}
            {visibleSections.success && (
              <section className="break-inside-avoid space-y-4">
                <h3 className="text-lg font-black uppercase text-black border-l-4 border-black pl-3 tracking-tight">
                  7. Catatan Sukses Lainnya
                </h3>
                <VillageDescriptiveSection context={context} type="SUCCESS" visibleGroupIds={visibleGroupIds} />
              </section>
            )}
          </div>

          {/* Footer Dokumen Cetak */}
          <div className="hidden print:flex justify-between items-end mt-16 pt-6 border-t border-black text-xs font-bold">
             <span>Dicetak pada: {new Date().toLocaleDateString('id-ID')} - Sistem Informasi KBM</span>
             <span>PJP Super App - Laporan Konsolidasi</span>
          </div>

        </div>
      </div>
    </div>
  );
}

function useState(arg0: { census: boolean; attendance: boolean; materials: boolean; achievement: boolean; challenges: boolean; solutions: boolean; success: boolean; }): [any, any] {
  throw new Error("Function not implemented.");
}
