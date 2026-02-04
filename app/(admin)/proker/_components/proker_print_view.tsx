"use client";

import React, { useRef, useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import Swal from "sweetalert2";
import { 
  ChevronLeft, 
  Printer, 
  MapPin, 
  Users, 
  LayoutDashboard, 
  Briefcase,
  Pencil,
  Trash2,
  Loader2,
  CalendarDays,
  Coins,
  Eye,
  EyeOff
} from "lucide-react";
import { deleteProkerAction } from "../actions";
import { BULAN } from "@/lib/constants";
import { TimelineStatus, WorkProgramModel } from "@/lib/types/proker.types";

const MINGGU_LIST = ["M1", "M2", "M3", "M4", "M5"];

const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { 
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
}).format(val);

interface ProkerPrintViewProps {
  year: number;
  orgName: string;
  activeLevel: string;
  groupedPrograms: Record<string, any[]>;
  monthlyRecap: { bulan: string; items: any[]; totalRab: number }[];
  canMutate: boolean;
  userRole: string;
}

export function ProkerPrintView({ 
  year, 
  orgName, 
  activeLevel, 
  groupedPrograms, 
  monthlyRecap: serverMonthlyRecap, // Rename agar tidak konflik dengan perhitungan client
  canMutate
}: ProkerPrintViewProps) {
    
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // State untuk toggle hide/unhide per tim
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({});

  const toggleTeam = (team: string) => {
    setCollapsedTeams(prev => ({
      ...prev,
      [team]: !prev[team]
    }));
  };

  // Kalkulasi Rekapitulasi di Client untuk memastikan SEMUA kegiatan muncul (Fiskal & Non-Fiskal)
  // Ini menggantikan props monthlyRecap dari server yang mungkin terfilter hanya fiskal
  const clientRecapData = useMemo(() => {
    // Flatten semua program dari grouping
    const allPrograms = Object.values(groupedPrograms).flat() as WorkProgramModel[];
    
    return BULAN.map(bln => {
        // Cari program yang aktif di bulan ini (Status > 0)
        const items = allPrograms.filter(p => {
            const schedule = p.timeline?.[bln];
            if (!schedule) return false;
            if (Array.isArray(schedule)) return schedule.length > 0; // Support legacy format
            return Object.values(schedule).some(s => s > 0);
        });

        // Hitung total hanya jika statusnya FISCAL (2) di bulan tersebut
        const totalRab = items.reduce((acc, p) => {
             const schedule = p.timeline?.[bln];
             // Cek apakah bulan ini mengandung status Fiskal (2)
             const isFiscal = Array.isArray(schedule) 
                ? true // Legacy dianggap fiskal
                : Object.values(schedule || {}).some(v => v === 2);
             
             return acc + (isFiscal ? (p.total_budget || 0) : 0);
        }, 0);

        return { bulan: bln, items, totalRab };
    });
  }, [groupedPrograms]);

  // Hook Print
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Program Kerja Tahunan ${year} - ${orgName}`,
  });

  // Handler Hapus
  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Hapus Program?",
      text: `Anda akan menghapus "${name}". Data yang dihapus tidak dapat dikembalikan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      customClass: {
        popup: 'dark:bg-boxdark dark:text-white'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        startDeleteTransition(async () => {
          const res = await deleteProkerAction(id);
          if (res.success) {
            Swal.fire("Terhapus!", res.message, "success");
            router.refresh();
          } else {
            Swal.fire("Gagal!", res.message, "error");
          }
        });
      }
    });
  };

  // Helper untuk mendapatkan warna badge timeline di kartu program
  const getTimelineBadge = (status: TimelineStatus) => {
    if (status === 2) return "bg-green-500 border-green-600 print:bg-green-600 print:text-white"; // Fiskal
    if (status === 1) return "bg-blue-400 border-blue-500 print:bg-gray-300 print:text-black";   // Kegiatan
    return "bg-transparent border-gray-200 opacity-20"; // Kosong
  };

  return (
    <>
      {/* Header Navigasi (Hanya di Web) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 print:hidden">
        <Link href="/proker" className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase hover:text-primary transition-all">
          <ChevronLeft size={16} /> Kembali ke Daftar Tahun
        </Link>
        
        <button 
          onClick={() => handlePrint()} 
          className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-all text-sm"
        >
          <Printer size={18}/> Cetak Laporan PDF
        </button>
      </div>

      {/* Area Konten Laporan */}
      <div ref={contentRef}>
        <div className="min-h-screen bg-transparent print:bg-white print:text-black print:p-8 font-sans">
            
          <header className="text-center mb-12">
             <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tight print:text-black">
                Program Kerja Tahunan {year}
             </h1>
             <div className="h-1.5 w-32 bg-primary mx-auto mt-2 rounded-full print:bg-black"></div>
             <p className="text-sm text-gray-500 mt-3 font-bold uppercase tracking-widest print:text-black">
                {orgName} • Tingkat {activeLevel}
             </p>
          </header>

          {/* Legenda Timeline */}
          <div className="flex justify-center gap-6 mb-8 text-[10px] uppercase font-bold text-gray-500 print:text-black print:mb-4">
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-400 rounded-sm print:bg-gray-300 border print:border-black"></span> Kegiatan Non-Anggaran
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-sm print:bg-black"></span> Kegiatan Dengan Anggaran
             </div>
          </div>

          {Object.keys(groupedPrograms).length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-boxdark rounded-3xl border border-dashed border-stroke print:border-gray-300">
               <p className="text-gray-500 italic font-medium">Belum ada data program kerja.</p>
            </div>
          ) : (
            Object.entries(groupedPrograms).map(([team, items]) => (
              <section key={team} className="break-inside-avoid mb-10">
                {/* Header Tim dengan Tombol Toggle */}
                <div className="flex items-center gap-4 mb-6 group/header">
                  <h2 className="text-lg font-black text-black dark:text-white px-6 py-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-full shadow-sm print:shadow-none print:border-black print:text-black flex items-center gap-2">
                    <Briefcase className="text-primary print:text-black" size={18} /> {team}
                  </h2>
                  
                  {/* Tombol Hide/Unhide (Hidden saat Print) */}
                  <button 
                    onClick={() => toggleTeam(team)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-primary transition-all print:hidden"
                    title={collapsedTeams[team] ? "Tampilkan Program" : "Sembunyikan Program"}
                  >
                    {collapsedTeams[team] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  <div className="h-px bg-stroke dark:bg-strokedark flex-1 print:bg-black"></div>
                </div>

                {/* List Program (Bisa di-collapse) */}
                <div className={`flex flex-col gap-6 transition-all ${collapsedTeams[team] ? 'hidden print:flex' : 'flex'}`}>
                  {items.map((prog: WorkProgramModel) => (
                    <div key={prog.id} className="group relative bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark overflow-hidden shadow-sm print:shadow-none print:border-2 print:border-gray-800 print:break-inside-avoid">
                      
                      {/* 1. Header Kartu: Nama & Total */}
                      <div className="p-5 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4 flex justify-between items-start print:bg-gray-100 print:border-gray-400">
                         <div>
                            <h3 className="text-lg font-black text-black dark:text-white print:text-black leading-tight mb-1">
                                {prog.name}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 print:text-black">
                                <span className="flex items-center gap-1"><MapPin size={12}/> {prog.location || '-'}</span>
                                <span className="flex items-center gap-1"><Users size={12}/> {prog.participants || '-'}</span>
                            </div>
                         </div>
                         <div className="text-right">
                             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider print:text-black">Total Anggaran</div>
                             <div className="text-xl font-black text-primary print:text-black">
                                {formatIDR(prog.total_budget || 0)}
                             </div>
                         </div>
                      </div>

                      {/* 2. Body: Deskripsi & Timeline Matrix */}
                      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3">
                         {/* Kolom Kiri: Deskripsi & Tujuan */}
                         <div className="lg:col-span-1 text-sm text-gray-600 dark:text-gray-300 print:text-black">
                            <div className="mb-4">
                                <strong className="block text-xs font-black uppercase text-gray-400 mb-1 print:text-black">Deskripsi</strong>
                                <p>{prog.description || '-'}</p>
                            </div>
                            <div>
                                <strong className="block text-xs font-black uppercase text-gray-400 mb-1 print:text-black">Tujuan Strategis</strong>
                                <p className="italic">"{prog.objective || '-'}"</p>
                            </div>
                         </div>

                         {/* Kolom Kanan: Timeline Matrix */}
                         <div className="lg:col-span-2">
                            <strong className="block text-xs font-black uppercase text-gray-400 mb-2 flex items-center gap-2 print:text-black">
                                <CalendarDays size={14}/> Matriks Pelaksanaan
                            </strong>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {BULAN.map(bln => {
                                    const monthData = prog.timeline[bln] || {};
                                    const hasActivity = Object.values(monthData).some(v => v > 0);
                                    const note = prog.timeline_notes ? prog.timeline_notes[bln] : "";
                                    
                                    return (
                                        <div key={bln} className={`p-1.5 rounded border text-center flex flex-col justify-between min-h-[50px] ${hasActivity || note ? 'border-gray-300 bg-white print:border-black' : 'border-transparent opacity-50'}`}>
                                            <div>
                                                <div className="text-[9px] font-bold uppercase mb-1 print:text-black">{bln.substring(0,3)}</div>
                                                <div className="flex justify-center gap-0.5">
                                                    {MINGGU_LIST.map(m => {
                                                        const status = monthData[m] as TimelineStatus || 0;
                                                        return (
                                                            <div 
                                                                key={m} 
                                                                className={`w-1.5 h-1.5 rounded-full border ${getTimelineBadge(status)}`} 
                                                                title={`${bln} ${m}`}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            
                                            {note && (
                                                <div className="mt-1 text-[8px] leading-tight text-gray-600 border-t border-dashed border-gray-300 pt-1 italic print:text-black print:border-gray-500">
                                                    {note}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                         </div>
                      </div>

                      {/* 3. Footer: Detail RAB */}
                      {prog.budget_items && prog.budget_items.length > 0 && (
                          <div className="px-5 pb-5">
                             <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg overflow-hidden print:border-gray-400">
                                <div className="bg-gray-50 dark:bg-meta-4 px-4 py-2 border-b border-stroke dark:border-strokedark flex items-center gap-2 print:bg-gray-200 print:border-gray-400">
                                    <Coins size={14} className="text-primary print:text-black"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 print:text-black">Rincian Anggaran Biaya (RAB)</span>
                                </div>
                                <table className="w-full text-left text-xs print:text-[10px]">
                                    <thead className="text-gray-500 border-b border-stroke dark:border-strokedark print:text-black print:border-gray-400">
                                        <tr>
                                            <th className="px-4 py-2 font-bold w-1/2">Uraian Kebutuhan</th>
                                            <th className="px-4 py-2 font-bold text-center">Vol</th>
                                            <th className="px-4 py-2 font-bold text-center">Freq</th>
                                            <th className="px-4 py-2 font-bold text-right">Harga Satuan</th>
                                            <th className="px-4 py-2 font-bold text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stroke dark:divide-strokedark print:divide-gray-300">
                                        {prog.budget_items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-meta-4">
                                                <td className="px-4 py-1.5 font-medium print:text-black">{item.item}</td>
                                                <td className="px-4 py-1.5 text-center print:text-black">{item.jumlah} {item.satuan}</td>
                                                <td className="px-4 py-1.5 text-center print:text-black">{item.frekuensi || 1}x</td>
                                                <td className="px-4 py-1.5 text-right font-mono print:text-black">{formatIDR(item.harga)}</td>
                                                <td className="px-4 py-1.5 text-right font-bold print:text-black">
                                                    {formatIDR(item.harga * item.jumlah * (item.frekuensi || 1))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                          </div>
                      )}

                      {/* ACTION BUTTONS (WEB ONLY) */}
                      {canMutate && (
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                             <Link href={`/proker/edit/${prog.id}`} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                                <Pencil size={16}/>
                             </Link>
                             <button 
                                onClick={() => handleDelete(prog.id, prog.name)}
                                disabled={isDeleting}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
                             >
                                {isDeleting ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>}
                             </button>
                          </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}

          {/* Rekap Bulanan (Disempurnakan) */}
          {Object.keys(groupedPrograms).length > 0 && (
             <section className="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden break-inside-avoid mt-16 print:mt-8 print:border-2 print:border-black print:shadow-none">
               <div className="bg-primary/5 p-4 border-b border-stroke dark:border-strokedark flex items-center gap-3 print:bg-gray-200 print:border-black">
                   <LayoutDashboard className="text-primary print:text-black" size={20}/>
                   <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-tighter print:text-black">
                     Rekapitulasi Kegiatan dan RAB Bulanan {year}
                   </h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-gray-50 dark:bg-meta-4 print:bg-gray-100">
                     <tr>
                       <th className="p-3 text-left font-black uppercase text-[10px] text-gray-500 tracking-widest print:text-black">Bulan</th>
                       <th className="p-3 text-left font-black uppercase text-[10px] text-gray-500 tracking-widest print:text-black">Agenda Kegiatan</th>
                       <th className="p-3 text-right font-black uppercase text-[10px] text-gray-500 tracking-widest print:text-black">Total Pencairan</th>
                     </tr>
                   </thead>
                   <tbody>
                     {clientRecapData.map(data => (
                       <tr key={data.bulan} className="border-b border-stroke dark:border-strokedark print:border-gray-300">
                         <td className="p-3 font-black text-black dark:text-white uppercase text-xs print:text-black w-32">{data.bulan}</td>
                         <td className="p-3">
                           {data.items.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                               {data.items.map((it: WorkProgramModel) => {
                                 // Tentukan warna border berdasarkan status di bulan tersebut
                                 const schedule = it.timeline?.[data.bulan];
                                 const isFiscal = Array.isArray(schedule) 
                                    ? true 
                                    : Object.values(schedule || {}).some(v => v === 2);
                                 
                                 const borderClass = isFiscal 
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 print:border-green-600 print:bg-white print:text-black" 
                                    : "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 print:border-blue-400 print:bg-white print:text-black";

                                 return (
                                   <div key={it.id} className={`border px-2 py-1 rounded text-[10px] font-bold shadow-sm print:shadow-none ${borderClass}`}>
                                      <span className="block leading-tight">{it.name}</span>
                                      <span className="text-[8px] opacity-70 uppercase font-medium mt-0.5 block">{it.team}</span>
                                   </div>
                                 );
                               })}
                             </div>
                           ) : <span className="text-gray-300 italic text-[10px] print:text-gray-400">Tidak ada kegiatan</span>}
                         </td>
                         <td className="p-3 text-right font-black text-primary text-sm print:text-black w-40">
                           {data.totalRab > 0 ? formatIDR(data.totalRab) : '-'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot className="bg-primary text-white print:bg-black print:text-white">
                     <tr>
                       <td colSpan={2} className="p-4 text-right font-black uppercase tracking-widest text-[11px]">Total Estimasi Anggaran Tahun {year}:</td>
                       <td className="p-4 text-right text-xl font-black italic">
                         {formatIDR(clientRecapData.reduce((a,b)=>a+b.totalRab, 0))}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </section>
          )}
          
          {/* Footer Tanda Tangan */}
          <div className="hidden print:flex justify-between items-end mt-20 px-10 break-inside-avoid">
             <div className="text-center">
                <p className="mb-20 font-bold uppercase text-xs text-black">Ketua Tim Pelaksana</p>
                <div className="w-48 h-px bg-black mx-auto"></div>
                <p className="text-[8px] mt-1 text-black">(Nama Terang & Stempel)</p>
             </div>
             <div className="text-center">
                <p className="mb-20 font-bold uppercase text-xs text-black">Mengetahui, Pimpinan</p>
                <div className="w-48 h-px bg-black mx-auto"></div>
                <p className="text-[8px] mt-1 text-black">(Tanda Tangan & Stempel)</p>
             </div>
          </div>

        </div>
      </div>
    </>
  );
}