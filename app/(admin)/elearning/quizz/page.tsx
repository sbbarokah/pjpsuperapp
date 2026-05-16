"use client";

import React, { useEffect, useState } from "react";
import { 
  History, 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Timer, 
  ListOrdered,
  Loader2,
  Calendar,
  MoreVertical,
  Trash2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// --- Tipe Data ---
interface QuizSession {
  id: string;
  created_at: string;
  title: string;
  status: 'waiting' | 'started' | 'finished';
  duration_per_question: number;
  questions_data: any[];
}

export default function QuizHistoryPage() {
  const [quizzes, setQuizzes] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch Data Riwayat Kuis
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Gagal memuat riwayat kuis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Format Tanggal Indonesia
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Badge Status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
            <Clock size={12} /> Menunggu
          </span>
        );
      case 'started':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-green-100 text-green-700 border border-green-200 animate-pulse">
            <Play size={12} fill="currentColor" /> Berlangsung
          </span>
        );
      case 'finished':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 size={12} /> Selesai
          </span>
        );
      default:
        return null;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus sesi kuis ini beserta semua data peserta?")) {
      const { error } = await supabase.from("quiz_sessions").delete().eq("id", id);
      if (!error) {
        setQuizzes(prev => prev.filter(q => q.id !== id));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                <History size={28} />
              </div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white">Riwayat Live Kuis</h1>
            </div>
            <p className="text-slate-500 font-medium ml-1">Kelola dan pantau sesi kuis real-time yang telah dibuat.</p>
          </div>
          
          <a 
            href="/elearning/quizz/create"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-blue-600/30 transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            BUAT KUIS BARU
          </a>
        </div>

        {/* LIST SECTION */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="font-bold text-lg">Memuat riwayat sesi...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[40px] border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <Play size={40} opacity={0.3} />
               </div>
               <p className="text-slate-500 font-bold text-xl">Belum ada sesi kuis yang dibuat.</p>
               <p className="text-slate-400 mt-1">Mulai petualangan belajar dengan membuat sesi kuis pertama!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz.id} 
                  className="group bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col md:flex-row md:items-center gap-6"
                >
                  {/* Status Indicator Bar */}
                  <div className={`hidden md:block w-2 self-stretch rounded-full ${
                    quiz.status === 'waiting' ? 'bg-yellow-400' :
                    quiz.status === 'started' ? 'bg-green-500' : 'bg-slate-300'
                  }`} />

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {renderStatusBadge(quiz.status)}
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <Calendar size={14} />
                        {formatDate(quiz.created_at)}
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {quiz.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                          <ListOrdered size={16} />
                        </div>
                        {quiz.questions_data?.length || 0} Soal
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                          <Timer size={16} />
                        </div>
                        {quiz.duration_per_question} Detik / Soal
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button 
                      onClick={() => handleDelete(quiz.id)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Hapus Sesi"
                    >
                      <Trash2 size={20} />
                    </button>
                    <a 
                      href={`/elearning/quizz/${quiz.id}/control`}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 px-6 py-3.5 rounded-2xl font-bold transition-all group/btn"
                    >
                      {quiz.status === 'finished' ? 'Lihat Laporan' : 'Buka Kontrol'}
                      <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && quizzes.length > 0 && (
          <div className="text-center text-slate-400 text-sm font-medium pb-10">
            Menampilkan {quizzes.length} sesi kuis terbaru
          </div>
        )}
      </div>
    </div>
  );
}