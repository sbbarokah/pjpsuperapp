"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Printer, MapPin, Users, LayoutDashboard, Briefcase, 
  Pencil, Trash2, Loader2 
} from "lucide-react";
import Swal from "sweetalert2"; // Pastikan sudah install sweetalert2
import { deleteProkerAction } from "../actions";

// --- Konstanta & Helper ---
const TEAMS = ["4S Desa", "LDII", "Senkom", "Persinas", "Fosgi", "ASAD", "Tim Kematian", "Tim PNKB", "PJP Desa", "KMM Desa", "Tim Benda SB", "Tim Pembangunan"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

interface ProkerDetailClientProps {
  initialPrograms: any[];
  year: number;
  activeLevel: string;
  userRole: string;
  orgName: string;
}

export default function ProkerDetailClient({ 
  initialPrograms, 
  year, 
  activeLevel, 
  userRole,
  orgName 
}: ProkerDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Grouping Data by Team
  const groupedPrograms = useMemo(() => {
    const res: Record<string, any[]> = {};
    TEAMS.forEach(team => {
      // Mapping field DB (name, team, etc) ke tampilan
      const prokers = initialPrograms.filter(p => p.team === team);
      if (prokers.length > 0) res[team] = prokers;
    });
    return res;
  }, [initialPrograms]);

  // Rekap Bulanan
  const monthlyRecap = useMemo(() => {
    return BULAN.map(bln => {
      // Cek timeline JSONB
      const items = initialPrograms.filter(p => {
         const schedule = p.timeline ? p.timeline[bln] : [];
         return schedule && schedule.length > 0;
      });
      const totalRab = items.reduce((acc, item) => acc + (item.total_budget || 0), 0);
      return { bulan: bln, items, totalRab };
    });
  }, [initialPrograms]);

  // Handler Hapus
  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Hapus Program Kerja?",
      text: `Anda akan menghapus "${name}". Data tidak dapat dikembalikan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal"
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await deleteProkerAction(id);
          if (res.success) {
            Swal.fire("Berhasil", res.message, "success");
            router.refresh(); // Refresh data server
          } else {
            Swal.fire("Gagal", res.message || "Terjadi kesalahan", "error");
          }
        });
      }
    });
  };

  const handlePrint = () => window.print();

  // Cek apakah user boleh mengedit (Superadmin biasanya read-only untuk data operasional)
  const canMutate = userRole === 'admin_desa' || userRole === 'admin_kelompok';

  return (
    <div className="space-y-10">
      {/* CSS Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
          .rounded-2xl { border: 1px solid #ddd !important; box-shadow: none !important; }
          @page { margin: 1cm; size: A4 landscape; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}} />

      {/* Navigasi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <Link href="/proker" className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase hover:text-primary transition-all">
          <ChevronLeft size={16} /> Kembali ke Daftar Tahun
        </Link>
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-all text-sm"
        >
          <Printer size={18}/> Cetak Laporan PDF
        </button>
      </div>

      {/* Header Laporan */}
      <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tight">Program Kerja Tahunan {year}</h1>
          <div className="h-1.5 w-32 bg-primary mx-auto mt-2 rounded-full"></div>
          <p className="text-sm text-gray-500 mt-3 font-bold uppercase tracking-widest">{orgName} • Tingkat {activeLevel}</p>
      </header>

      {/* Content Kosong */}
      {Object.keys(groupedPrograms).length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-boxdark rounded-3xl border border-dashed border-stroke">
            <p className="text-gray-500 italic font-medium">Belum ada data program kerja untuk tahun {year}.</p>
        </div>
      ) : (
        /* Looping Data per Tim */
        Object.entries(groupedPrograms).map(([team, items]) => (
          <section key={team} className="space-y-6 break-inside-avoid">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-black dark:text-white px-6 py-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-full shadow-sm print:bg-gray-100">
                <Briefcase className="inline-block mr-2 text-primary" size={18} /> {team}
              </h2>
              <div className="h-px bg-stroke dark:bg-strokedark flex-1 print:bg-black"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map(prog => (
                <div key={prog.id} className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark overflow-hidden border-l-4 border-l-primary shadow-sm print:shadow-none">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="max-w-[70%]">
                        <h3 className="text-lg font-black text-black dark:text-white leading-tight">{prog.name}</h3>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                         <span className="text-primary font-black text-sm print:text-black">
                           {formatIDR(prog.total_budget || 0)}
                         </span>
                         
                         {/* Tombol Aksi (Edit/Hapus) */}
                         {canMutate && (
                           <div className="flex items-center gap-1 print:hidden">
                              <Link 
                                href={`/proker/edit/${prog.id}`}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </Link>
                              <button
                                onClick={() => handleDelete(prog.id, prog.name)}
                                disabled={isPending}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Hapus"
                              >
                                {isPending ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                              </button>
                           </div>
                         )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2 font-medium"><MapPin size={12}/> {prog.location || '-'}</div>
                      <div className="flex items-center gap-2 font-medium"><Users size={12}/> Target: {prog.participants || '-'}</div>
                      <p className="italic border-l-2 border-primary/20 pl-3 leading-relaxed mt-2 text-gray-600 dark:text-gray-400">"{prog.objective}"</p>
                    </div>

                    <div className="border-t border-stroke pt-4 dark:border-strokedark">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Jadwal:</p>
                      <div className="flex flex-wrap gap-1">
                        {BULAN.map(b => {
                           const schedule = prog.timeline ? prog.timeline[b] : [];
                           if (schedule && schedule.length > 0) {
                             return (
                               <span key={b} className="px-2 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[9px] font-bold border border-stroke dark:border-strokedark">
                                 {b.substring(0,3)} ({schedule.join(',')})
                               </span>
                             )
                           }
                           return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Rekapitulasi Arus Kas Bulanan */}
      {initialPrograms.length > 0 && (
        <section className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden break-inside-avoid mt-20">
          <div className="bg-primary/5 p-6 border-b border-stroke dark:border-strokedark flex items-center gap-3 print:bg-gray-100">
              <LayoutDashboard className="text-primary" size={20}/>
              <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-tighter">Rekapitulasi Estimasi Anggaran Bulanan {year}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-meta-4">
                <tr>
                  <th className="p-4 text-left font-black uppercase text-[10px] text-gray-500 tracking-widest">Bulan</th>
                  <th className="p-4 text-left font-black uppercase text-[10px] text-gray-500 tracking-widest">Agenda Kegiatan</th>
                  <th className="p-4 text-right font-black uppercase text-[10px] text-gray-500 tracking-widest">Total RAB</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRecap.map(data => (
                  <tr key={data.bulan} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="p-4 font-black text-black dark:text-white uppercase text-xs">{data.bulan}</td>
                    <td className="p-4">
                      {data.items.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {data.items.map((it: any) => (
                            <div key={it.id} className="border border-stroke dark:border-strokedark px-2 py-1 rounded bg-white dark:bg-boxdark shadow-xs print:border-gray-300">
                                <span className="font-bold block leading-tight text-[11px]">{it.name}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase">{it.team}</span>
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-gray-300 italic text-xs">Tidak ada kegiatan terjadwal</span>}
                    </td>
                    <td className="p-4 text-right font-black text-primary text-base print:text-black">
                      {data.totalRab > 0 ? formatIDR(data.totalRab) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-primary text-white print:bg-black">
                <tr>
                  <td colSpan={2} className="p-6 text-right font-black uppercase tracking-widest text-[11px]">Total Anggaran Seluruh Kegiatan Tahun {year}:</td>
                  <td className="p-6 text-right text-2xl font-black italic">
                    {formatIDR(monthlyRecap.reduce((a,b)=>a+b.totalRab, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* Footer Tanda Tangan */}
      <div className="hidden print:flex justify-between items-end mt-20 px-10">
          <div className="text-center">
            <p className="mb-24 font-bold uppercase text-[10px]">Ketua Tim Pelaksana</p>
            <div className="w-48 h-px bg-black mx-auto"></div>
            <p className="text-[8px] mt-1">(Nama Terang & Stempel Bidang)</p>
          </div>
          <div className="text-center">
            <p className="mb-24 font-bold uppercase text-[10px]">Mengetahui, Pengurus Desa</p>
            <div className="w-48 h-px bg-black mx-auto"></div>
            <p className="text-[8px] mt-1">(Ketua Desa)</p>
          </div>
      </div>
    </div>
  );
}