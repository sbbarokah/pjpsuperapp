"use client";

import React, { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import Swal from "sweetalert2";
import { 
  ChevronLeft, 
  Printer, 
  MapPin, 
  Users, 
  Briefcase,
  Pencil,
  Trash2,
  Loader2
} from "lucide-react";
import { deleteProkerAction } from "../actions";

// --- Konstanta & Helper ---
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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
}

export function ProkerPrintView({ 
  year, 
  orgName, 
  activeLevel, 
  groupedPrograms, 
  monthlyRecap,
  canMutate
}: ProkerPrintViewProps) {
  
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

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
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        startDeleteTransition(async () => {
          const res = await deleteProkerAction(id);
          if (res.success) {
            Swal.fire("Terhapus!", res.message, "success");
            router.refresh(); // Refresh data halaman tanpa reload
          } else {
            Swal.fire("Gagal!", res.message, "error");
          }
        });
      }
    });
  };

  return (
    <>
      {/* Header Navigasi */}
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
        <div className="min-h-screen bg-transparent print:bg-white print:text-black print:p-8">
            
          <header className="text-center mb-12">
             <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tight print:text-black">
                Program Kerja Tahunan {year}
             </h1>
             <div className="h-1.5 w-32 bg-primary mx-auto mt-2 rounded-full print:bg-black"></div>
             <p className="text-sm text-gray-500 mt-3 font-bold uppercase tracking-widest print:text-black">
                {orgName} • Tingkat {activeLevel}
             </p>
          </header>

          {Object.keys(groupedPrograms).length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-boxdark rounded-3xl border border-dashed border-stroke print:border-gray-300">
               <p className="text-gray-500 italic font-medium">Belum ada data program kerja.</p>
            </div>
          ) : (
            Object.entries(groupedPrograms).map(([team, items]) => (
              <section key={team} className="space-y-6 break-inside-avoid mb-10">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-black text-black dark:text-white px-6 py-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-full shadow-sm print:shadow-none print:border-black print:text-black">
                    <Briefcase className="inline-block mr-2 text-primary print:text-black" size={18} /> {team}
                  </h2>
                  <div className="h-px bg-stroke dark:bg-strokedark flex-1 print:bg-black"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                  {items.map(prog => (
                    <div key={prog.id} className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark overflow-hidden border-l-4 border-l-primary shadow-sm print:shadow-none print:border print:border-gray-300 print:break-inside-avoid relative group">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-black text-black dark:text-white print:text-black pr-12">{prog.name}</h3>
                          <span className="text-primary font-black text-sm print:text-black whitespace-nowrap">
                            {formatIDR(prog.total_budget || 0)}
                          </span>
                        </div>

                        {/* TOMBOL AKSI (Muncul di Web, Hilang di Print) */}
                        {canMutate && (
                          <div className="flex items-center gap-2 mb-4 print:hidden opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-1/4">
                             <Link 
                               href={`/proker/edit/${prog.id}`}
                               className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                               title="Edit Program"
                             >
                               <Pencil size={16} />
                             </Link>
                             <button
                               onClick={() => handleDelete(prog.id, prog.name)}
                               disabled={isDeleting}
                               className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                               title="Hapus Program"
                             >
                               {isDeleting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                             </button>
                          </div>
                        )}

                        <div className="space-y-2 mb-4 text-xs text-gray-500 print:text-black">
                          <div className="flex items-center gap-2 font-medium"><MapPin size={12}/> {prog.location || '-'}</div>
                          <div className="flex items-center gap-2 font-medium"><Users size={12}/> Target: {prog.participants || '-'}</div>
                          <p className="italic border-l-2 border-primary/20 pl-3 leading-relaxed mt-2 text-gray-600 dark:text-gray-400 print:text-black print:border-gray-400">
                            "{prog.objective}"
                          </p>
                        </div>
                        <div className="border-t border-stroke pt-4 dark:border-strokedark print:border-gray-300">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 print:text-black">Jadwal Pelaksanaan:</p>
                          <div className="flex flex-wrap gap-1">
                            {BULAN.map(b => prog.timeline[b]?.length > 0 && (
                              <span key={b} className="px-2 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[9px] font-bold border border-stroke dark:border-strokedark print:border-gray-400 print:bg-gray-100 print:text-black">
                                {b.substring(0,3)} ({prog.timeline[b].join(',')})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}

          {/* Rekap Bulanan (Sama seperti sebelumnya) */}
          {Object.keys(groupedPrograms).length > 0 && (
             /* ... (Kode Tabel Rekap Bulanan sama, tidak diubah) ... */
             /* Sertakan kode section rekap bulanan di sini */
             null 
          )}
          
          {/* Footer Tanda Tangan */}
          <div className="hidden print:flex justify-between items-end mt-20 px-10">
             <div className="text-center">
                <p className="mb-24 font-bold uppercase text-xs text-black">Ketua Tim Pelaksana</p>
                <div className="w-48 h-px bg-black mx-auto"></div>
                <p className="text-[8px] mt-1 text-black">(Nama Terang & Stempel Bidang)</p>
             </div>
             <div className="text-center">
                <p className="mb-24 font-bold uppercase text-xs text-black">Mengetahui, Pengurus Desa</p>
                <div className="w-48 h-px bg-black mx-auto"></div>
                <p className="text-[8px] mt-1 text-black">(Ketua Desa)</p>
             </div>
          </div>

        </div>
      </div>
    </>
  );
}