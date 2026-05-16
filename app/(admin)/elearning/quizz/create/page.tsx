// tsx:app/(admin)/elearning/quiz/create/page.tsx
"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IRootState } from "@/store/store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Play, Timer, ListOrdered, Share2, AlertCircle, Loader2, BookOpen, PlusCircle, ArrowLeft } from "lucide-react";

export default function CreateQuizPage() {
  const cart = useSelector((state: IRootState) => state.qPackage.cart);
  const [config, setFormData] = useState({
    title: "Kuis PJP " + new Date().toLocaleDateString(),
    duration: 30,
    interval: 5
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleCreateSession = async () => {
    if (cart.length === 0) return alert("Pilih soal di Bank Soal dulu!");
    setLoading(true);

    const { data, error } = await supabase
      .from("quiz_sessions")
      .insert({
        title: config.title,
        duration_per_question: config.duration,
        interval_seconds: config.interval,
        questions_data: cart,
        status: "waiting"
      })
      .select()
      .single();

    if (!error) {
      router.push(`/elearning/quizz/${data.id}/control`);
    } else {
      alert("Gagal membuat kuis");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Tombol Kembali ke Riwayat */}
        <a 
          href="/elearning/quizz"
          className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors mb-2 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          Kembali ke Riwayat Kuis
        </a>

        <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 relative overflow-hidden">
          {/* Dekorasi Latar Belakang */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Konfigurasi Live Kuis</h1>
                <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest">Sesi Real-Time</p>
            </div>
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
              <Play fill="currentColor" size={28} />
            </div>
          </div>
          
          <div className="space-y-10 relative z-10">
            {/* Bagian Ringkasan Soal */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Soal di Keranjang
                </label>
                <a 
                  href="/elearning/question-bank"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle size={14} /> Kelola Bank Soal
                </a>
              </div>

              {cart.length > 0 ? (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 text-blue-700 rounded-3xl flex items-center justify-between group transition-all hover:shadow-md">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
                         <ListOrdered size={28} />
                      </div>
                      <div>
                        <p className="font-black text-2xl leading-none">{cart.length} Soal</p>
                        <p className="text-xs font-bold opacity-60 mt-2 uppercase tracking-wide">Terpilih & Siap Tayang</p>
                      </div>
                   </div>
                   <a 
                    href="/elearning/question-bank" 
                    className="px-5 py-3 bg-white text-blue-600 rounded-xl shadow-sm hover:shadow-lg transition-all font-black text-sm active:scale-95"
                   >
                     TAMBAH LAGI
                   </a>
                </div>
              ) : (
                <div className="p-10 border-4 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center text-center space-y-5 bg-slate-50/50">
                  <div className="w-20 h-20 bg-white text-slate-200 rounded-full flex items-center justify-center shadow-inner">
                    <AlertCircle size={40} />
                  </div>
                  <div>
                    <p className="font-black text-slate-700 text-xl">Keranjang Kosong!</p>
                    <p className="text-slate-400 max-w-[280px] mx-auto mt-2 font-medium">
                      Anda belum memilih soal dari bank soal untuk kuis ini.
                    </p>
                  </div>
                  <a 
                    href="/elearning/question-bank"
                    className="flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-base shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <BookOpen size={20} /> BUKA BANK SOAL
                  </a>
                </div>
              )}
            </div>

            {/* Input Konfigurasi */}
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Judul Sesi Kuis</label>
                <input 
                  type="text" 
                  value={config.title}
                  onChange={(e) => setFormData({...config, title: e.target.value})}
                  placeholder="Contoh: Kuis Cerdas Cermat Desa"
                  className="w-full p-5 rounded-3xl border-2 border-slate-100 focus:border-blue-500 bg-slate-50 focus:bg-white outline-none font-bold transition-all shadow-sm focus:shadow-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Durasi per Soal</label>
                  <div className="relative group">
                    <Timer className="absolute left-5 top-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24}/>
                    <input 
                      type="number" 
                      value={config.duration}
                      onChange={(e) => setFormData({...config, duration: parseInt(e.target.value) || 0})}
                      className="w-full p-5 pl-14 rounded-3xl border-2 border-slate-100 focus:border-blue-500 bg-slate-50 focus:bg-white outline-none font-black transition-all shadow-sm"
                    />
                    <span className="absolute right-5 top-6 text-[10px] font-black text-slate-400 uppercase">Detik</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Jeda Antar Soal</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={config.interval}
                      onChange={(e) => setFormData({...config, interval: parseInt(e.target.value) || 0})}
                      className="w-full p-5 rounded-3xl border-2 border-slate-100 focus:border-blue-500 bg-slate-50 focus:bg-white outline-none font-black transition-all shadow-sm text-center"
                    />
                    <span className="absolute right-5 top-6 text-[10px] font-black text-slate-400 uppercase">Detik</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <button 
              onClick={handleCreateSession}
              disabled={loading || cart.length === 0}
              className="w-full py-6 bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-4 group mt-4 overflow-hidden relative"
            >
              {loading ? (
                <><Loader2 size={28} className="animate-spin" /> Memproses Sesi...</>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-3">
                    <Play fill="currentColor" size={24} /> 
                    BUKA PANEL KONTROL
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Info Tambahan */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest pt-2">
          <AlertCircle size={14} />
          Data akan disinkronkan ke seluruh perangkat peserta
        </div>
      </div>
    </div>
  );
}