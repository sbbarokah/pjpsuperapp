// tsx:app/(admin)/elearning/quiz/control/[id]/page.tsx
"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Share2, Play, Users, Trophy, ChevronRight, CheckCircle } from "lucide-react";

export default function QuizControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [participants, setParticipants] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();

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

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">{session?.title}</h1>
          <p className="text-slate-500 font-medium">Status: <span className="text-blue-600 uppercase font-bold">{session?.status}</span></p>
        </div>
        <div className="flex gap-3">
          {session?.status === 'waiting' ? (
            <button onClick={startQuiz} className="px-8 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg flex items-center gap-2">
              <Play size={20}/> Mulai Kuis
            </button>
          ) : session?.status === 'started' && (
            <button onClick={nextQuestion} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2">
              Lanjut Soal <ChevronRight size={20}/>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Soal Saat Ini */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-blue-500 shadow-sm">
                <p className="text-xs font-bold text-blue-500 mb-2 uppercase">Sedang Berlangsung:</p>
                <h2 className="text-xl font-bold">
                    {session?.status === 'started' 
                        ? `Soal ke-${session.current_question_index + 1}: ${session.questions_data[session.current_question_index]?.question}`
                        : session?.status === 'finished' ? "Kuis Selesai" : "Menunggu Peserta..."
                    }
                </h2>
            </div>

            {/* List Peserta */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users className="text-blue-500" /> Peserta Terdaftar ({participants.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {participants.map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl font-bold text-slate-700 border border-slate-200">
                        {p.name}
                    </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Papan Skor
          </h2>
          <div className="space-y-3">
            {participants.map((p, idx) => (
              <div key={p.id} className={`flex justify-between items-center p-3 rounded-2xl ${idx === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold">{idx + 1}</span>
                    <span className="font-bold text-sm truncate max-w-[100px]">{p.name}</span>
                </div>
                <span className="font-black text-blue-600">{p.score} <span className="text-[10px]">pts</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}