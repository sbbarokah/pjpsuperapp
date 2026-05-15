// tsx:app/(admin)/elearning/quiz/create/page.tsx
"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IRootState } from "@/store/store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Play, Timer, ListOrdered, Share2 } from "lucide-react";

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
      router.push(`/admin/elearning/quiz/control/${data.id}`);
    } else {
      alert("Gagal membuat kuis");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100">
      <h1 className="text-2xl font-black mb-6">Konfigurasi Live Kuis</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-500 mb-2">JUMLAH SOAL TERPILIH</label>
          <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold flex items-center gap-3">
             <ListOrdered /> {cart.length} Soal dari Keranjang
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-500 mb-2">JUDUL KUIS</label>
          <input 
            type="text" 
            value={config.title}
            onChange={(e) => setFormData({...config, title: e.target.value})}
            className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">DURASI / SOAL (DETIK)</label>
            <div className="relative">
              <Timer className="absolute left-4 top-4 text-slate-400" size={20}/>
              <input 
                type="number" 
                value={config.duration}
                onChange={(e) => setFormData({...config, duration: parseInt(e.target.value)})}
                className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">JEDA ANTAR SOAL (DETIK)</label>
            <input 
              type="number" 
              value={config.interval}
              onChange={(e) => setFormData({...config, interval: parseInt(e.target.value)})}
              className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold"
            />
          </div>
        </div>

        <button 
          onClick={handleCreateSession}
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Memproses..." : <><Play /> Buka Panel Kontrol</>}
        </button>
      </div>
    </div>
  );
}