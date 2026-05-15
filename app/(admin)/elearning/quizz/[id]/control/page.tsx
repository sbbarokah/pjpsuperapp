// tsx:app/(admin)/elearning/quiz/control/[id]/page.tsx
"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Share2, Play, Users, Trophy } from "lucide-react";

export default function QuizControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [participants, setParticipants] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. Ambil data awal
    fetchData();

    // 2. Subscribe ke Realtime Peserta Baru
    const channel = supabase
      .channel('quiz_room')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'quiz_participants',
        filter: `session_id=eq.${id}` 
      }, (payload) => {
        fetchData(); // Refresh list jika ada perubahan
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
    await supabase.from("quiz_sessions").update({ status: 'started' }).eq("id", id);
    alert("Kuis Dimulai! Layar peserta akan otomatis berubah.");
  };

  const copyLink = () => {
    const link = `${window.location.origin}/quiz/join/${id}`;
    navigator.clipboard.writeText(link);
    alert("Link Pendaftaran disalin!");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">{session?.title}</h1>
          <p className="text-slate-500 font-medium">Status: <span className="text-orange-500 uppercase">{session?.status}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={copyLink} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2 font-bold">
            <Share2 size={20}/> Share Link
          </button>
          {session?.status === 'waiting' && (
            <button onClick={startQuiz} className="px-6 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg flex items-center gap-2">
              <Play size={20}/> Mulai Kuis
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Peserta Terdaftar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="text-blue-500" /> Peserta ({participants.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {participants.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-xl font-bold text-slate-700 animate-in fade-in zoom-in">
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Skor Sementara
          </h2>
          <div className="space-y-2">
            {participants.map((p, idx) => (
              <div key={p.id} className="flex justify-between p-3 border-b last:border-0">
                <span className="font-bold">{idx + 1}. {p.name}</span>
                <span className="font-black text-blue-600">{p.score} Pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}