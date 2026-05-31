"use client";

import React, { useState, useMemo, useEffect, use } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  Sparkles,
  AlignLeftIcon,
  FileText,
  Layers,
  ArrowLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type PilihanJawaban = {
  id: string;
  teks: string;
  poin: number;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const questionId = resolvedParams.id;

  const router = useRouter();
  const supabase = createClient();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // State Data Master
  const [classesData, setClassesData] = useState<any[]>([]); // Data Kelas (category)
  const [materialCategories, setMaterialCategories] = useState<any[]>([]); // Data Kategori Materi
  const [allMaterials, setAllMaterials] = useState<any[]>([]); // Data Materi

  // State Formulir Utama
  const [formData, setFormData] = useState({
    category_id: "", // Kelas
    material_category_id: "", // Kategori Materi
    material_id: "", // Materi Spesifik
    pertanyaan: "",
    pembahasan: "",
    level_kesulitan: "medium",
    jenis_soal: "pilihan_ganda"
  });

  // State Tambahan untuk Jenis Soal Uraian & Esai
  const [kunciUraian, setKunciUraian] = useState("");
  const [rubrikEsai, setRubrikEsai] = useState("");
  const [poinMaksimal, setPoinMaksimal] = useState(5);

  // State untuk Pilihan Jawaban
  const [options, setOptions] = useState<PilihanJawaban[]>([]);

  // Mengambil Data Master & Data Soal yang akan di-Edit
  useEffect(() => {
    const fetchData = async () => {
      setIsInitializing(true);
      try {
        // 1. Fetch Data Master (Kelas, Kategori Materi, Materi)
        const [classRes, catRes, matRes] = await Promise.all([
          supabase.from('category').select('*').order('id'),
          supabase.from('material_category').select('*').order('name'),
          supabase.from('material').select('*').order('material_name')
        ]);

        if (classRes.data) setClassesData(classRes.data);
        if (catRes.data) setMaterialCategories(catRes.data);
        if (matRes.data) setAllMaterials(matRes.data);

        // 2. Fetch Data Soal Spesifik
        const { data: qData, error: qError } = await supabase
          .from('question_bank')
          .select('*')
          .eq('id', questionId)
          .single();

        if (qError) throw qError;

        if (qData) {
          const type = qData.question_type || "pilihan_ganda";

          setFormData({
            category_id: String(qData.category_id || ""),
            material_category_id: String(qData.material_category_id || ""),
            material_id: String(qData.material_id || ""),
            pertanyaan: qData.question,
            pembahasan: qData.explanation || "",
            level_kesulitan: qData.difficulty,
            jenis_soal: type
          });

          // Mapping format JSONB kembali ke State Form
          if (type === "pilihan_ganda") {
            const mappedOptions = qData.options.map((opt: any) => ({
              id: generateId(),
              teks: opt.text || opt.teks || "",
              poin: Number(opt.points ?? opt.poin ?? 0)
            }));
            setOptions(mappedOptions);
          } else if (type === "uraian") {
            setKunciUraian(qData.options[0]?.text || "");
            setPoinMaksimal(Number(qData.options[0]?.points || 5));
          } else if (type === "esai") {
            setRubrikEsai(qData.options[0]?.text || "");
            setPoinMaksimal(Number(qData.options[0]?.points || 5));
          }
        }

      } catch (err: any) {
        console.error("Gagal mengambil data soal:", err);
        setErrorMsg("Data soal tidak ditemukan atau gagal dimuat.");
      } finally {
        setIsInitializing(false);
      }
    };

    if (questionId) fetchData();
  }, [questionId, supabase]);

  // Filter Materi
  const filteredMaterials = useMemo(() => {
    if (!formData.material_category_id) return [];
    return allMaterials.filter(m => String(m.material_category_id) === String(formData.material_category_id));
  }, [formData.material_category_id, allMaterials]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset materi spesifik jika kategori materi berubah
      if (name === "material_category_id") newData.material_id = "";
      return newData;
    });
  };

  const handleOptionChange = (id: string, field: keyof PilihanJawaban, value: string | number) => {
    setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, [field]: value } : opt));
  };

  const addOption = () => {
    setOptions(prev => [...prev, { id: generateId(), teks: "", poin: 0 }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      setErrorMsg("Pilihan Ganda minimal harus memiliki 2 pilihan jawaban.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setOptions(prev => prev.filter(opt => opt.id !== id));
  };

  const setCorrectAnswer = (id: string) => {
    setOptions(prev => prev.map(opt => ({
      ...opt,
      poin: opt.id === id ? 5 : 0
    })));
  };

  // Submit Handler (Simpan Perubahan)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Jalankan validasi draf sesuai tipe soal yang aktif
    let optionsPayload: any[] = [];

    if (formData.jenis_soal === "pilihan_ganda") {
      const totalPoints = options.reduce((acc, opt) => acc + Number(opt.poin), 0);
      if (totalPoints === 0) {
        setErrorMsg("Tentukan minimal satu jawaban pilihan ganda yang memiliki poin > 0");
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      optionsPayload = options.map(opt => ({
        text: opt.teks,
        points: opt.poin
      }));
    } else if (formData.jenis_soal === "uraian") {
      if (!kunciUraian.trim()) {
        setErrorMsg("Harap isi kunci jawaban singkat untuk soal uraian.");
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      optionsPayload = [{
        text: kunciUraian.trim(),
        points: Number(poinMaksimal)
      }];
    } else if (formData.jenis_soal === "esai") {
      if (!rubrikEsai.trim()) {
        setErrorMsg("Harap isi pedoman penskoran/rubrik penilaian untuk soal esai.");
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      optionsPayload = [{
        text: rubrikEsai.trim(),
        points: Number(poinMaksimal)
      }];
    }

    try {
      // Petakan ke objek skema database Supabase
      const payload = {
        category_id: Number(formData.category_id),
        material_category_id: Number(formData.material_category_id),
        material_id: formData.material_id,
        question: formData.pertanyaan,
        explanation: formData.pembahasan || null,
        difficulty: formData.level_kesulitan,
        question_type: formData.jenis_soal,
        options: optionsPayload
      };

      const { error } = await supabase
        .from('question_bank')
        .update(payload)
        .eq('id', questionId);

      if (error) throw error;

      setSuccessMsg("Perubahan soal berhasil disimpan ke Bank Soal!");
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      console.error("Gagal menyimpan perubahan kuis:", error);
      setErrorMsg(error.message || "Gagal memperbarui data soal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="font-medium">Memuat data soal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/elearning/question-bank')}
            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-2xl transition-all border border-slate-150 dark:border-slate-700 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
              Edit Bank Soal
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium italic">Ubah draf soal, rincian materi, serta skema poin evaluasi.</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-green-500 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        
        {/* SECTION 1: PEMETAAN MATERI */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Layers size={18} className="text-slate-400"/> Klasifikasi Materi
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. KELAS */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kelas / Tingkat</label>
              <select 
                required
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full p-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">-- Pilih Kelas --</option>
                {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* 2. KATEGORI MATERI */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kategori Materi</label>
              <select 
                required
                name="material_category_id"
                value={formData.material_category_id}
                onChange={handleInputChange}
                className="w-full p-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">-- Pilih Kategori --</option>
                {materialCategories.map(mc => <option key={mc.id} value={mc.id}>{mc.name}</option>)}
              </select>
            </div>

            {/* 3. MATERI SPESIFIK */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Materi Spesifik</label>
              <select 
                required
                name="material_id"
                value={formData.material_id}
                onChange={handleInputChange}
                disabled={!formData.material_category_id}
                className="w-full p-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50"
              >
                <option value="">-- Pilih Materi --</option>
                {filteredMaterials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: SELEKTOR JENIS SOAL */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Format / Jenis Soal</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* OPSI 1: PILIHAN GANDA */}
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, jenis_soal: "pilihan_ganda" }));
                setErrorMsg("");
              }}
              className={cn(
                "p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all active:scale-98",
                formData.jenis_soal === "pilihan_ganda" 
                  ? "border-blue-600 bg-blue-50/20" 
                  : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200"
              )}
            >
              <div className={cn("p-3 rounded-xl", formData.jenis_soal === "pilihan_ganda" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 dark:bg-slate-700")}>
                <HelpCircle size={20} />
              </div>
              <div>
                <span className="font-black text-sm text-slate-800 dark:text-white block">Pilihan Ganda</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Penilaian otomatis dengan pilihan jawaban A-D.</span>
              </div>
            </button>

            {/* OPSI 2: URAIAN */}
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, jenis_soal: "uraian" }));
                setErrorMsg("");
              }}
              className={cn(
                "p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all active:scale-98",
                formData.jenis_soal === "uraian" 
                  ? "border-blue-600 bg-blue-50/20" 
                  : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200"
              )}
            >
              <div className={cn("p-3 rounded-xl", formData.jenis_soal === "uraian" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 dark:bg-slate-700")}>
                <FileText size={20} />
              </div>
              <div>
                <span className="font-black text-sm text-slate-800 dark:text-white block">Uraian Singkat</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Membutuhkan isian kata/kalimat kunci pendek.</span>
              </div>
            </button>

            {/* OPSI 3: ESAI */}
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, jenis_soal: "esai" }));
                setErrorMsg("");
              }}
              className={cn(
                "p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all active:scale-98",
                formData.jenis_soal === "esai" 
                  ? "border-blue-600 bg-blue-50/20" 
                  : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200"
              )}
            >
              <div className={cn("p-3 rounded-xl", formData.jenis_soal === "esai" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 dark:bg-slate-700")}>
                <AlignLeftIcon />
              </div>
              <div>
                <span className="font-black text-sm text-slate-800 dark:text-white block">Esai Bebas</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Analisis mendalam dengan kriteria rubrik penilaian.</span>
              </div>
            </button>

          </div>
        </div>

        {/* SECTION 3: PERTANYAAN & JAWABAN */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-700">
             <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-slate-400"/> Detail Pertanyaan
             </h2>
             <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Tingkat Kesulitan:</label>
                <select 
                  name="level_kesulitan" 
                  value={formData.level_kesulitan} 
                  onChange={handleInputChange}
                  className="p-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 outline-none focus:border-blue-500 font-semibold text-slate-800 dark:text-white"
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
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Teks Pertanyaan</label>
              <textarea 
                required
                name="pertanyaan"
                value={formData.pertanyaan}
                onChange={handleInputChange}
                rows={4}
                placeholder="Ketikkan soal di sini..."
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y"
              ></textarea>
            </div>

            {/* AREA INPUT JAWABAN KONDISIONAL BERDASARKAN JENIS SOAL */}
            {formData.jenis_soal === "pilihan_ganda" && (
              /* ================= 1. PILIHAN GANDA INPUTS ================= */
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pilihan Jawaban & Poin</label>
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
                      <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'border-green-400 bg-green-50/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
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
                            className="w-full p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 transition-all resize-none font-medium"
                          ></textarea>
                        </div>

                        {/* Input Poin */}
                        <div className="w-28 shrink-0 flex flex-col gap-2">
                          <div className="relative">
                            <input 
                              type="number" 
                              min="0"
                              value={opt.poin}
                              onChange={(e) => handleOptionChange(opt.id, 'poin', Number(e.target.value))}
                              className={`w-full p-2.5 pr-8 text-sm font-bold rounded-lg border outline-none transition-all ${isCorrect ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 dark:text-white'}`}
                              title="Poin jika menjawab ini"
                            />
                            <span className="absolute right-2.5 top-2.5 text-[10px] font-black uppercase text-slate-400">Poin</span>
                          </div>
                          
                          {/* Tombol Cepat Set Benar */}
                          <button 
                            type="button"
                            onClick={() => setCorrectAnswer(opt.id)}
                            className={`text-[10px] font-bold py-1.5 rounded-lg border transition-colors ${isCorrect ? 'bg-green-500 text-white border-green-600' : 'bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-300 border-slate-300 hover:bg-slate-50'}`}
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
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={14} className="text-blue-500" /> Nilai poin bisa dikustomisasi. Anda bisa memberikan poin sebagian (misal: 3) untuk jawaban yang mendekati benar.
                </p>
              </div>
            )}

            {formData.jenis_soal === "uraian" && (
              /* ================= 2. URAIAN SINGKAT INPUTS ================= */
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
                  <Sparkles size={16} className="text-blue-500" /> Atur Parameter Penilaian Uraian Singkat
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Kata Kunci / Kunci Jawaban Singkat</label>
                    <input 
                      type="text"
                      required
                      value={kunciUraian}
                      onChange={(e) => setKunciUraian(e.target.value)}
                      placeholder="Contoh: Kalimat thoyyibah, ikhlas, tauhid, rukun iman..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm font-semibold transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block text-center dark:text-slate-300">Poin Maksimal</label>
                    <input 
                      type="number"
                      min="1"
                      value={poinMaksimal}
                      onChange={(e) => setPoinMaksimal(Math.max(1, Number(e.target.value)))}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm font-black text-center transition-all"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Kata kunci di atas akan digunakan sistem untuk melakukan pencocokan (*string matching*) atau menjadi acuan utama bagi penguji saat mengoreksi jawaban peserta kuis secara manual.
                </p>
              </div>
            )}

            {formData.jenis_soal === "esai" && (
              /* ================= 3. ESAI BEBAS INPUTS ================= */
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm">
                  <Sparkles size={16} className="text-purple-500" /> Atur Parameter Penilaian Esai Bebas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Pedoman Penskoran / Rubrik Penilaian</label>
                    <textarea 
                      required
                      rows={3}
                      value={rubrikEsai}
                      onChange={(e) => setRubrikEsai(e.target.value)}
                      placeholder="Sebutkan syarat poin, contoh: Poin 5 jika menjelaskan rukun wudhu secara berurutan, poin 3 jika tidak berurutan, poin 0 jika salah..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm font-medium transition-all resize-y"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block text-center dark:text-slate-300">Poin Maksimal</label>
                    <input 
                      type="number"
                      min="1"
                      value={poinMaksimal}
                      onChange={(e) => setPoinMaksimal(Math.max(1, Number(e.target.value)))}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm font-black text-center transition-all"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Rubrik ini sangat penting sebagai panduan korektor (*examiner*) saat membaca dan menilai lembar esai terbuka milik peserta secara objektif.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* SECTION 4: PEMBAHASAN */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 flex items-center gap-2 dark:border-slate-700">
             <CheckCircle2 size={18} className="text-slate-400"/> Pembahasan (Opsional)
          </h2>
          <textarea 
            name="pembahasan"
            value={formData.pembahasan}
            onChange={handleInputChange}
            rows={3}
            placeholder="Jelaskan dasar hukum, dalil, atau logika mengapa jawaban tersebut benar. Keterangan ini akan dimunculkan setelah peserta menyelesaikan kuis..."
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y font-medium"
          ></textarea>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            type="button" 
            onClick={() => router.push('/elearning/question-bank')}
            className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-98"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-black shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan Soal"}
          </button>
        </div>

      </form>
    </div>
  );
}