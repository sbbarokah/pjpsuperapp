"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Edit, 
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client"; 
import Swal from "sweetalert2";

// --- Tipe Data ---
interface Category {
  id: number;
  name: string;
}

interface Material {
  id: string;
  material_name: string;
}

interface Question {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'HOTS';
  options: { teks: string; text?: string; poin?: number; points?: number }[];
  material_category?: { name: string };
  material?: { material_name: string };
}

export default function QuestionBankListPage() {
  const supabase = createClient();

  // State Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // State Filter
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");

  // State UI
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // 1. Initial Load: Ambil 10 Soal Terbaru & Daftar Kategori
  const fetchInitialData = async () => {
    setLoadingQuestions(true);
    setLoadingCategories(true);

    try {
      const { data: catData, error: catError } = await supabase
        .from('material_category')
        .select('id, name')
        .order('name');
      
      if (!catError && catData) setCategories(catData);

      const { data: qData, error: qError } = await supabase
        .from('question_bank')
        .select(`
          *,
          material_category (name),
          material (material_name) 
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!qError && qData) setQuestions(qData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoadingQuestions(false);
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 2. Efek ketika Kategori Dipilih: Ambil Daftar Materi
  useEffect(() => {
    if (!selectedCategory) {
      setMaterials([]);
      setSelectedMaterial("");
      return;
    }

    const fetchMaterials = async () => {
      setLoadingMaterials(true);
      const { data, error } = await supabase
        .from('material')
        .select('id, material_name')
        .eq('material_category_id', selectedCategory)
        .order('material_name');
      
      if (!error && data) setMaterials(data);
      setLoadingMaterials(false);
    };

    fetchMaterials();
  }, [selectedCategory]);

  // 3. Efek ketika Kategori ATAU Materi Dipilih: Ambil Soal
  useEffect(() => {
    if (!selectedCategory && !selectedMaterial && questions.length > 0) return;

    const fetchFilteredQuestions = async () => {
      setLoadingQuestions(true);

      let query = supabase
        .from('question_bank')
        .select(`
          *,
          material_category (name),
          material (material_name)
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory) query = query.eq('category_id', selectedCategory);
      if (selectedMaterial) query = query.eq('material_id', selectedMaterial);
      if (!selectedCategory && !selectedMaterial) query = query.limit(10);

      const { data, error } = await query;
      
      if (!error && data) setQuestions(data);
      setLoadingQuestions(false);
    };

    fetchFilteredQuestions();
  }, [selectedCategory, selectedMaterial]); 

  // --- FITUR HAPUS SOAL ---
  const handleDelete = (id: string, questionText: string) => {
    // Potong teks jika terlalu panjang untuk notifikasi
    const shortText = questionText.length > 40 ? questionText.substring(0, 40) + "..." : questionText;

    Swal.fire({
      title: "Anda yakin?",
      text: `Anda akan menghapus soal "${shortText}". Aksi ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6", // Biru
      cancelButtonColor: "#d33", // Merah
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      customClass: {
        popup: 'dark:bg-boxdark dark:text-white',
        confirmButton: 'bg-primary text-white',
        cancelButton: 'bg-red-500 text-white'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase
            .from('question_bank')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Update State Lokal agar soal langsung hilang dari UI
          setQuestions(prev => prev.filter(q => q.id !== id));
          
          Swal.fire({
            title: "Terhapus!",
            text: "Soal berhasil dihapus.",
            icon: "success",
            customClass: {
              popup: 'dark:bg-boxdark dark:text-white',
              confirmButton: 'bg-primary text-white'
            }
          });
        } catch (error: any) {
          console.error("Error deleting question:", error);
          Swal.fire({
            title: "Gagal!",
            text: `Gagal menghapus soal: ${error.message}`,
            icon: "error",
            customClass: {
              popup: 'dark:bg-boxdark dark:text-white',
              confirmButton: 'bg-primary text-white'
            }
          });
        }
      }
    });
  };

  // Render Badge Kesulitan
  const renderDifficultyBadge = (level: string) => {
    const styles: Record<string, string> = {
      easy: "bg-green-100 text-green-700 border-green-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      hard: "bg-orange-100 text-orange-700 border-orange-200",
      HOTS: "bg-red-100 text-red-700 border-red-200",
    };
    const labels: Record<string, string> = {
      easy: "Mudah", medium: "Sedang", hard: "Sulit", HOTS: "HOTS"
    };

    return (
      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md border ${styles[level] || styles.medium}`}>
        {labels[level] || level}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <BookOpen className="text-blue-600" size={32}/>
              Bank Soal
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Kelola soal untuk kuis, ujian, dan cerdas cermat.</p>
          </div>
          
          <a 
            href="/elearning/question-bank/add" 
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-sm"
          >
            <Plus size={20}/> Tambah Soal
          </a>
        </div>

        {/* NOTIFIKASI */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} className="shrink-0"/> : <AlertCircle size={20} className="shrink-0"/>}
            <span className="font-bold text-sm">{message.text}</span>
          </div>
        )}

        {/* FILTER SECTION */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Filter size={14}/> Kategori Materi
            </label>
            <select 
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedMaterial("");
              }}
              disabled={loadingCategories}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50"
            >
              <option value="">-- Semua Kategori (10 Terbaru) --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Search size={14}/> Materi Spesifik
            </label>
            <select 
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              disabled={!selectedCategory || loadingMaterials}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50"
            >
              <option value="">-- Pilih Materi --</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
            </select>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-bold text-slate-700 dark:text-slate-300">
              {selectedMaterial ? "Semua Soal pada Materi Ini" : selectedCategory ? "Soal pada Kategori Ini" : "10 Soal Terbaru Dibuat"}
            </h2>
            <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">
              Total: {questions.length} Soal
            </span>
          </div>

          {loadingQuestions ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Memuat soal...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-600">
               <p className="text-slate-500 font-medium">Tidak ada soal yang ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderDifficultyBadge(q.difficulty)}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {q.material_category?.name} • {q.material?.material_name}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">
                        {q.question}
                      </h3>
                    </div>
                    
                    {/* --- FITUR EDIT & HAPUS --- */}
                    <div className="flex gap-2 shrink-0">
                      <a 
                        href={`/elearning/question-bank/${q.id}/edit`} 
                        className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 transition-colors" 
                        title="Edit Soal"
                      >
                        <Edit size={16}/>
                      </a>
                      <button 
                        onClick={() => handleDelete(q.id, q.question)}
                        className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 transition-colors" 
                        title="Hapus Soal"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>

                  {/* Tampilkan Pilihan Jawaban Singkat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    {q.options?.map((opt, idx) => {
                      const text = opt.text || opt.teks || "";
                      const points = Number(opt.points ?? opt.poin ?? 0);
                      const isCorrect = points > 0;
                      
                      return (
                        <div key={idx} className={`flex items-start gap-2 text-sm ${isCorrect ? 'text-green-700 dark:text-green-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                          <span className={`w-5 h-5 flex items-center justify-center shrink-0 rounded-full text-[10px] font-black ${isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 leading-snug">{text}</span>
                          {isCorrect && <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}