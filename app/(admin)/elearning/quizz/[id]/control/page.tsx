// tsx:app/(admin)/elearning/quiz/control/[id]/page.tsx
"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Share2, Play, Users, Trophy, ChevronRight, CheckCircle, ExternalLink, Check, Copy } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default function QuizControlPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const { id } = use(params);
  const [participants, setParticipants] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('quiz_room_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_participants', filter: `session_id=eq.${id}` }, () => {
        fetchData(); 
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${id}` }, (payload) => {
        setSession(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const fetchData = async () => {
    const { data: sess } = await supabase.from("quiz_sessions").select("*").eq("id", id).single();
    const { data: parts } = await supabase.from("quiz_participants").select("*").eq("session_id", id).order('score', { ascending: false });
    setSession(sess);
    setParticipants(parts || []);
  };

  const startQuiz = async () => {
    await supabase.from("quiz_sessions").update({ status: 'started', current_question_index: 0 }).eq("id", id);
  };

  const nextQuestion = async () => {
    const nextIndex = session.current_question_index + 1;
    if (nextIndex >= session.questions_data.length) {
      await supabase.from("quiz_sessions").update({ status: 'finished' }).eq("id", id);
    } else {
      await supabase.from("quiz_sessions").update({ current_question_index: nextIndex }).eq("id", id);
    }
  };

  const handleCopyLink = () => {
    // Generate URL pendaftaran peserta
    const joinUrl = `${window.location.origin}/quizz/${id}/join`;
    
    // Copy ke clipboard
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset icon setelah 2 detik
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{session?.title || "Memuat..."}</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${session?.status === 'started' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Status: <span className={session?.status === 'started' ? 'text-green-600' : 'text-blue-600'}>{session?.status}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* TOMBOL SHARE LINK */}
          <button 
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all active:scale-95 border-2 ${
              copied 
              ? 'bg-green-50 border-green-500 text-green-600' 
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600'
            }`}
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? 'Berhasil Disalin!' : 'Bagikan Link'}
          </button>

          {session?.status === 'waiting' ? (
            <button 
              onClick={startQuiz} 
              className="flex-1 md:flex-none px-8 py-3 bg-green-600 text-white rounded-2xl font-black hover:bg-green-700 shadow-xl shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Play size={20} fill="currentColor"/> MULAI KUIS
            </button>
          ) : session?.status === 'started' && (
            <button 
              onClick={nextQuestion} 
              className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              LANJUT SOAL <ChevronRight size={20}/>
            </button>
          )}
        </div>
      </div>

      {/* MODAL / INPUT INFO UNTUK COPY (Opsional, agar link terlihat jelas) */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <ExternalLink size={18} />
          </div>
          <div className="text-sm">
            <p className="font-black text-blue-900 leading-none">URL Pendaftaran Peserta</p>
            <p className="text-blue-700/60 font-medium mt-1 truncate max-w-[250px] md:max-w-md">
              {typeof window !== 'undefined' ? `${window.location.origin}/quizz/${id}/join` : '...'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleCopyLink}
          className="w-full md:w-auto px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <Copy size={14} /> Salin URL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Soal Saat Ini */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-500 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Trophy size={120} />
                </div>
                <p className="text-[10px] font-black text-blue-500 mb-3 uppercase tracking-[0.2em]">Live Question:</p>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">
                    {session?.status === 'started' 
                        ? `${session.current_question_index + 1}. ${session.questions_data[session.current_question_index]?.question}`
                        : session?.status === 'finished' ? "🏆 Kuis Telah Selesai" : "Menunggu Peserta Bergabung..."
                    }
                </h2>
                {session?.status === 'started' && (
                  <div className="mt-6 flex gap-2">
                    {session.questions_data[session.current_question_index]?.options?.map((opt: any, i: number) => (
                      <div key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">
                        {String.fromCharCode(65+i)}. {opt.teks || opt.text}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* List Peserta */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
                    <Users className="text-blue-500" /> Peserta Terdaftar ({participants.length})
                </h2>
                {participants.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium italic">
                    Belum ada peserta yang bergabung...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {participants.map(p => (
                      <div key={p.id} className="p-4 bg-slate-50 rounded-2xl font-black text-slate-700 border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
                          {p.name}
                      </div>
                      ))}
                  </div>
                )}
            </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
          <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-800">
            <Trophy className="text-yellow-500" /> Papan Skor
          </h2>
          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="text-center py-6 text-slate-300 text-sm italic">Kosong</div>
            ) : (
              participants.map((p, idx) => (
                <div key={p.id} className={`flex justify-between items-center p-4 rounded-2xl transition-all ${idx === 0 ? 'bg-yellow-50 border-2 border-yellow-200 ring-4 ring-yellow-50' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-black shadow-sm ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-white text-slate-400'}`}>
                        {idx + 1}
                      </span>
                      <span className="font-black text-slate-700 truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-blue-600 block text-lg leading-none">{p.score}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Points</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}