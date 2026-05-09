"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Printer, ArrowLeft, Edit, Trash2, AlertCircle, FileText, List, LayoutGrid, Columns } from "lucide-react";
import Link from "next/link";

// Import Type dan Action dari Redux Slice dan Store
import { IRootState } from "@/store/store";
import { removeFromCart } from "@/store/qPackageSlice";

export default function ExamPrintPage() {
  const dispatch = useDispatch();

  // 1. Mengambil data keranjang langsung dari Redux Store
  const cart = useSelector((state: IRootState) => state.qPackage.cart) || [];

  // State lokal untuk judul dokumen
  const [printTitle, setPrintTitle] = useState("UJIAN AKHIR SEMESTER");
  const [printSubtitle, setPrintSubtitle] = useState("Materi Kefahaman Agama - Kelas 2");

  const [questionLayouts, setQuestionLayouts] = useState<Record<string, number>>({});

  const handleRemoveFromCart = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const toggleQuestionLayout = (id: string) => {
    setQuestionLayouts((prev) => {
      const current = prev[id] || 1;
      let next = 1;
      if (current === 1) next = 2;
      else if (current === 2) next = 4;
      else next = 1;
      return { ...prev, [id]: next };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getCurrentMonthYear = () => {
    const date = new Date();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-slate-100 max-w-md w-full">
            <AlertCircle size={64} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">Paket Soal Kosong</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Anda telah menghapus semua soal dari paket ini. Silakan kembali untuk memilih soal.
            </p>
            <Link 
              href="/admin/elearning/bank-soal"
              className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
            >
              <ArrowLeft size={20}/> Kembali ke Bank Soal
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:p-0 print:bg-white">
      {/* LOGIKA PRINT: CSS ini akan menyembunyikan sidebar dan header global 
        yang ada di layout utama saat jendela print dibuka.
      */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan Sidebar, Header, dan elemen navigasi lainnya */
          aside, 
          nav, 
          header, 
          footer:not(.print-footer),
          .sidebar,
          .header,
          .navbar,
          .no-print {
            display: none !important;
          }

          /* Pastikan container utama tidak memiliki margin/padding bawaan layout */
          main, .main-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
          }

          /* Hilangkan background abu-abu body saat print */
          body {
            background-color: white !important;
          }
          
          /* Hilangkan link URL yang otomatis muncul di footer browser (opsional) */
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:max-w-none">

        {/* === BAGIAN NO-PRINT (Kontrol & Pengaturan) === */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden no-print">
          <Link
            href="/admin/elearning/bank-soal"
            className="flex items-center gap-2 text-slate-600 font-bold hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} /> Kembali/Edit Seleksi
          </Link>
          <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
            <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
               <FileText size={16}/> {cart.length} Soal Terpilih
            </span>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Printer size={18} /> Cetak Sekarang
            </button>
          </div>
        </div>

        {/* FORM PENGATURAN KOP (Akan disembunyikan saat print) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden no-print space-y-4">
          <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
            <Edit size={20} className="text-blue-500" /> Pengaturan Kertas Ujian
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Judul Utama</label>
              <input
                type="text"
                value={printTitle}
                onChange={(e) => setPrintTitle(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold uppercase text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Subjudul / Keterangan</label>
              <input
                type="text"
                value={printSubtitle}
                onChange={(e) => setPrintSubtitle(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-bold text-sm transition-all"
              />
            </div>
          </div>
        </div>
        
        {/* === BAGIAN PRINT-ONLY (Kertas Ujian) === */}
        <div id="printable-area" className="bg-white p-10 md:p-14 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 w-full text-black relative overflow-hidden">
          
          {/* Header Kertas */}
          <div className="text-center border-b-[3px] border-black pb-6 mb-8 relative z-10">
            <h1 className="text-3xl font-black uppercase tracking-wider leading-tight">{printTitle}</h1>
            {printSubtitle && <h2 className="text-xl font-bold mt-2 text-slate-700 print:text-black">{printSubtitle}</h2>}
            <h3 className="text-md font-bold mt-2 text-slate-700 print:text-black">PJP Desa Cicalengka</h3>
          </div>

          {/* Area Identitas Siswa */}
          <div className="flex flex-col md:flex-row print:flex-row justify-between mb-10 space-y-4 md:space-y-0 print:space-y-0 relative z-10">
            <div className="w-full md:w-[45%] print:w-[45%] space-y-4">
              <div className="flex items-end font-bold text-lg">
                <span className="w-24">Nama</span>
                <span className="mr-2">:</span>
                <span className="flex-1 border-b-2 border-black border-dotted relative top-1"></span>
              </div>
              <div className="flex items-end font-bold text-lg">
                <span className="w-24">No. Ujian</span>
                <span className="mr-2">:</span>
                <span className="flex-1 border-b-2 border-black border-dotted relative top-1"></span>
              </div>
            </div>
            <div className="w-full md:w-[45%] print:w-[45%] space-y-4 md:pl-10 print:pl-10">
               <div className="flex items-end font-bold text-lg">
                <span className="w-24">Kelas</span>
                <span className="mr-2">:</span>
                <span className="flex-1 border-b-2 border-black border-dotted relative top-1"></span>
              </div>
               <div className="flex items-end font-bold text-lg">
                <span className="w-24">Tanggal</span>
                <span className="mr-2">:</span>
                <span className="flex-1 border-b-2 border-black border-dotted relative top-1"></span>
              </div>
            </div>
          </div>

          {/* List Soal */}
          <div className="space-y-8">
            {cart.map((q, idx) => {
              const currentLayout = questionLayouts[q.id] || 1;
              
              return (
                <div key={q.id} className="relative group break-inside-avoid flex gap-4">
                  {/* --- TOMBOL AKSI PER SOAL (NO-PRINT) --- */}
                  <div className="absolute -left-12 top-0 flex flex-col gap-2 no-print opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleRemoveFromCart(q.id)}
                      className="p-2 text-red-500 bg-white border border-slate-200 rounded-full hover:bg-red-50"
                      title="Hapus Soal"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleQuestionLayout(q.id)}
                      className="p-2 text-blue-600 bg-white border border-slate-200 rounded-full hover:bg-blue-50"
                      title="Ubah Layout Jawaban"
                    >
                      {currentLayout === 1 ? <List size={16} /> : currentLayout === 2 ? <LayoutGrid size={16} /> : <Columns size={16} />}
                    </button>
                  </div>

                  {/* Nomor */}
                  <span className="font-bold text-lg w-6 flex-shrink-0 text-right">{idx + 1}.</span>

                  <div className="flex-1">
                    <p className="text-base font-bold leading-relaxed mb-4 text-justify">{q.question}</p>

                    {q.options && q.options.length > 0 ? (
                      <div className={`grid gap-x-4 gap-y-3 ${
                        currentLayout === 1 ? 'grid-cols-1' : 
                        currentLayout === 2 ? 'grid-cols-2' : 
                        'grid-cols-2 lg:grid-cols-4 print:grid-cols-4'
                      }`}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-3 text-sm items-center">
                            <span className="w-7 h-7 rounded-full border border-black flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="font-medium leading-tight">{opt.teks || opt.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 border-b border-black border-dotted h-20 w-full opacity-30"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Kertas */}
          {/* <div className="mt-20 pt-8 flex flex-col md:flex-row justify-between items-center text-base font-bold border-t-2 border-black relative z-10 break-inside-avoid print-footer">
            <div>
               <span className="block font-black uppercase">PJP Desa Cicalengka</span>
               <span>{getCurrentMonthYear()}</span>
            </div>
            <div className="mt-8 md:mt-0 flex flex-col items-center w-48">
               <span>Mengetahui,</span>
               <span className="mt-16 border-b-2 border-black border-dotted w-full"></span>
               <span className="mt-1 text-sm font-normal text-slate-500 print:hidden no-print">(Tanda Tangan Guru/Pengawas)</span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}