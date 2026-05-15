// tsx:app/(public)/quiz/join/[id]/page.tsx
"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Rocket, Loader2, Timer, CheckCircle, XCircle, Trophy } from "lucide-react";

export default function ParticipantQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  
  const [step, setStep] = useState<'register' | 'waiting' | 'play' | 'result' | 'finished'>('register');
  const [name, setName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [session, setSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // 1. Ambil data sesi awal
    supabase.from("quiz_sessions").select("*").eq("id", id).single().then(({ data }) => {
        setSession(data);
        if (data.status === 'started') setStep('play');
    });

    // 2. Subscribe ke Realtime Sesi (Untuk ganti soal atau status)
    const sessChannel = supabase
      .channel('quiz_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${id}` }, (payload) => {
        const newData = payload.new;
        setSession(newData);
        
        if (newData.status === 'started') {
          setStep('play');
          setHasAnswered(false); // Reset status jawaban untuk soal baru
          setTimeLeft(newData.duration_per_question);
          startLocalTimer(newData.duration_per_question);
        }
        if (newData.status === 'finished') setStep('finished');
      })
      .subscribe();

    return () => { 
        supabase.removeChannel(sessChannel); 
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const startLocalTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleJoin = async () => {
    if (!name) return;
    const { data } = await supabase.from("quiz_participants").insert({ session_id: id, name: name }).select().single();
    setParticipantId(data.id);
    setStep('waiting');
  };

  const submitAnswer = async (points: number) => {
    if (hasAnswered || timeLeft === 0) return;
    
    setHasAnswered(true);
    setIsCorrect(points > 0);
    
    if (points > 0) {
      // Hitung skor berdasarkan sisa waktu (bonus kecepatan)
      const finalScore = points + timeLeft; 
      await supabase.rpc('increment_participant_score', { 
          p_id: participantId, 
          p_increment: finalScore 
      });
    }
    setStep('result');
  };

  if (step === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 font-sans">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600"><Rocket size={40} /></div>
          <h1 className="text-2xl font-black mb-2">Siap untuk Kuis?</h1>
          <p className="text-slate-500 mb-8 font-medium">Masukkan nama Anda untuk bergabung</p>
          <input type="text" placeholder="Nama Panggilan" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-100 border-none outline-none font-bold text-center text-xl mb-6 focus:ring-4 ring-blue-200 transition-all"/>
          <button onClick={handleJoin} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all">GABUNG SEKARANG</button>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 text-center text-white font-sans">
        <div className="space-y-6">
          <Loader2 size={64} className="animate-spin mx-auto opacity-50" />
          <h1 className="text-4xl font-black italic tracking-tighter">STANDBY...</h1>
          <p className="text-xl font-medium opacity-80">Menunggu Admin memulai kuis.</p>
          <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20">
             <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Peserta</p>
             <p className="text-2xl font-black">{name}</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'play') {
    const currentQ = session.questions_data[session.current_question_index];
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Progress & Timer */}
        <div className="p-4 flex items-center justify-between bg-white border-b">
          <span className="font-bold text-slate-500">Soal {session.current_question_index + 1} / {session.questions_data.length}</span>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full font-black">
            <Timer size={18} /> {timeLeft}s
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-12 max-w-3xl leading-tight">
                {currentQ.question}
            </h2>
            
            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                {currentQ.options.map((opt: any, idx: number) => (
                    <button 
                        key={idx}
                        onClick={() => submitAnswer(opt.points || 0)}
                        className={`p-6 rounded-3xl text-left border-b-4 transition-all active:translate-y-1 flex items-center gap-4 group
                            ${idx === 0 ? 'bg-red-500 border-red-700 text-white' : 
                              idx === 1 ? 'bg-blue-500 border-blue-700 text-white' : 
                              idx === 2 ? 'bg-yellow-500 border-yellow-700 text-white' : 
                              'bg-green-500 border-green-700 text-white'}`}
                    >
                        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl">{String.fromCharCode(65 + idx)}</span>
                        <span className="text-xl font-bold">{opt.text || opt.teks}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
      return (
        <div className={`min-h-screen flex items-center justify-center p-6 text-white font-sans ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="text-center space-y-6">
                {isCorrect ? (
                    <div className="animate-bounce-short"><CheckCircle size={100} className="mx-auto" /></div>
                ) : (
                    <div className="animate-shake"><XCircle size={100} className="mx-auto" /></div>
                )}
                <h1 className="text-5xl font-black uppercase italic tracking-tighter">
                    {isCorrect ? 'BENAR!' : 'SALAH!'}
                </h1>
                <p className="text-xl font-bold opacity-80">Menunggu soal selanjutnya dari Admin...</p>
            </div>
        </div>
      )
  }

  if (step === 'finished') {
    return (
        <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 text-white font-sans">
            <div className="text-center space-y-8">
                <Trophy size={120} className="mx-auto text-yellow-300 animate-pulse" />
                <h1 className="text-4xl font-black uppercase">KUIS SELESAI!</h1>
                <p className="text-2xl font-medium">Terima kasih telah berpartisipasi, {name}.</p>
                <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-black hover:bg-slate-100 transition-all">KELUAR</button>
            </div>
        </div>
    )
  }

  return null;
}