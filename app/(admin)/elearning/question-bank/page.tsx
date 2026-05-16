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
  AlertCircle,
  Wand2,
  Layers,
  ShoppingCart, // Ikon keranjang
  XCircle, // Ikon hapus dari keranjang
  Rocket,
  Printer
} from "lucide-react";
import { createClient } from "@/lib/supabase/client"; 
import Swal from "sweetalert2";

// Import Redux Hooks & Actions
import { useDispatch, useSelector } from "react-redux";
import { IRootState } from "@/store/store";
import { toggleCartItem } from "@/store/qPackageSlice";

// --- Tipe Data ---
interface CategoryData {
  id: number;
  name: string;
}

interface Material {
  id: string;
  material_category_id: number;
  material_name: string;
}

interface Question {
  id: string;
  category_id: number;
  material_category_id: number;
  material_id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'HOTS';
  options: { teks: string; text?: string; poin?: number; points?: number }[];
  category?: { name: string };
  material_category?: { name: string };
  material?: { material_name: string };
}

export default function QuestionBankListPage() {
  const supabase = createClient();
  const dispatch = useDispatch();

  // --- REDUX STATE ---
  const cart = useSelector((state: IRootState) => state.qPackage.cart);
  const cartIds = new Set(cart.map(item => item.id));

  // --- LOCAL STATE ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classesData, setClassesData] = useState<CategoryData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");

  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // 1. Initial Load: Ambil Data Master & 10 Soal Terbaru
  const fetchInitialData = async () => {
    setLoadingQuestions(true);
    setLoadingMaster(true);
    try {
      const [classRes, catRes] = await Promise.all([
        supabase.from('category').select('id, name').order('id'),
        supabase.from('material_category').select('id, name').order('name')
      ]);
      if (classRes.data) setClassesData(classRes.data);
      if (catRes.data) setCategories(catRes.data);

      const { data: qData, error: qError } = await supabase
        .from('question_bank')
        .select(`*, category (name), material_category (name), material (material_name)`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!qError && qData) setQuestions(qData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoadingQuestions(false);
      setLoadingMaster(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  // 2. Fetch Materi berdasarkan Kategori
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
        .select('id, material_name, material_category_id')
        .eq('material_category_id', selectedCategory)
        .order('material_name');
      if (!error && data) setMaterials(data as Material[]);
      setLoadingMaterials(false);
    };
    fetchMaterials();
  }, [selectedCategory]);

  // 3. Filter Query
  useEffect(() => {
    if (!selectedClass && !selectedCategory && !selectedMaterial && questions.length > 0) return;
    const fetchFilteredQuestions = async () => {
      setLoadingQuestions(true);
      let query = supabase
        .from('question_bank')
        .select(`*, category (name), material_category (name), material (material_name)`)
        .order('created_at', { ascending: false });

      if (selectedClass) query = query.eq('category_id', selectedClass);
      if (selectedCategory) query = query.eq('material_category_id', selectedCategory);
      if (selectedMaterial) query = query.eq('material_id', selectedMaterial);
      if (!selectedClass && !selectedCategory && !selectedMaterial) query = query.limit(10);

      const { data, error } = await query;
      if (!error && data) setQuestions(data);
      setLoadingQuestions(false);
    };
    fetchFilteredQuestions();
  }, [selectedClass, selectedCategory, selectedMaterial]); 

  // --- HANDLER: REDUX CART ---
  const handleToggleCart = (q: Question) => {
    dispatch(toggleCartItem({
      id: q.id,
      question: q.question,
      difficulty: q.difficulty,
      options: q.options
    }));
  };

  // --- HANDLER: DELETE ---
  const handleDelete = (id: string, questionText: string) => {
    const shortText = questionText.length > 40 ? questionText.substring(0, 40) + "..." : questionText;
    Swal.fire({
      title: "Hapus Soal?",
      text: `Soal "${shortText}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      customClass: { popup: 'dark:bg-boxdark dark:text-white' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('question_bank').delete().eq('id', id);
          if (error) throw error;
          setQuestions(prev => prev.filter(q => q.id !== id));
          Swal.fire("Terhapus!", "Soal berhasil dihapus.", "success");
        } catch (error: any) {
          Swal.fire("Gagal!", error.message, "error");
        }
      }
    });
  };

  // Render Badge
  const renderDifficultyBadge = (level: string) => {
    const styles: Record<string, string> = {
      easy: "bg-green-100 text-green-700 border-green-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      hard: "bg-orange-100 text-orange-700 border-orange-200",
      HOTS: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md border ${styles[level] || styles.medium}`}>
        {level === 'easy' ? 'Mudah' : level === 'medium' ? 'Sedang' : level === 'hard' ? 'Sulit' : 'HOTS'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans relative">
      
      {/* FLOATING ACTION BUTTON: KE HALAMAN PRINT */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col md:flex-row items-center gap-3 animate-in slide-in-from-bottom-5 duration-500">
          
          {/* Button 1: Live Kuis */}
          <a 
            href="/elearning/quizz/create"
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-4 rounded-full shadow-2xl transition-all active:scale-95 font-black text-sm whitespace-nowrap group"
          >
            <div className="p-1.5 bg-indigo-500 rounded-lg group-hover:rotate-12 transition-transform">
              <Rocket size={18} fill="currentColor" />
            </div>
            <span>BUAT KUIS LIVE</span>
          </a>

          {/* Button 2: Cetak Paket (Dengan Badge Counter) */}
          <a 
            href="/elearning/question-bank/print"
            className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-7 py-4 rounded-full shadow-2xl transition-all active:scale-95 font-black text-sm whitespace-nowrap group"
          >
            <div className="relative p-1.5 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
              <Printer size={18} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 font-bold">
                {cart.length}
              </span>
            </div>
            <span>CETAK PAKET UJIAN</span>
          </a>
          
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 pb-24">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <BookOpen className="text-blue-600" size={32}/>
              Bank Soal
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium italic">Pilih soal untuk dimasukkan ke keranjang ujian.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/elearning/question-bank/parse" className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
              <Wand2 size={18}/> Parse Soal
            </a>
            <a href="/elearning/question-bank/add" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
              <Plus size={20}/> Tambah Manual
            </a>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2"><Layers size={14}/> Kelas</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none text-sm">
              <option value="">-- Semua Kelas --</option>
              {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2"><Filter size={14}/> Kategori</label>
            <select value={selectedCategory} onChange={(e) => {setSelectedCategory(e.target.value); setSelectedMaterial("");}} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none text-sm">
              <option value="">-- Semua Kategori --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2"><Search size={14}/> Materi</label>
            <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)} disabled={!selectedCategory || loadingMaterials} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none text-sm disabled:opacity-50">
              <option value="">-- Pilih Materi --</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
            </select>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="space-y-4">
          {loadingQuestions ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Memuat data...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300">
               <p className="text-slate-500">Tidak ada soal ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q) => {
                const isSelected = cartIds.has(q.id);
                return (
                  <div key={q.id} className={`group bg-white dark:bg-slate-800 p-6 rounded-2xl border transition-all shadow-sm flex gap-4 ${isSelected ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                    
                    {/* TOGGLE CART BUTTON */}
                    <button 
                      onClick={() => handleToggleCart(q)}
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 text-white shadow-red-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                      title={isSelected ? "Hapus dari Paket" : "Tambah ke Paket"}
                    >
                      {isSelected ? <XCircle size={20} /> : <ShoppingCart size={20} />}
                    </button>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {renderDifficultyBadge(q.difficulty)}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {q.category?.name} • {q.material_category?.name} • {q.material?.material_name}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">
                        {q.question}
                      </h3>
                      
                      {/* Jawaban Singkat Preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-3 opacity-60 text-xs italic">
                        {q.options?.map((opt, idx) => (
                          <div key={idx} className={Number(opt.points ?? opt.poin ?? 0) > 0 ? 'text-green-600 font-bold' : ''}>
                            {String.fromCharCode(65 + idx)}. {opt.text || opt.teks}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-2 shrink-0 self-center">
                      <a href={`/elearning/question-bank/edit/${q.id}`} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit size={18}/></a>
                      <button onClick={() => handleDelete(q.id, q.question)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}