// tsx:app/(public)/quiz/join/[id]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Rocket, Loader2 } from "lucide-react";

export default function ParticipantQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  
  const [step, setStep] = useState<'register' | 'waiting' | 'play' | 'finished'>('register');
  const [name, setName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Subscribe ke status sesi kuis
    const sessChannel = supabase
      .channel('quiz_status')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'quiz_sessions',
        filter: `id=eq.${id}` 
      }, (payload) => {
        if (payload.new.status === 'started') setStep('play');
        if (payload.new.status === 'finished') setStep('finished');
      })
      .subscribe();

    return () => { supabase.removeChannel(sessChannel); };
  }, [id]);

  const handleJoin = async () => {
    if (!name) return;
    const { data } = await supabase
      .from("quiz_participants")
      .insert({ session_id: id, name: name })
      .select().single();
    
    setParticipantId(data.id);
    setStep('waiting');
  };

  if (step === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Rocket size={40} />
          </div>
          <h1 className="text-2xl font-black mb-2">Siap untuk Kuis?</h1>
          <p className="text-slate-500 mb-8 font-medium">Masukkan nama Anda untuk bergabung</p>
          <input 
            type="text" 
            placeholder="Nama Panggilan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-100 border-none outline-none font-bold text-center text-xl mb-6"
          />
          <button onClick={handleJoin} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all">
            GABUNG SEKARANG
          </button>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 text-center text-white">
        <div className="space-y-6">
          <Loader2 size={64} className="animate-spin mx-auto opacity-50" />
          <h1 className="text-3xl font-black italic">STANDBY...</h1>
          <p className="text-xl font-medium opacity-80">Menunggu Admin memulai kuis.</p>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
             <p className="text-sm font-bold uppercase tracking-widest">Terdaftar Sebagai</p>
             <p className="text-2xl font-black">{name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       {/* Logika Komponen Pengerjaan Soal (Timer & Opsi) ditaruh di sini */}
       <h1 className="text-2xl font-black">SOAL MUNCUL DI SINI...</h1>
    </div>
  );
}