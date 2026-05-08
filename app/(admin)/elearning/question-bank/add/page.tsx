"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Save, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// --- TIPE DATA ---
type PilihanJawaban = {
  id: string;
  teks: string;
  poin: number;
};

export default function QuestionBankForm() {
  const router = useRouter();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // State Data Master
  const [materialCategories, setMaterialCategories] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // State Formulir Utama
  const [formData, setFormData] = useState({
    category_id: "",
    material_id: "",
    pertanyaan: "",
    pembahasan: "",
    level_kesulitan: "medium" // Default ke 'medium' (bhs inggris sesuai DB)
  });

  // State untuk Pilihan Jawaban (Default 4 pilihan: A, B, C, D)
  const [options, setOptions] = useState<PilihanJawaban[]>([
    { id: crypto.randomUUID(), teks: "", poin: 0 },
    { id: crypto.randomUUID(), teks: "", poin: 0 },
    { id: crypto.randomUUID(), teks: "", poin: 0 },
    { id: crypto.randomUUID(), teks: "", poin: 0 },
  ]);

  // Fetch Kategori & Materi saat komponen dimuat
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingMaster(true);
      
      const [catRes, matRes] = await Promise.all([
        supabase.from('material_category').select('id, name').order('name'),
        supabase.from('material').select('id, material_name, material_category_id').order('material_name')
      ]);

      if (catRes.data) setMaterialCategories(catRes.data);
      if (matRes.data) setAllMaterials(matRes.data);
      
      setIsLoadingMaster(false);
    };

    fetchMasterData();
  }, [supabase]);

  // Filter Materi berdasarkan Kategori yang dipilih
  const filteredMaterials = useMemo(() => {
    if (!formData.category_id) return [];
    return allMaterials.filter(m => String(m.material_category_id) === String(formData.category_id));
  }, [formData.category_id, allMaterials]);


  // Handle Input Dasar
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset materi jika kategori berubah
      if (name === "category_id") newData.material_id = "";
      return newData;
    });
  };

  // Handle Input Pilihan Jawaban
  const handleOptionChange = (id: string, field: keyof PilihanJawaban, value: string | number) => {
    setOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const addOption = () => {
    setOptions(prev => [...prev, { id: crypto.randomUUID(), teks: "", poin: 0 }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      alert("Minimal harus ada 2 pilihan jawaban.");
      return;
    }
    setOptions(prev => prev.filter(opt => opt.id !== id));
  };

  // Set otomatis satu jawaban bernilai poin penuh (misal: 10) dan sisanya 0
  const setCorrectAnswer = (id: string) => {
    setOptions(prev => prev.map(opt => ({
      ...opt,
      poin: opt.id === id ? 5 : 0
    })));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Validasi Poin
    const totalPoints = options.reduce((acc, opt) => acc + Number(opt.poin), 0);
    if (totalPoints === 0) {
      setErrorMsg("Tentukan minimal satu jawaban yang memiliki poin > 0");
      setIsSubmitting(false);
      return;
    }

    try {
      // Ambil user ID untuk kolom created_by
      const { data: { user } } = await supabase.auth.getUser();

      // Mapping ke Skema Supabase berbahasa Inggris
      const payload = {
        category_id: Number(formData.category_id),
        material_id: formData.material_id,
        question: formData.pertanyaan,
        explanation: formData.pembahasan || null,
        difficulty: formData.level_kesulitan,
        options: options.map(opt => ({
          text: opt.teks,
          points: opt.poin
        })),
        created_by: user?.id || null
      };

      const { error } = await supabase.from('question_bank').insert(payload);

      if (error) throw error;

      setSuccessMsg("Soal berhasil ditambahkan ke Bank Soal!");
      
      // Reset Form untuk input selanjutnya
      setFormData({
        category_id: formData.category_id, // Pertahankan kategori dan materi untuk entry borongan
        material_id: formData.material_id,
        pertanyaan: "",
        pembahasan: "",
        level_kesulitan: "medium"
      });
      setOptions([
        { id: crypto.randomUUID(), teks: "", poin: 0 },
        { id: crypto.randomUUID(), teks: "", poin: 0 },
        { id: crypto.randomUUID(), teks: "", poin: 0 },
        { id: crypto.randomUUID(), teks: "", poin: 0 },
      ]);
      
      // Scroll ke atas
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      console.error("Error saving question:", error);
      setErrorMsg(error.message || "Gagal menyimpan soal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            Input Bank Soal
          </h1>
          <p className="text-slate-500 mt-2">Tambahkan soal baru beserta pilihan jawaban dan poin penilaian.</p>
        </div>
        <button 
          onClick={() => router.push('/elearning/question-bank')}
          className="text-sm font-bold text-slate-600 hover:text-blue-600"
        >
          &larr; Kembali ke Daftar
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-500 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        
        {/* SECTION 1: PEMETAAN MATERI */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <BookOpen size={18} className="text-slate-400"/> Klasifikasi Materi
            </h2>
            {isLoadingMaster && <Loader2 size={16} className="animate-spin text-blue-500" />}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kategori Materi</label>
              <select 
                required
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                disabled={isLoadingMaster}
                className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50"
              >
                <option value="">-- Pilih Kategori --</option>
                {materialCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Materi Spesifik</label>
              <select 
                required
                name="material_id"
                value={formData.material_id}
                onChange={handleInputChange}
                disabled={!formData.category_id || isLoadingMaster}
                className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50"
              >
                <option value="">-- Pilih Materi --</option>
                {filteredMaterials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: KONTEN SOAL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle size={18} className="text-slate-400"/> Detail Pertanyaan
             </h2>
             <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Level Kesulitan:</label>
                <select 
                  name="level_kesulitan" 
                  value={formData.level_kesulitan} 
                  onChange={handleInputChange}
                  className="p-1.5 text-sm rounded-lg border border-slate-300 bg-slate-50 outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                  <option value="HOTS">HOTS</option>
                </select>
             </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Teks Pertanyaan</label>
              <textarea 
                required
                name="pertanyaan"
                value={formData.pertanyaan}
                onChange={handleInputChange}
                rows={4}
                placeholder="Ketikkan soal di sini..."
                className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y"
              ></textarea>
            </div>

            {/* PILIHAN JAWABAN DINAMIS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700">Pilihan Jawaban & Poin</label>
                <button 
                  type="button" 
                  onClick={addOption}
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"
                >
                  <Plus size={14}/> Tambah Pilihan
                </button>
              </div>

              <div className="space-y-3">
                {options.map((opt, index) => {
                  const label = String.fromCharCode(65 + index); // A, B, C, D...
                  const isCorrect = opt.poin > 0;
                  
                  return (
                    <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'border-green-400 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
                      {/* Label A, B, C */}
                      <div className={`mt-2 font-black text-lg ${isCorrect ? 'text-green-600' : 'text-slate-400'}`}>
                        {label}.
                      </div>
                      
                      {/* Input Teks Jawaban */}
                      <div className="flex-1">
                        <textarea 
                          required
                          rows={2}
                          value={opt.teks}
                          onChange={(e) => handleOptionChange(opt.id, 'teks', e.target.value)}
                          placeholder={`Teks pilihan jawaban ${label}...`}
                          className="w-full p-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 transition-all resize-none"
                        ></textarea>
                      </div>

                      {/* Input Poin */}
                      <div className="w-24 shrink-0 flex flex-col gap-2">
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0"
                            value={opt.poin}
                            onChange={(e) => handleOptionChange(opt.id, 'poin', Number(e.target.value))}
                            className={`w-full p-2.5 pl-3 text-sm font-bold rounded-lg border outline-none transition-all ${isCorrect ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50'}`}
                            title="Poin jika menjawab ini"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">Poin</span>
                        </div>
                        
                        {/* Tombol Cepat Set Benar */}
                        <button 
                          type="button"
                          onClick={() => setCorrectAnswer(opt.id)}
                          className={`text-[10px] font-bold py-1 rounded border transition-colors ${isCorrect ? 'bg-green-500 text-white border-green-600' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}
                        >
                          {isCorrect ? 'Jawaban Benar' : 'Set Benar (5)'}
                        </button>
                      </div>

                      {/* Tombol Hapus Pilihan */}
                      <button 
                        type="button" 
                        onClick={() => removeOption(opt.id)}
                        className="mt-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Pilihan"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                <AlertCircle size={14}/> Nilai poin bisa dikustomisasi. Anda bisa memberikan poin sebagian (misal: 5) untuk jawaban yang mendekati benar.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: PEMBAHASAN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
             <CheckCircle2 size={18} className="text-slate-400"/> Pembahasan (Opsional)
          </h2>
          <textarea 
            name="pembahasan"
            value={formData.pembahasan}
            onChange={handleInputChange}
            rows={3}
            placeholder="Jelaskan mengapa jawaban tersebut benar. Ini akan dimunculkan setelah user menjawab..."
            className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y"
          ></textarea>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button 
            type="button" 
            onClick={() => router.push('/elearning/question-bank')}
            className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-all"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || isLoadingMaster}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-black shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
            {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
          </button>
        </div>

      </form>
    </div>
  );
}