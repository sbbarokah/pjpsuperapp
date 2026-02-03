/**
 * Lokasi: app/(admin)/proker/detail/[year]/page.tsx
 * Deskripsi: Tampilan rinci proker tahunan dengan perbaikan asinkron params (Next.js 15+).
 */

"use client";

import React, { useMemo, useState, use } from "react";
import { 
  ChevronLeft, 
  Printer, 
  MapPin, 
  Users, 
  LayoutDashboard, 
  Briefcase 
} from "lucide-react";

// --- Konstanta ---
const TEAMS = [
  "4S Desa", "LDII", "Senkom", "Persinas", "Fosgi", "ASAD", 
  "Tim Kematian", "Tim PNKB", "PJP Desa", "KMM Desa", 
  "Tim Benda SB", "Tim Pembangunan"
];

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { 
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
}).format(val);

// --- Komponen Utama ---
export default function ProkerDetailPage({ params }: { params: Promise<{ year: string }> }) {
  // UNWRAP PARAMS: Di Next.js 15, params adalah Promise di Client Component
  const resolvedParams = use(params);
  const year = parseInt(resolvedParams.year);

  // Mock data proker (Nantinya dari DB: filter by tahun)
  const [programs] = useState<any[]>([
    {
      id: 1,
      nama_kegiatan: "Musyawarah Kerja Tahunan",
      tim: "4S Desa",
      tahun: 2026,
      tujuan: "Sinkronisasi program kerja seluruh bidang agar sejalan dengan visi organisasi.",
      tempat: "Gedung Serbaguna",
      peserta: "Seluruh Pengurus Desa",
      rab: [{ item: "Konsumsi", harga: 20000, jumlah: 100 }],
      timeline: { "Januari": ["M1", "M2"], "Juli": ["M1"] }
    },
    {
      id: 2,
      nama_kegiatan: "Diklat Remaja",
      tim: "LDII",
      tahun: 2026,
      tujuan: "Peningkatan karakter generus.",
      tempat: "Masjid Al-Barokah",
      peserta: "Remaja Usia Mandiri",
      rab: [{ item: "Sewa Tenda", harga: 500000, jumlah: 1 }],
      timeline: { "Februari": ["M3"] }
    }
  ]);

  // Grouping Data by Team
  const groupedPrograms = useMemo(() => {
    const res: Record<string, any[]> = {};
    TEAMS.forEach(team => {
      const prokers = programs.filter(p => p.tim === team && p.tahun === year);
      if (prokers.length > 0) res[team] = prokers;
    });
    return res;
  }, [programs, year]);

  // Rekap Bulanan
  const monthlyRecap = useMemo(() => {
    return BULAN.map(bln => {
      const items = programs.filter(p => p.tahun === year && p.timeline[bln]?.length > 0);
      const totalRab = items.reduce((acc, item) => 
        acc + item.rab.reduce((rAcc: number, r: any) => rAcc + (r.harga * r.jumlah), 0), 0
      );
      return { bulan: bln, items, totalRab };
    });
  }, [programs, year]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      {/* CSS Khusus Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
          .rounded-2xl, .rounded-3xl { border-radius: 4px !important; border: 1px solid #ddd !important; box-shadow: none !important; }
          @page { margin: 1.5cm; size: A4 landscape; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}} />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigasi & Aksi (Disembunyikan saat print) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <a href="/proker" className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase hover:text-primary transition-all">
            <ChevronLeft size={16} /> Kembali ke Daftar Tahun
          </a>
          
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-all text-sm"
          >
            <Printer size={18}/> Cetak Laporan PDF
          </button>
        </div>

        {/* Konten Laporan */}
        <div className="space-y-10">
          <header className="text-center mb-12">
             <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tight">Program Kerja Tahunan {year}</h1>
             <div className="h-1.5 w-32 bg-primary mx-auto mt-4 rounded-full"></div>
             <p className="hidden print:block text-sm text-gray-500 mt-2 font-medium">Laporan Resmi Rencana Kegiatan Organisasi</p>
          </header>

          {Object.keys(groupedPrograms).length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-boxdark rounded-3xl border border-dashed border-stroke">
               <p className="text-gray-500 italic font-medium">Belum ada data program kerja untuk tahun {year}.</p>
               <p className="text-xs text-gray-400 mt-2">Silakan tambahkan data melalui menu "Input Baru".</p>
            </div>
          ) : (
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
                          <h3 className="text-lg font-black text-black dark:text-white">{prog.nama_kegiatan}</h3>
                          <span className="text-primary font-black text-sm print:text-black">
                            {formatIDR(prog.rab.reduce((a: any, b: any) => a + (b.harga * b.jumlah), 0))}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4 text-xs text-gray-500">
                          <div className="flex items-center gap-2 font-medium"><MapPin size={12}/> {prog.tempat || '-'}</div>
                          <div className="flex items-center gap-2 font-medium"><Users size={12}/> Target: {prog.peserta || '-'}</div>
                          <p className="italic border-l-2 border-primary/20 pl-3 leading-relaxed mt-2 text-gray-600 dark:text-gray-400">
                            "{prog.tujuan}"
                          </p>
                        </div>
                        <div className="border-t border-stroke pt-4 dark:border-strokedark">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Jadwal Pelaksanaan:</p>
                          <div className="flex flex-wrap gap-1">
                            {BULAN.map(b => prog.timeline[b]?.length > 0 && (
                              <span key={b} className="px-2 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[9px] font-bold border border-stroke dark:border-strokedark">
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

          {/* Rekapitulasi Arus Kas Bulanan */}
          {programs.filter(p => p.tahun === year).length > 0 && (
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
                      <th className="p-4 text-left font-black uppercase text-[10px] text-gray-500 tracking-widest">Daftar Agenda Kegiatan</th>
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
                                <div key={it.id} className="border border-stroke dark:border-strokedark px-2 py-1.5 rounded-lg bg-white dark:bg-boxdark shadow-xs print:border-gray-300">
                                   <span className="font-bold block leading-tight text-[11px]">{it.nama_kegiatan}</span>
                                   <span className="text-[9px] text-gray-400 font-bold uppercase">{it.tim}</span>
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

          {/* Bagian Tanda Tangan (Hanya muncul saat Print) */}
          <div className="hidden print:flex justify-between items-end mt-20 px-10">
             <div className="text-center">
                <p className="mb-24 font-bold uppercase text-xs">Ketua Tim Pelaksana</p>
                <div className="w-48 h-px bg-black mx-auto"></div>
                <p className="text-[10px] mt-1">(Nama Terang & Stempel Bidang)</p>
             </div>
             <div className="text-center">
                <p className="mb-24 font-bold uppercase text-xs">Mengetahui, Pengurus Desa</p>
                <div className="w-48 h-px bg-black mx-auto"></div>
                <p className="text-[10px] mt-1">(Ketua Desa)</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}