"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Printer, ArrowLeft, Edit, Trash2, AlertCircle, FileText, List, LayoutGrid, Columns, ArrowUp, ArrowDown, Settings } from "lucide-react";
import Link from "next/link";

// Import Type dan Action dari Redux Slice dan Store
import { IRootState } from "@/store/store";
import { QuestionItem, removeFromCart } from "@/store/qPackageSlice";
import { cn } from "@/lib/utils";

export default function ExamPrintPage() {
  const dispatch = useDispatch();

  // 1. Mengambil data keranjang langsung dari Redux Store
  const cart = useSelector((state: IRootState) => state.qPackage.cart) || [];

  // State lokal untuk draf urutan soal
  const [orderedQuestions, setOrderedQuestions] = useState<QuestionItem[]>([]);

  // State lokal untuk judul dokumen
  const [printTitle, setPrintTitle] = useState("UJIAN AKHIR SEMESTER");
  const [printSubtitle, setPrintSubtitle] = useState("Materi Kefahaman Agama - Kelas 2");

  // State Lokal Kalimat Instruksi Kustom untuk Tiap Bagian Soal
  const [mcqTitle, setMcqTitle] = useState("Bagian 1: Pilihan Ganda");
  const [mcqInstruction, setMcqInstruction] = useState("Petunjuk: Pilihlah salah satu jawaban yang paling tepat dengan memberikan tanda silang (X) pada lembar jawaban!");

  const [uraianTitle, setUraianTitle] = useState("Bagian 2: Uraian Singkat");
  const [uraianInstruction, setUraianInstruction] = useState("Petunjuk: Beri tanda ceklis pada perbuatan yang benar, dan tanda silang pada perbuatan yang salah!");

  const [esaiTitle, setEsaiTitle] = useState("Bagian 3: Esai Bebas");
  const [esaiInstruction, setEsaiInstruction] = useState("Petunjuk: Jawablah pertanyaan esai di bawah ini secara mendalam, runut, dan sertakan dalil pendukung!");

  // State untuk Mengatur Ulang Penomoran (Mulai dari 1 lagi)
  const [restartUraianNumbering, setRestartUraianNumbering] = useState<boolean>(true);
  const [restartEsaiNumbering, setRestartEsaiNumbering] = useState<boolean>(true);

  // Layout pilihan ganda per soal (1: vertikal, 2: 2-kolom, 4: 4-kolom)
  const [questionLayouts, setQuestionLayouts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (cart.length !== orderedQuestions.length) {
      setOrderedQuestions(cart);
    }
  }, [cart, orderedQuestions.length]);

  const handleRemoveFromCart = (id: string) => {
    dispatch(removeFromCart(id));
    setOrderedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= orderedQuestions.length) return;

    const updated = [...orderedQuestions];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setOrderedQuestions(updated);
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

  // Mengelompokkan soal berdasarkan question_type sambil memetakan penomoran
  const groupedSections = useMemo(() => {
    const mcq: QuestionItem[] = [];
    const ur: QuestionItem[] = [];
    const es: QuestionItem[] = [];

    // Pisahkan soal ke dalam kategori masing-masing
    orderedQuestions.forEach((q) => {
      if (q.question_type === "pilihan_ganda") mcq.push(q);
      else if (q.question_type === "uraian") ur.push(q);
      else if (q.question_type === "esai") es.push(q);
    });

    // 1. Penomoran Pilihan Ganda (Selalu mulai dari 1)
    let mcqCounter = 1;
    const mcqWithNumbers = mcq.map(q => ({ ...q, globalNo: mcqCounter++ }));

    // 2. Penomoran Uraian (Bisa di-reset atau melanjutkan MCQ)
    let urCounter = restartUraianNumbering ? 1 : mcqCounter;
    const urWithNumbers = ur.map(q => ({ ...q, globalNo: urCounter++ }));

    // 3. Penomoran Esai (Bisa di-reset atau melanjutkan Uraian/MCQ)
    let esCounter = restartEsaiNumbering ? 1 : (restartUraianNumbering ? urCounter : urCounter);
    
    // Jika Uraian di-reset tapi Esai TIDAK di-reset, maka nomor Esai harus melanjutkan nomor terakhir Uraian (urCounter)
    // Jika kedua-duanya TIDAK di-reset, nomor Esai akan terus berlanjut secara otomatis dari urCounter.
    const esWithNumbers = es.map(q => ({ ...q, globalNo: esCounter++ }));

    return {
      mcq: mcqWithNumbers,
      uraian: urWithNumbers,
      esai: esWithNumbers,
    };
  }, [orderedQuestions, restartUraianNumbering, restartEsaiNumbering]);

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
              href="/elearning/question-bank"
              className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
            >
              <ArrowLeft size={20}/> Kembali ke Bank Soal
            </Link>
        </div>
      </div>
    );
  }

  console.log("isi groupedSections", groupedSections);  
  console.log("isi orderedQuestions", orderedQuestions);  

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

      <div className="max-w-6xl mx-auto space-y-6 print:space-y-0">

        {/* === HEADER BAR (NO-PRINT) === */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm gap-4 no-print">
          <div className="flex items-center gap-4">
            <Link
              href="/elearning/question-bank"
              className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-2xl transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-850 dark:text-white tracking-tight">Kustomisasi Cetak Ujian</h1>
              <p className="text-slate-400 text-xs font-semibold">Tentukan urutan bab, layout pilihan, dan sesuaikan instruksi KOP ujian.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0">
              <FileText size={14}/> {cart.length} Soal Terpilih
            </span>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Printer size={16} /> Cetak Lembar Ujian
            </button>
          </div>
        </div>

        {/* === LAYOUT UTAMA: KIRI PANEL KONTROL, KANAN KERTAS PREVIEW === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* PANEL KONTROL CONFIG (KIRI) */}
          <div className="lg:col-span-1 space-y-6 no-print">
            
            {/* CARD 1: EDIT KOP IDENTITAS */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <Settings size={18} className="text-blue-500" /> 1. Parameter Kertas & Nomor
              </h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Utama Kertas</label>
                  <input
                    type="text"
                    value={printTitle}
                    onChange={(e) => setPrintTitle(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-250 dark:border-slate-650 bg-slate-50 dark:bg-slate-700 outline-none text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subjudul / Kelas</label>
                  <input
                    type="text"
                    value={printSubtitle}
                    onChange={(e) => setPrintSubtitle(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-250 dark:border-slate-650 bg-slate-50 dark:bg-slate-700 outline-none text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* PENATALAKSANAAN RESET PENOMORAN */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Sistem Penomoran Bagian</span>
                  
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={restartUraianNumbering}
                      onChange={(e) => setRestartUraianNumbering(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Set Uraian mulai dari 1 lagi</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={restartEsaiNumbering}
                      onChange={(e) => setRestartEsaiNumbering(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Set Esai mulai dari 1 lagi</span>
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 2: KUSTOMISASI PETUNJUK BAGIAN */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <FileText size={18} className="text-purple-500" /> 2. Petunjuk Per Bagian Soal
              </h2>
              
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-700">
                {/* Instuksi MCQ */}
                {groupedSections.mcq.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Kategori Pilihan Ganda</span>
                    <input 
                      type="text" 
                      value={mcqTitle} 
                      onChange={(e) => setMcqTitle(e.target.value)}
                      className="w-full p-2.5 rounded-lg border text-xs font-bold bg-slate-50 dark:bg-slate-700 dark:text-white border-slate-200 dark:border-slate-600" 
                      placeholder="Judul bagian..." 
                    />
                    <textarea 
                      value={mcqInstruction} 
                      onChange={(e) => setMcqInstruction(e.target.value)}
                      rows={2} 
                      className="w-full p-2.5 rounded-lg border text-[11px] font-medium resize-none bg-slate-50 dark:bg-slate-700 dark:text-white border-slate-200 dark:border-slate-600" 
                      placeholder="Instruksi petunjuk..." 
                    />
                  </div>
                )}

                {/* Instuksi Uraian */}
                {groupedSections.uraian.length > 0 && (
                  <div className="space-y-2 pt-3">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Kategori Uraian Singkat</span>
                    <input 
                      type="text" 
                      value={uraianTitle} 
                      onChange={(e) => setUraianTitle(e.target.value)}
                      className="w-full p-2.5 rounded-lg border text-xs font-bold bg-slate-50 dark:bg-slate-700 dark:text-white border-slate-200 dark:border-slate-600" 
                      placeholder="Judul bagian..." 
                    />
                    <textarea 
                      value={uraianInstruction} 
                      onChange={(e) => setUraianInstruction(e.target.value)}
                      rows={2} 
                      className="w-full p-2.5 rounded-lg border text-[11px] font-medium resize-none bg-slate-50 dark:bg-slate-700 dark:text-white border-slate-200 dark:border-slate-600" 
                      placeholder="Instruksi petunjuk..." 
                    />
                  </div>
                )}

                {/* Instuksi Esai */}
                {groupedSections.esai.length > 0 && (
                  <div className="space-y-2 pt-3">
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Kategori Esai Bebas</span>
                    <input 
                      type="text" 
                      value={esaiTitle} 
                      onChange={(e) => setEsaiTitle(e.target.value)}
                      className="w-full p-2.5 rounded-lg border text-xs font-bold bg-slate-50 dark:bg-slate-700 dark:text-white border-slate-200 dark:border-slate-600" 
                      placeholder="Judul bagian..." 
                    />
                    <textarea 
                      value={esaiInstruction} 
                      onChange={(e) => setEsaiInstruction(e.target.value)}
                      rows={2} 
                      className="w-full p-2.5 rounded-lg border text-[11px] font-medium resize-none bg-slate-50 dark:bg-slate-700 dark:text-white border-slate-200 dark:border-slate-600" 
                      placeholder="Instruksi petunjuk..." 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: ATUR ULANG URUTAN SOAL secar GLOBAL */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <List size={18} className="text-emerald-500" /> 3. Susun Urutan Soal ({orderedQuestions.length})
              </h2>
              <p className="text-[10px] text-slate-400 font-bold ml-1">Urutan global di bawah ini akan dipecah secara rapi ke masing-masing kategori bagian di atas.</p>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {orderedQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 text-xs font-medium hover:border-slate-300">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-black text-slate-400 w-4 shrink-0">{idx + 1}</span>
                      <p className="truncate text-slate-700 dark:text-slate-300">{q.question}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => moveQuestion(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg border dark:border-slate-600"
                        title="Naikkan"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button 
                        onClick={() => moveQuestion(idx, "down")}
                        disabled={idx === orderedQuestions.length - 1}
                        className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded-lg border dark:border-slate-600"
                        title="Turunkan"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* KERTAS PREVIEW CETAK (KANAN - 2/3 WIDTH) */}
          <div className="lg:col-span-2">
            <div className="printable-sheet bg-white p-10 md:p-14 rounded-[2rem] border border-slate-200 shadow-xl print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 w-full text-black relative">
              
              {/* === KOP KERTAS UJIAN === */}
              <div className="text-center border-b-4 border-double border-black pb-5 mb-8">
                <h1 className="text-2xl font-black uppercase tracking-wider leading-tight">{printTitle}</h1>
                {printSubtitle && <h2 className="text-base font-bold mt-1 text-slate-700 print:text-black">{printSubtitle}</h2>}
                <h3 className="text-xs font-bold mt-1 uppercase text-slate-500 print:text-black">PJP Desa Cicalengka</h3>
              </div>

              {/* === IDENTITAS PESERTA UJIAN === */}
              <div className="grid grid-cols-2 gap-x-12 mb-8 text-xs font-bold">
                <div className="space-y-3">
                  <div className="flex items-end">
                    <span className="w-16">Nama</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 border-b border-black border-dotted relative top-0.5"></span>
                  </div>
                  <div className="flex items-end">
                    <span className="w-16">No. Peserta</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 border-b border-black border-dotted relative top-0.5"></span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-end">
                    <span className="w-16">Kelas</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 border-b border-black border-dotted relative top-0.5"></span>
                  </div>
                  <div className="flex items-end">
                    <span className="w-16">Tanggal</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 border-b border-black border-dotted relative top-0.5"></span>
                  </div>
                </div>
              </div>

              {/* === DAFTAR SOAL TER-KATEGORI DAN SINKRONISASI INSTRUKSI === */}
              <div className="space-y-8 text-sm">
                
                {/* 1. SEKSI MCQ (PILIHAN GANDA) */}
                {groupedSections.mcq.length > 0 && (
                  <div className="space-y-4">
                    <div className="border-b-2 border-black pb-1">
                      <h4 className="font-black uppercase tracking-tight text-sm">{mcqTitle}</h4>
                      <p className="text-xs italic text-slate-600 print:text-black font-semibold mt-1">{mcqInstruction}</p>
                    </div>

                    <div className="space-y-6">
                      {groupedSections.mcq.map((q) => {
                        const currentLayout = questionLayouts[q.id] || 1;
                        return (
                          <div key={q.id} className="relative group break-inside-avoid flex gap-3">
                            
                            {/* Tombol Pengubah Layout Cepat per Soal */}
                            <div className="absolute -left-12 top-0 flex flex-col gap-1.5 no-print opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => handleRemoveFromCart(q.id)}
                                className="p-1.5 text-red-500 bg-white border border-slate-200 rounded-full hover:bg-red-50 shadow-sm"
                                title="Hapus dari draf"
                              >
                                <Trash2 size={12} />
                              </button>
                              <button
                                onClick={() => toggleQuestionLayout(q.id)}
                                className="p-1.5 text-blue-600 bg-white border border-slate-200 rounded-full hover:bg-blue-50 shadow-sm"
                                title="Ubah layout pilihan"
                              >
                                {currentLayout === 1 ? <List size={12} /> : currentLayout === 2 ? <LayoutGrid size={12} /> : <Columns size={12} />}
                              </button>
                            </div>

                            {/* No. */}
                            <span className="font-bold w-5 shrink-0 text-right">{q.globalNo}.</span>
                            
                            {/* Inti Soal */}
                            <div className="flex-1 space-y-3">
                              <p className="font-bold leading-relaxed text-justify">{q.question}</p>
                              
                              {/* Grid Pilihan Ganda */}
                              <div className={cn("grid gap-x-6 gap-y-2 mt-2", 
                                currentLayout === 1 ? 'grid-cols-1' : 
                                currentLayout === 2 ? 'grid-cols-2' : 'grid-cols-4'
                              )}>
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex gap-2 items-start text-xs">
                                    <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold flex-shrink-0 text-[10px]">
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span className="font-medium leading-normal">{opt.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. SEKSI URAIAN */}
                {groupedSections.uraian.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="border-b-2 border-black pb-1">
                      <h4 className="font-black uppercase tracking-tight text-sm">{uraianTitle}</h4>
                      <p className="text-xs italic text-slate-600 print:text-black font-semibold mt-1">{uraianInstruction}</p>
                    </div>

                    <div className="space-y-8">
                      {groupedSections.uraian.map((q) => (
                        <div key={q.id} className="relative group break-inside-avoid flex gap-3">
                          
                          {/* Aksi Hapus */}
                          <button
                            onClick={() => handleRemoveFromCart(q.id)}
                            className="absolute -left-10 top-0 p-1.5 text-red-500 bg-white border border-slate-200 rounded-full hover:bg-red-50 shadow-sm no-print opacity-0 group-hover:opacity-100 transition-all"
                            title="Hapus dari draf"
                          >
                            <Trash2 size={12} />
                          </button>

                          <span className="font-bold w-5 shrink-0 text-right">{q.globalNo}.</span>
                          <div className="flex-1 space-y-4">
                            <p className="font-bold leading-relaxed text-justify">{q.question}</p>
                            {/* Garis Bantu Tulis Isian */}
                            <div className="border-b border-black border-dotted h-12 w-full opacity-35"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. SEKSI ESAI */}
                {groupedSections.esai.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="border-b-2 border-black pb-1">
                      <h4 className="font-black uppercase tracking-tight text-sm">{esaiTitle}</h4>
                      <p className="text-xs italic text-slate-600 print:text-black font-semibold mt-1">{esaiInstruction}</p>
                    </div>

                    <div className="space-y-10">
                      {groupedSections.esai.map((q) => (
                        <div key={q.id} className="relative group break-inside-avoid flex gap-3">
                          
                          {/* Aksi Hapus */}
                          <button
                            onClick={() => handleRemoveFromCart(q.id)}
                            className="absolute -left-10 top-0 p-1.5 text-red-500 bg-white border border-slate-200 rounded-full hover:bg-red-50 shadow-sm no-print opacity-0 group-hover:opacity-100 transition-all"
                            title="Hapus dari draf"
                          >
                            <Trash2 size={12} />
                          </button>

                          <span className="font-bold w-5 shrink-0 text-right">{q.globalNo}.</span>
                          <div className="flex-1 space-y-5">
                            <p className="font-bold leading-relaxed text-justify">{q.question}</p>
                            {/* Garis-Garis Esai Panjang */}
                            <div className="space-y-3.5 opacity-30">
                              <div className="border-b border-black border-dotted h-6 w-full"></div>
                              <div className="border-b border-black border-dotted h-6 w-full"></div>
                              <div className="border-b border-black border-dotted h-6 w-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* === KAKI KERTAS / TANDA TANGAN === */}
              <div className="mt-16 pt-6 flex justify-between items-center text-sm font-bold border-t-2 border-black break-inside-avoid">
                <div>
                  <span className="block font-black uppercase tracking-tight">Korektor Penguji</span>
                  <span className="block border-b border-black border-dotted h-14 w-44"></span>
                </div>
                <div className="text-right flex flex-col items-center">
                  <span className="block font-black uppercase tracking-tight">Mengetahui, Orang Tua</span>
                  <span className="block border-b border-black border-dotted h-14 w-44"></span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}