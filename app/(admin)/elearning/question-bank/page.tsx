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
  Wand2,
  Layers,
  ShoppingCart, // Ikon keranjang
  XCircle, // Ikon hapus dari keranjang
  Rocket,
  Printer,
  FileText,
  Database,
  HelpCircle,
  AlignLeft,
  ChevronRight,
  ChevronLeft,
  RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client"; 
import Swal from "sweetalert2";

// Import Redux Hooks & Actions
import { useDispatch, useSelector } from "react-redux";
import { IRootState } from "@/store/store";
import { toggleCartItem } from "@/store/qPackageSlice";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  question_type: 'pilihan_ganda' | 'uraian' | 'esai';
  explanation?: string | null;
  options: { text: string; points: number }[];
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
  const [selectedType, setSelectedType] = useState<string>("");

  const [counts, setCounts] = useState({
    total: 0,
    pilihan_ganda: 0,
    uraian: 0,
    esai: 0
  });

  // State Navigasi Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalFilteredQuestions, setTotalFilteredQuestions] = useState<number>(0);

  // State Loading Kontrol
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(true);

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

      if (!qError && qData) setQuestions(qData as Question[]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoadingQuestions(false);
      setLoadingMaster(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const handleResetFilters = () => {
    setSelectedClass("");
    setSelectedCategory("");
    setSelectedMaterial("");
    setSelectedType("");
    setItemsPerPage(10); // Reset ke ukuran default 10
    setCurrentPage(1);
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedCategory, selectedMaterial, selectedType]);

  // 4. Utama: Efek Sinkronisasi Query Data Soal, Perhitungan Counts, dan Pagination Range
  useEffect(() => {
    const fetchQuestionsAndCounts = async () => {
      setLoadingQuestions(true);
      setLoadingCounts(true);
      try {
        // A. Fungsi Helper untuk menghitung jumlah soal di DB secara efisien (menggunakan head: true)
        const getDbCount = async (type?: string) => {
          let query = supabase.from('question_bank').select('*', { count: 'exact', head: true });
          if (selectedClass) query = query.eq('category_id', selectedClass);
          if (selectedCategory) query = query.eq('material_category_id', selectedCategory);
          if (selectedMaterial) query = query.eq('material_id', selectedMaterial);
          if (type) query = query.eq('question_type', type);
          
          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        };

        // Mengambil hitungan grup secara paralel berdasarkan filter aktif saat ini
        const [total, pg, ur, es] = await Promise.all([
          getDbCount(),
          getDbCount('pilihan_ganda'),
          getDbCount('uraian'),
          getDbCount('esai')
        ]);

        setCounts({
          total,
          pilihan_ganda: pg,
          uraian: ur,
          esai: es
        });
        setTotalFilteredQuestions(total);
        setLoadingCounts(false);

        // B. Tarik data soal ber-pagination menggunakan range pembatas
        let query = supabase
          .from('question_bank')
          .select(`*, category (name), material_category (name), material (material_name)`)
          .order('created_at', { ascending: false });

        if (selectedClass) query = query.eq('category_id', selectedClass);
        if (selectedCategory) query = query.eq('material_category_id', selectedCategory);
        if (selectedMaterial) query = query.eq('material_id', selectedMaterial);
        if (selectedType) query = query.eq('question_type', selectedType);

        // Hitung batas range pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (error) throw error;
        setQuestions(data as Question[]);

      } catch (err) {
        console.error("Gagal sinkronisasi data bank soal:", err);
      } finally {
        setLoadingQuestions(false);
        setLoadingCounts(false);
      }
    };

    fetchQuestionsAndCounts();
  }, [selectedClass, selectedCategory, selectedMaterial, selectedType, currentPage, itemsPerPage]);


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

  // --- CALCULATION PAGINATION ---
  const totalPages = Math.ceil(totalFilteredQuestions / itemsPerPage) || 1;

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

  // Render Badge Jenis Soal (Pilihan Ganda, Uraian, Esai)
  const renderTypeBadge = (type: string) => {
    const styles: Record<string, { label: string; class: string }> = {
      pilihan_ganda: { label: "Pilihan Ganda", class: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400" },
      uraian: { label: "Uraian Singkat", class: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400" },
      esai: { label: "Esai Bebas", class: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400" }
    };
    const current = styles[type] || styles.pilihan_ganda;
    return (
      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md border ${current.class}`}>
        {current.label}
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

        {/* SECTION: STATISTIK JUMLAH SOAL YANG TERSEDIA (DIPENGARUHI FILTER AKTIF) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Semua Format", value: counts.total, icon: Database, color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100/55 dark:bg-slate-700" },
            { label: "Pilihan Ganda", value: counts.pilihan_ganda, icon: HelpCircle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-950/20" },
            { label: "Uraian Singkat", value: counts.uraian, icon: FileText, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-950/20" },
            { label: "Esai Bebas", value: counts.esai, icon: AlignLeft, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50/50 dark:bg-purple-950/20" },
          ].map((card, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3 overflow-hidden relative"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{card.label}</span>
                {loadingCounts ? (
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mt-1" />
                ) : (
                  <span className="text-3xl font-black text-slate-800 dark:text-white block mt-0.5">{card.value}</span>
                )}
              </div>
              <div className={cn("p-3.5 rounded-2xl shrink-0", card.bg, card.color)}>
                <card.icon size={20} />
              </div>
              {/* Status Filter Indicator */}
              {(selectedClass || selectedCategory || selectedMaterial) && (
                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-blue-500" title="Filter aktif diterapkan" />
              )}
            </div>
          ))}
        </div>

        {/* FILTER SECTION (TERMASUK FILTER JENIS SOAL) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter 1: Kelas */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase flex items-center gap-1.5"><Layers size={14}/> Kelas</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none text-sm font-bold focus:border-blue-500 transition-all">
              <option value="">-- Semua Kelas --</option>
              {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {/* Filter 2: Bidang / Kategori Studi */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase flex items-center gap-1.5"><Filter size={14}/> Kategori</label>
            <select value={selectedCategory} onChange={(e) => {setSelectedCategory(e.target.value); setSelectedMaterial("");}} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none text-sm font-bold focus:border-blue-500 transition-all">
              <option value="">-- Semua Kategori --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {/* Filter 3: Materi Spesifik */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase flex items-center gap-1.5"><Search size={14}/> Materi</label>
            <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)} disabled={!selectedCategory || loadingMaterials} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none text-sm font-bold focus:border-blue-500 transition-all disabled:opacity-50">
              <option value="">-- Pilih Materi --</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
            </select>
          </div>
          {/* Filter 4: Jenis Soal */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase flex items-center gap-1.5"><FileText size={14}/> Jenis Soal</label>
            <div className="flex gap-2">
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="flex-1 p-3 rounded-xl border border-slate-250 dark:border-slate-650 bg-slate-50 dark:bg-slate-700 dark:text-white outline-none text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="">-- Semua Jenis --</option>
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="uraian">Uraian Singkat</option>
                <option value="esai">Esai Bebas</option>
              </select>
              
              {/* Tombol Refresh / Reset ketika ada filter yang aktif */}
              {(selectedClass || selectedCategory || selectedMaterial || selectedType) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 transition-all flex items-center justify-center shrink-0 animate-in fade-in zoom-in duration-200"
                  title="Reset Semua Filter"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
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
                const qType = q.question_type || "pilihan_ganda";

                return (
                  <div key={q.id} className={`group bg-white dark:bg-slate-800 p-6 rounded-2xl border transition-all shadow-sm flex gap-4 ${isSelected ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                    
                    {/* TOGGLE CART BUTTON */}
                    <button 
                      onClick={() => handleToggleCart(q)}
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 text-white shadow-red-200' : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'}`}
                      title={isSelected ? "Hapus dari Paket" : "Tambah ke Paket"}
                    >
                      {isSelected ? <XCircle size={20} /> : <ShoppingCart size={20} />}
                    </button>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {renderTypeBadge(qType)}
                        {renderDifficultyBadge(q.difficulty)}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {q.category?.name || "Kelas"} • {q.material_category?.name || "Kategori"} • {q.material?.material_name || "Materi"}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-black text-slate-800 dark:text-white leading-relaxed">
                        {q.question}
                      </h3>
                      
                      {/* PREVIEW KONTEN CARD BERDASARKAN QUESTION_TYPE */}
                      {qType === "pilihan_ganda" && q.options && q.options.length > 0 && (
                        /* Layout Pilihan Ganda: Grid Pilihan Jawaban dengan highlight Kunci */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-xs">
                          {q.options.map((opt, idx) => {
                            const isCorrect = Number(opt.points) > 0;
                            return (
                              <div 
                                key={idx} 
                                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                  isCorrect 
                                    ? 'bg-green-50 border-green-300 text-green-800 font-bold dark:bg-green-950/20 dark:text-green-400' 
                                    : 'bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                                  isCorrect ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="truncate">{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {qType === "uraian" && q.options && q.options[0] && (
                        /* Layout Uraian Singkat: Badge Kunci Jawaban Singkat */
                        <div className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-bold">
                            <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-black uppercase">Kunci Singkat</span>
                            <span>{q.options[0].text}</span>
                          </div>
                          <span className="text-[10px] font-black text-amber-700 uppercase bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                            {q.options[0].points} Poin Maksimal
                          </span>
                        </div>
                      )}

                      {qType === "esai" && q.options && q.options[0] && (
                        /* Layout Esai Bebas: Banner Rubrik Penilaian / Pedoman Penskoran */
                        <div className="mt-3 p-3 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/20 rounded-xl text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-purple-100/55 dark:border-purple-900/20 pb-1.5">
                            <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-[10px] font-black uppercase">Pedoman Penskoran / Rubrik</span>
                            <span className="text-[10px] font-black text-purple-700 uppercase bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                              {q.options[0].points} Poin Maksimal
                            </span>
                          </div>
                          <p className="text-purple-900 dark:text-purple-300 font-medium italic leading-relaxed whitespace-pre-line">
                            {q.options[0].text}
                          </p>
                        </div>
                      )}

                      {/* TAMPILAN PEMBAHASAN SOAL (JIKA ADA) */}
                      {q.explanation && (
                        <div className="text-xs p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 animate-in fade-in duration-300">
                          <strong className="text-blue-800 dark:text-blue-300 block mb-1">Pembahasan:</strong>
                          <span className="text-blue-700 dark:text-blue-400 whitespace-pre-wrap">{q.explanation}</span>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-2 shrink-0 self-center">
                      <Link href={`/elearning/question-bank/${q.id}/edit`} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Soal"><Edit size={18}/></Link>
                      <button onClick={() => handleDelete(q.id, q.question)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Hapus Soal"><Trash2 size={18}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- SECTION: SISTEM NAVIGASI PAGINATION YANG RESPONSIF --- */}
        {totalFilteredQuestions > 0 && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Info Range & Selector Ukuran Data */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-450 text-center sm:text-left">
                Menampilkan <span className="font-black text-slate-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-black text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, totalFilteredQuestions)}</span> dari <span className="font-black text-slate-850 dark:text-slate-200">{totalFilteredQuestions}</span> soal terdaftar
              </span>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="p-1.5 px-2.5 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Halaman Kontrol */}
            <div className="flex items-center gap-1.5 justify-center w-full md:w-auto">
              <button
                disabled={currentPage === 1 || loadingQuestions}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-750 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Tampilkan nomor-nomor halaman */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Logika menyederhanakan deretan nomor halaman jika terlalu panjang
                const isNearCurrent = Math.abs(currentPage - pageNum) <= 1;
                const isEdge = pageNum === 1 || pageNum === totalPages;

                if (!isNearCurrent && !isEdge) {
                  // Munculkan elipsis pembatas
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-xs text-slate-455 px-1 font-bold">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loadingQuestions}
                    className={cn(
                      "w-10 h-10 rounded-xl text-xs font-black transition-all",
                      currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                        : "border border-slate-150 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages || loadingQuestions}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-750 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}