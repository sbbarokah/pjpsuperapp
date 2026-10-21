"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Share2, Play, Users, Trophy, Check, Award, Loader2, Timer, Maximize, Minimize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizControlPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const { id } = use(params);
  const [participants, setParticipants] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 1. STATE & REF UNTUK FULLSCREEN INFOCUS
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`quiz_admin_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_participants', filter: `session_id=eq.${id}` }, () => {
        fetchData(); 
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${id}` }, (payload) => {
        setSession(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (session?.status !== 'started') return;
    const totalTime = (session.duration_per_question || 30) + (session.interval_seconds || 5);
    setCountdown(totalTime);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoNext(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.current_question_index, session?.status]);

  // 2. LISTENER UNTUK DETEKSI TOMBOL 'ESC' BROWSER
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const fetchData = async () => {
    const { data: sess } = await supabase.from("quiz_sessions").select("*").eq("id", id).single();
    const { data: parts } = await supabase.from("quiz_participants").select("*").eq("session_id", id).order('score', { ascending: false });
    setSession(sess);
    setParticipants(parts || []);
  };

  const startQuiz = async () => {
    setIsProcessing(true);
    await supabase.from("quiz_sessions").update({ status: 'started', current_question_index: 0 }).eq("id", id);
    setIsProcessing(false);
  };

  const handleAutoNext = async () => {
    if (!session) return;
    const nextIndex = (session.current_question_index || 0) + 1;
    if (nextIndex >= session.questions_data.length) {
      await supabase.from("quiz_sessions").update({ status: 'finished' }).eq("id", id);
    } else {
      await supabase.from("quiz_sessions").update({ current_question_index: nextIndex }).eq("id", id);
    }
  };

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}/quizz/${id}/join`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 3. FUNGSI TOGGLE FULLSCREEN
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      scoreboardRef.current?.requestFullscreen().catch(err => {
        console.error(`Gagal masuk mode fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const isFinished = session?.status === 'finished';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* --- HEADER ADMIN --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
        {/* ... (Header biarkan sama seperti sebelumnya) ... */}
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
          {!isFinished && (
            <button onClick={handleCopyLink} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2 ${copied ? 'bg-green-50 border-green-500 text-green-600' : 'bg-white border-slate-200 text-slate-600'}`}>
              {copied ? <Check size={18} /> : <Share2 size={18} />} {copied ? 'Tersalin!' : 'Bagikan Link'}
            </button>
          )}
          {session?.status === 'waiting' && (
            <button disabled={isProcessing} onClick={startQuiz} className="flex-1 md:flex-none px-8 py-3 bg-green-600 disabled:opacity-50 text-white rounded-2xl font-black flex items-center justify-center gap-2">
              {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <Play size={20} fill="currentColor"/>} MULAI KUIS
            </button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isFinished ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-6`}>
        {!isFinished && (
          <div className="md:col-span-2 space-y-6">
            {/* TAMPILAN INDIKATOR WAKTU */}
            {session?.status === 'started' && (
               <div className="bg-blue-600 text-white p-4 rounded-3xl flex items-center justify-between shadow-lg shadow-blue-600/20">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/20 rounded-xl"><Timer size={24} /></div>
                     <div>
                        <p className="text-xs font-bold uppercase opacity-80">Auto Next Dalam</p>
                        <p className="text-xl font-black">{countdown} Detik</p>
                     </div>
                  </div>
               </div>
            )}

            {/* KOTAK SOAL ADMIN */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-500 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Trophy size={120} /></div>
              <p className="text-[10px] font-black text-blue-500 mb-3 uppercase tracking-[0.2em]">Live Question:</p>
              <h2 className="text-2xl font-black text-slate-800 leading-tight">
                {session?.current_question_index !== undefined 
                  ? `${session.current_question_index + 1}. ${session.questions_data[session.current_question_index]?.question}`
                  : "Menunggu Peserta Bergabung..."
                }
              </h2>
            </div>
          </div>
        )}

        {/* --- PAPAN SKOR TAMPILAN FULLSCREEN / INFOCUS --- */}
        <div 
          ref={scoreboardRef} 
          className={`bg-white transition-all overflow-y-auto ${
            isFullscreen 
              ? 'p-8 md:p-16 w-full h-screen fixed inset-0 z-50 bg-slate-50' 
              : `p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit ${isFinished ? 'max-w-5xl mx-auto w-full' : ''}`
          }`}
        >
          {/* Header Papan Skor + Tombol Proyektor */}
          <div className={`flex justify-between items-center ${isFullscreen ? 'mb-10' : 'mb-6'}`}>
            <h2 className={`${isFullscreen ? 'text-4xl' : 'text-lg'} font-black flex items-center gap-3 text-slate-800`}>
              {isFinished ? <Award className={`${isFullscreen ? 'w-12 h-12' : 'w-6 h-6'} text-yellow-500`} /> : <Trophy className={`${isFullscreen ? 'w-12 h-12' : 'w-6 h-6'} text-yellow-500`} />} 
              {isFinished ? "Hasil Akhir Kuis" : "Papan Skor Live"}
            </h2>
            <button 
              onClick={toggleFullScreen} 
              className={`flex items-center gap-2 font-bold transition-all rounded-xl ${
                isFullscreen 
                  ? 'px-6 py-4 bg-red-100 text-red-600 hover:bg-red-200 text-xl' 
                  : 'p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm'
              }`}
            >
              {isFullscreen ? <><Minimize size={24}/> Tutup Proyektor</> : <><Maximize size={18}/> Mode Proyektor</>}
            </button>
          </div>

          {/* Jika Fullscreen dan kuis berjalan, Tampilkan Soal agar Audiens bisa ikut membaca! */}
          {isFullscreen && !isFinished && session?.status === 'started' && (
            <div className="mb-10 p-8 bg-blue-600 text-white rounded-[2.5rem] shadow-xl text-center">
              <p className="text-sm font-black text-blue-200 mb-2 uppercase tracking-widest">Pertanyaan Saat Ini</p>
              <h2 className="text-4xl md:text-5xl font-black leading-tight max-w-5xl mx-auto">
                 {session.questions_data[session.current_question_index]?.question}
              </h2>
            </div>
          )}

          {/* List Peserta */}
          <div className="space-y-4 max-w-5xl mx-auto pb-20">
            <AnimatePresence>
              {participants.map((p, idx) => (
                <motion.div 
                  key={p.id} 
                  layout 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex justify-between items-center rounded-[2rem] shadow-sm ${
                    isFullscreen ? 'p-6 mb-4' : 'p-4 mb-3'
                  } ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 transform scale-[1.02]' : 
                    idx === 1 ? 'bg-slate-50 border-2 border-slate-200' :
                    idx === 2 ? 'bg-orange-50 border-2 border-orange-200/50' :
                    'bg-white border border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center justify-center font-black rounded-2xl shadow-sm ${
                      isFullscreen ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-sm'
                    } ${
                      idx === 0 ? 'bg-yellow-400 text-white' : 
                      idx === 1 ? 'bg-slate-300 text-slate-700' :
                      idx === 2 ? 'bg-orange-300 text-white' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={`font-black text-slate-700 tracking-tight ${isFullscreen ? 'text-3xl' : 'text-lg'}`}>
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-black block leading-none ${isFullscreen ? 'text-5xl' : 'text-2xl'} ${idx === 0 ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {p.score}
                    </span>
                    <span className={`font-black uppercase tracking-widest ${isFullscreen ? 'text-sm mt-2 text-slate-500' : 'text-[10px] text-slate-400'}`}>
                      Points
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
        </div>
      </div>
    </div>
  );
}