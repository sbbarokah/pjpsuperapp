"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

// Import komponen-komponen bagian laporan
import { VillageCensusTable } from "./cencus_table";
import { VillageAttendanceTable } from "./attendance_table";
import { VillageDescriptiveSection } from "./descriptive_section";
import { VillageDetailContext } from "@/lib/types/report.types";
import { Calendar, Eye, EyeOff, Minimize2, MinusSquare, Printer, Sliders, Tag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface VillagePrintViewProps {
  context: VillageDetailContext;
  monthName: string;
  year: number;
}

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

  const [isRingkasCR, setIsRingkasCR] = useState(false);

  // --- STATE CATATAN PJP DESA ---
  const [catatanPJP, setCatatanPJP] = useState("");

  // --- STATE KONTROL VISIBILITAS KELOMPOK (MENGGUNAKAN SET<NUMBER>) ---
  const [visibleGroupIds, setVisibleGroupIds] = useState<Set<number>>(() => {
    return new Set(context.groups.map(g => Number(g.id)));
  });

  // --- STATE KONTROL VISIBILITAS KATEGORI / KELAS (MENGGUNAKAN SET<NUMBER>) ---
  const [visibleCategoryIds, setVisibleCategoryIds] = useState<Set<number>>(() => {
    return new Set(context.categories.map(c => Number(c.id)));
  });

  const [emptySections, setEmptySections] = useState({
    census: false,
    attendance: false,
    materials: false,
    achievement: false,
    challenges: false,
    solutions: false,
    success: false,
  });

  const toggleEmptyMode = (key: keyof typeof emptySections) => {
    setEmptySections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle Seksi Laporan
  const toggleSection = (key: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle Kelompok Individual (Set-based toggle)
  const toggleGroup = (groupId: number) => {
    setVisibleGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Toggle Kategori/Kelas Individual (Set-based toggle)
  const toggleCategory = (categoryId: number) => {
    setVisibleCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
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

  // Set Semua Kategori Aktif
  const handleSelectAllCategories = () => {
    setVisibleCategoryIds(new Set(context.categories.map(c => Number(c.id))));
  };

  // Sembunyikan Semua Kategori
  const handleDeselectAllCategories = () => {
    setVisibleCategoryIds(new Set());
  };

  const handlePrintWeb = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Laporan KBM Desa ${context.villageName} - ${monthName} ${year}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 5mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }

        /* Simulasi Scale 85% */
        #print-content-wrapper {
          transform: scale(0.85);
          transform-origin: top left;
          width: 117.6%; /* 100 / 0.85 = 117.6, untuk menutupi sisa ruang */
        }
      }
    `,
  });

  // 2. Fungsi Interseptor untuk Mendeteksi Flutter Mobile App
  const handlePrintAction = () => {
    if (typeof window !== "undefined" && (window as any).FlutterChannel) {
      // Ambil HTML mentah dari konten laporan
      const printHtml = contentRef.current?.innerHTML || "";
      const docTitle = `Laporan KBM Desa ${context.villageName} - ${monthName} ${year}`;

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

  const sectionConfig = [
    { key: 'census', label: '1. Sensus Generus', comp: VillageCensusTable },
    { key: 'attendance', label: '2. Rata-Rata Kehadiran', comp: VillageAttendanceTable },
    { key: 'materials', label: '3. Evaluasi Materi', comp: VillageDescriptiveSection, type: 'MATERIALS' },
    { key: 'achievement', label: '4. Keberhasilan Program', comp: VillageDescriptiveSection, type: 'ACHIEVEMENT' },
    { key: 'challenges', label: '5. Tantangan / Kendala', comp: VillageDescriptiveSection, type: 'CHALLENGES' },
    { key: 'solutions', label: '6. Solusi / Usulan', comp: VillageDescriptiveSection, type: 'SOLUTIONS' },
    { key: 'success', label: '7. Catatan Sukses', comp: VillageDescriptiveSection, type: 'SUCCESS' },
  ];

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
              <p className="text-xs text-gray-500 mt-1">Sesuaikan elemen bab, kelompok, dan kategori kelas yang ingin ditampilkan pada dokumen laporan / PDF.</p>
            </div>
          </div>
          
          <button
            onClick={handlePrintAction}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-center font-black text-xs uppercase tracking-wider text-white hover:bg-opacity-90 shadow-lg shadow-red-600/20 transition active:scale-95 self-start sm:self-center"
          >
            <Printer size={16} /> Cetak / Download PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kolom 1: Visibilitas Bab Laporan */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Kontrol Bab Laporan</span>
              <div className="grid grid-cols-1 gap-2">
                {sectionConfig.map((sec) => (
                  <div key={sec.key} className="flex items-center justify-between p-3 rounded-xl border border-stroke bg-gray-50 dark:bg-meta-4">
                    <span className="text-xs font-bold">{sec.label}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => toggleSection(sec.key as any)} className={cn("p-1.5 rounded-lg", visibleSections[sec.key as keyof typeof visibleSections] ? "bg-primary text-white" : "bg-gray-200 text-gray-500")}>
                        {visibleSections[sec.key as keyof typeof visibleSections] ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button type="button" onClick={() => toggleEmptyMode(sec.key as any)} className={cn("p-1.5 rounded-lg", emptySections[sec.key as keyof typeof emptySections] ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500")}>
                        <MinusSquare size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOGGLE BARU: RINGKAS CABE RAWIT */}
            <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2 flex items-center gap-1.5">
                  <Minimize2 size={12} /> Opsi Tabel Angka
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl border border-stroke bg-blue-50 dark:bg-boxdark dark:border-slate-700">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-100">Ringkas Kelas Cabe Rawit (0-6)</span>
                <button
                  type="button"
                  onClick={() => setIsRingkasCR(!isRingkasCR)}
                  className={cn("px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all", isRingkasCR ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-gray-200 text-gray-500 dark:bg-meta-4 dark:text-gray-400")}
                >
                  {isRingkasCR ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            </div>
          </div>

          {/* Kolom 2: Pemilihan Sektor Kelompok */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-stroke dark:border-slate-750 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-[10px] font-black uppercase text-gray-455 tracking-widest flex items-center gap-1.5">
                <Users size={14} /> Sektor Kelompok Aktif
              </span>
              <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                <button type="button" onClick={handleSelectAllGroups} className="text-primary hover:underline">Pilih Semua</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={handleDeselectAllGroups} className="text-red-500 hover:underline">Sembunyikan</button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {context.groups.map((group) => {
                const isSelected = visibleGroupIds.has(Number(group.id));
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(Number(group.id))}
                    className={cn(
                      "p-3 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-between",
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-900 dark:border-white"
                        : "bg-white border-stroke text-gray-500 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-200"
                    )}
                  >
                    <span className="truncate">{group.name}</span>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isSelected ? "bg-green-400" : "bg-gray-300"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolom 3: Pemilihan Kategori / Kelas (Tingkat) */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-stroke dark:border-slate-750 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-[10px] font-black uppercase text-gray-455 tracking-widest flex items-center gap-1.5">
                <Tag size={14} /> Kategori / Kelas Aktif
              </span>
              <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                <button type="button" onClick={handleSelectAllCategories} className="text-primary hover:underline">Pilih Semua</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={handleDeselectAllCategories} className="text-red-500 hover:underline">Sembunyikan</button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {context.categories.map((cat) => {
                const isSelected = visibleCategoryIds.has(Number(cat.id));
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(Number(cat.id))}
                    className={cn(
                      "p-3 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-between",
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-stroke text-gray-500 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-200"
                    )}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isSelected ? "bg-blue-300" : "bg-gray-300"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FIELD CATATAN PJP DESA (Baru) */}
        <div className="border-t border-stroke dark:border-strokedark pt-6 mt-2">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">
            Catatan PJP Desa
          </span>
          <textarea
            value={catatanPJP}
            onChange={(e) => setCatatanPJP(e.target.value)}
            placeholder="Tulis catatan atau pesan tambahan untuk dicantumkan dalam laporan cetak..."
            className="w-full rounded-xl border border-stroke bg-gray-50 p-4 text-sm font-medium text-black dark:bg-meta-4 dark:text-white dark:border-slate-700 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none"
            rows={4}
          />
        </div>

      </div>

      {/* ====================================================================
          AREA KERTAS CETAK LAPORAN (SINKRON KE PDF / PRINT)
          ==================================================================== */}
      <div ref={contentRef} id="print-content-wrapper" className="bg-white rounded-[2rem] p-10 print:p-0 w-full text-black">

        <div className="print:block print:w-full print:text-black">

          <div className="mb-10 text-center border-b-4 border-double border-black pb-6 print:border-black">
             <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                Laporan Dokumen Resmi
             </div>
             <h1 className="text-3xl font-black text-black uppercase mb-3 tracking-tight">
                Laporan Kegiatan Belajar Mengajar
             </h1>
             <div className="flex items-center justify-center gap-4 text-sm font-bold text-gray-700">
                <span className="flex items-center gap-1.5 uppercase">
                   <Calendar size={14} /> {monthName} {year}
                </span>
                <span className="text-gray-300">|</span>
                <span className="uppercase">
                   Desa Cicalengka
                </span>
             </div>
          </div>
          
          {/* Section Laporan */}
          <div className="flex flex-col gap-12">
            {sectionConfig.map((section: any) => {
               if (!visibleSections[section.key as keyof typeof visibleSections]) return null;
               
               const Component = section.comp;
               const isEmpty = emptySections[section.key as keyof typeof emptySections];

               return (
                 <section key={section.key} className="break-inside-avoid space-y-4">
                   <h3 className="text-lg font-black uppercase border-l-4 border-black pl-3">{section.label}</h3>
                   {isEmpty ? (
                     <div className="border border-stroke rounded-xl p-8 text-center text-gray-500 text-sm font-bold">-</div>
                   ) : (
                     <Component 
                        context={context} 
                        visibleGroupIds={visibleGroupIds} 
                        visibleCategoryIds={visibleCategoryIds}
                        isRingkasCR={isRingkasCR}
                        // Jika komponen deskriptif, tambahkan prop type
                        {...(section.type ? { type: section.type } : {})}
                     />
                   )}
                 </section>
               );
            })}
          </div>

          {/* CATATAN PJP DESA (Muncul di cetak) */}
          {catatanPJP.trim() && (
            <div className="mt-12 break-inside-avoid">
              <h3 className="text-lg font-black uppercase border-l-4 border-black pl-3 mb-3">
                Catatan PJP Desa
              </h3>
              <div className="border border-stroke rounded-xl p-5 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {catatanPJP}
              </div>
            </div>
          )}

          {/* Footer Dokumen Cetak */}
          <div className="hidden print:flex justify-between items-end mt-16 pt-6 border-t border-black text-xs font-bold">
             <span>Dicetak pada: {new Date().toLocaleDateString('id-ID')}</span>
             <span>PJP Super App</span>
          </div>

        </div>
      </div>
    </div>
  );
}