"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Wand2, Save, Trash2, CheckCircle2, AlertCircle, Loader2, Info, 
  Type,
  Layers
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const generateTempId = () => `temp-${Math.random().toString(36).substring(2, 11)}`;


export default function ParseQuestionClient() {
  const supabase = createClient();
  
  const [rawText, setRawText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  
  // State Master
  const [classesData, setClassesData] = useState<any[]>([]); // Data Kelas
  const [materialCategories, setMaterialCategories] = useState<any[]>([]); // Data Kategori Materi
  const [allMaterials, setAllMaterials] = useState<any[]>([]); // Data Materi
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  
  // State Filter Global (Untuk batch insert)
  const [globalClass, setGlobalClass] = useState("");
  const [globalCat, setGlobalCat] = useState("");
  const [globalMat, setGlobalMat] = useState("");

  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch Semua Data Master dari Supabase
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingMaster(true);
      try {
        const [classRes, catRes, matRes] = await Promise.all([
          supabase.from('category').select('*').order('id'),
          supabase.from('material_category').select('*').order('name'),
          supabase.from('material').select('*').order('material_name')
        ]);

        if (classRes.data) setClassesData(classRes.data);
        if (catRes.data) setMaterialCategories(catRes.data);
        if (matRes.data) setAllMaterials(matRes.data);
      } catch (error) {
        console.error("Gagal mengambil data master:", error);
      } finally {
        setIsLoadingMaster(false);
      }
    };
    fetchMasterData();
  }, [supabase]);

  // Filter Materi berdasarkan Kategori yang dipilih
  const filteredMaterials = useMemo(() => {
    if (!globalCat) return [];
    return allMaterials.filter(m => String(m.material_category_id) === String(globalCat));
  }, [globalCat, allMaterials]);

  // --- LOGIKA PARSING LolosKampus ---
  const handleParse = () => {
    if (!rawText.trim()) {
      setErrorMsg("Teks soal tidak boleh kosong.");
      return;
    }
    setIsParsing(true);
    setErrorMsg("");
    setSuccessMsg("");

    setTimeout(() => {
      try {
        // Memisahkan soal berdasarkan format angka penomoran (cth: "1. ", "2. ", dll)
        const regexSplit = /(?:^|\n)(?=\d+\.)/g;
        const blocks = rawText.split(regexSplit).map(b => b.trim()).filter(b => b);

        const results = blocks.map((block, index) => {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l);
          
          let qText = "";
          let opts: { text: string, points: number }[] = [];
          let keyStr = "";
          let exp = "";
          let diff = "medium";
          let qType = "pilihan_ganda"; // Default tipe soal jika tidak didefinisikan
          let maxPoints = 5; // Default poin untuk non-Pilihan Ganda

          let mode = "q"; // "q" (question) | "opt" (options) | "key" (answer key) | "exp" (explanation)

          lines.forEach(line => {
            const lower = line.toLowerCase();
            
            // A. Deteksi Tipe Soal
            if (lower.startsWith("tipe:") || lower.startsWith("jenis:")) {
              const parsedType = lower.replace(/^(tipe|jenis):\s*/, "").trim();
              if (parsedType.includes("uraian") || parsedType.includes("isian")) {
                qType = "uraian";
              } else if (parsedType.includes("esai") || parsedType.includes("essay")) {
                qType = "esai";
              } else {
                qType = "pilihan_ganda";
              }
              return;
            }

            // B. Deteksi Bobot Poin Maksimal (Khusus Uraian & Esai)
            if (lower.startsWith("poin:") || lower.startsWith("point:")) {
              maxPoints = parseInt(lower.replace(/^(poin|point):\s*/, "").trim()) || 5;
              return;
            }

            // C. Deteksi Pilihan Jawaban (A., B., C., D.)
            if (/^[a-e][\.\)]\s+/i.test(line)) {
              opts.push({ text: line.replace(/^[a-eA-E][\.\)]\s*/, ''), points: 0 });
              mode = "opt";
            } 
            // D. Deteksi Kunci Jawaban
            else if (lower.startsWith("kunci:") || lower.startsWith("jawaban:")) {
              keyStr = line.replace(/^(kunci|jawaban):\s*/i, "").trim();
              mode = "key";
            } 
            // E. Deteksi Tingkat Kesulitan
            else if (lower.startsWith("kesulitan:")) {
              const d = lower.replace("kesulitan:", "").trim();
              if (d === 'mudah') diff = 'easy';
              else if (d === 'sulit') diff = 'hard';
              else if (d === 'hots') diff = 'HOTS';
              else diff = 'medium';
              mode = "diff";
            }
            // F. Deteksi Pembahasan
            else if (lower.startsWith("pembahasan:")) {
              exp = line.replace(/pembahasan:\s*/i, "").trim();
              mode = "exp";
            } 
            // Menangkap teks multiline (Pertanyaan atau Pembahasan berkelanjutan)
            else {
              if (mode === "q") {
                qText += (qText ? "\n" : "") + line.replace(/^\d+\.\s*/, '');
              } else if (mode === "exp") {
                exp += "\n" + line;
              }
            }
          });

          // G. Penyelarasan format options DB berdasarkan tipe soal hasil parse
          let finalOptionsPayload: any[] = [];

          if (qType === "pilihan_ganda") {
            // Tandai poin jawaban benar jika ada kunci
            if (keyStr && opts.length > 0) {
              const kIndex = keyStr.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, dst
              if (opts[kIndex]) {
                opts[kIndex].points = 5; // Berikan bobot nilai default 5 untuk jawaban benar
              }
            }
            finalOptionsPayload = opts;
          } else if (qType === "uraian") {
            finalOptionsPayload = [{ text: keyStr || "Kunci jawaban isian belum diisi.", points: maxPoints }];
          } else if (qType === "esai") {
            finalOptionsPayload = [{ text: keyStr || "Pedoman penskoran esai belum ditentukan.", points: maxPoints }];
          }

          return {
            id: generateTempId(),
            question: qText || "Teks pertanyaan kosong.",
            question_type: qType,
            options: finalOptionsPayload,
            explanation: exp,
            difficulty: diff
          };
        });

        setParsedQuestions(results);
        if (results.length > 0) {
          setSuccessMsg(`Berhasil mengekstrak ${results.length} soal! Silakan tinjau draf soal di panel kanan sebelum disimpan.`);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Terjadi kesalahan saat mengekstrak teks. Pastikan format penomoran baris benar.");
      } finally {
        setIsParsing(false);
      }
    }, 500);
  };

  // --- HANDLER UBAH DATA PREVIEW ---
  const handleDifficultyChange = (id: string, newDiff: string) => {
    setParsedQuestions(prev => prev.map(q => q.id === id ? { ...q, difficulty: newDiff } : q));
  };
  const handleRemoveQuestion = (id: string) => {
    setParsedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleTypeChange = (id: string, newType: 'pilihan_ganda' | 'uraian' | 'esai') => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.id === id) {
        // Reset struktur options yang sesuai dengan tipe baru agar tidak crash
        let newOpts = [];
        if (newType === "pilihan_ganda") {
          newOpts = [
            { text: "Pilihan A", points: 5 },
            { text: "Pilihan B", points: 0 },
            { text: "Pilihan C", points: 0 },
            { text: "Pilihan D", points: 0 }
          ];
        } else {
          newOpts = [{ text: "Kata kunci / pedoman penskoran baru.", points: 5 }];
        }
        return { ...q, question_type: newType, options: newOpts };
      }
      return q;
    }));
  };

  const handleTextChange = (id: string, value: string) => {
    setParsedQuestions(prev => prev.map(q => q.id === id ? { ...q, question: value } : q));
  };

  const handleExplanationChange = (id: string, value: string) => {
    setParsedQuestions(prev => prev.map(q => q.id === id ? { ...q, explanation: value } : q));
  };

  const handleSingleOptionChange = (id: string, index: number, field: "text" | "points", value: any) => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.id === id) {
        const nextOpts = [...q.options];
        if (nextOpts[index]) {
          nextOpts[index] = { ...nextOpts[index], [field]: field === "points" ? Number(value) : value };
        }
        return { ...q, options: nextOpts };
      }
      return q;
    }));
  };

  const handleSetCorrectMCQ = (id: string, index: number) => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.id === id && q.question_type === "pilihan_ganda") {
        const nextOpts = q.options.map((opt: any, idx: number) => ({
          ...opt,
          points: idx === index ? 5 : 0 // Set benar bernilai 5, sisanya 0
        }));
        return { ...q, options: nextOpts };
      }
      return q;
    }));
  };

  // --- SIMPAN KE DATABASE ---
  const handleSaveAll = async () => {
    if (!globalClass || !globalCat || !globalMat) {
      setErrorMsg("Harap tentukan Kelas, Kategori, dan Materi Utama terlebih dahulu pada panel klasifikasi.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Memetakan struktur draf final ke skema kolom Supabase yang disesuaikan
      const payloads = parsedQuestions.map(q => ({
        category_id: Number(globalClass),
        material_category_id: Number(globalCat),
        material_id: globalMat,
        question: q.question,
        explanation: q.explanation || null,
        difficulty: q.difficulty,
        question_type: q.question_type, // Menyimpan jenis_soal ('pilihan_ganda', 'uraian', 'esai')
        options: q.options, // Array JSONB
        created_by: user?.id || null
      }));

      const { error } = await supabase.from('question_bank').insert(payloads);
      
      if (error) throw error;

      setSuccessMsg(`Selamat! ${payloads.length} Soal berhasil disimpan ke Database secara massal.`);
      setParsedQuestions([]);
      setRawText("");
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data ke database. Silakan periksa koneksi Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 pb-20">
      
      {/* --- PANEL KIRI: KLASIFIKASI & INPUT TEXT --- */}
      <div className="space-y-6">
        
        {/* PANEL 1: KLASIFIKASI MATERI */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <Layers size={18} className="text-blue-600" /> 1. Atur Klasifikasi Materi Global
            </h2>
            {isLoadingMaster && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kelas / Tingkat</label>
              <select 
                value={globalClass}
                onChange={(e) => setGlobalClass(e.target.value)}
                disabled={isLoadingMaster}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="">-- Pilih Kelas --</option>
                {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kategori Materi</label>
              <select 
                value={globalCat}
                onChange={(e) => { setGlobalCat(e.target.value); setGlobalMat(""); }}
                disabled={isLoadingMaster}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="">-- Pilih Kategori --</option>
                {materialCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Materi Spesifik</label>
              <select 
                value={globalMat}
                onChange={(e) => setGlobalMat(e.target.value)}
                disabled={!globalCat || isLoadingMaster}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="">-- Pilih Materi --</option>
                {filteredMaterials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* PANEL 2: RAW TEXT INPUT */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-sm">
          <h2 className="text-base font-black text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2 uppercase tracking-tight">
            <Type size={18} className="text-blue-600" /> 2. Tempel Teks Soal Sumber
          </h2>
          
          <div className="mb-4 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs">
            <h5 className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-1">
              <Info size={14}/> Panduan Penulisan Multi-Format:
            </h5>
            <pre className="font-mono whitespace-pre-wrap text-[10px] text-blue-700 dark:text-blue-300 leading-normal">
{`1. Siapa nabi pertama? (Default Pilihan Ganda)
A. Nabi Adam
B. Nabi Nuh
Kunci: A
Kesulitan: Mudah

2. Sebutkan rukun Islam yang kedua!
Tipe: Uraian Singkat
Kunci: Mendirikan Sholat
Poin: 5
Kesulitan: Sedang

3. Jelaskan pentingnya perilaku jujur!
Tipe: Esai Bebas
Kunci: Rubrik: Skor 5 jika ada dalil, skor 2 jika tidak ada dalil, skor 0 jika kosong.
Poin: 10
Kesulitan: Sulit`}
            </pre>
          </div>

          <textarea
            rows={14}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Salin dan tempel daftar soal Anda di sini..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-xs font-mono focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleParse}
            disabled={isParsing || !rawText}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-black text-sm shadow-xl shadow-green-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isParsing ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
            MULAI EKSTRAK SOAL MULTI-TIPE
          </button>
        </div>
      </div>

      {/* --- PANEL KANAN: PREVIEW, EDIT & SAVE MASSAL --- */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-sm h-fit">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
          <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
            <CheckCircle2 size={18} className="text-blue-600" /> 3. Tinjau & Sesuaikan Draf Soal
          </h2>
          {parsedQuestions.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-black uppercase">
              {parsedQuestions.length} Draf Siap
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-xs font-semibold">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2 text-xs font-semibold">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {successMsg}
          </div>
        )}

        {parsedQuestions.length === 0 ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
            <Wand2 size={48} className="mb-4 opacity-20 text-blue-600" />
            <p className="font-bold text-sm">Belum Ada Soal Terpapar</p>
            <p className="text-xs mt-1">Gunakan panel kiri untuk mengekstrak draf teks kuis.</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
            {parsedQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 relative group text-left space-y-4">
                
                {/* Tombol Hapus Draf */}
                <button 
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                  title="Hapus soal ini dari draf"
                >
                  <Trash2 size={16}/>
                </button>
                
                {/* 1. Header Card (Nomor, Kesulitan, Jenis Soal) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-sm font-black text-blue-600">Soal {idx + 1}</span>
                  
                  {/* Dropdown Kesulitan */}
                  <select 
                    value={q.difficulty}
                    onChange={(e) => handleDifficultyChange(q.id, e.target.value)}
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded border outline-none bg-white dark:bg-slate-750"
                  >
                    <option value="easy">Mudah</option>
                    <option value="medium">Sedang</option>
                    <option value="hard">Sulit</option>
                    <option value="HOTS">HOTS</option>
                  </select>

                  {/* Dropdown Jenis Soal (Ubah Tipe Dinamis) */}
                  <select 
                    value={q.question_type}
                    onChange={(e) => handleTypeChange(q.id, e.target.value as any)}
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded border outline-none bg-blue-50 text-blue-700 dark:bg-blue-950/25 border-blue-100"
                  >
                    <option value="pilihan_ganda">Pilihan Ganda</option>
                    <option value="uraian">Uraian Singkat</option>
                    <option value="esai">Esai Bebas</option>
                  </select>
                </div>

                {/* 2. Input Teks Pertanyaan */}
                <textarea 
                  value={q.question}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 font-bold"
                  placeholder="Isi teks pertanyaan..."
                />

                {/* 3. Panel Kunci Jawaban / Opsi Khusus Berdasarkan Jenis Soal */}
                {q.question_type === "pilihan_ganda" ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Opsi Pilihan (A - D):</span>
                    {q.options.map((opt: any, oIdx: number) => {
                      const isCorrect = opt.points > 0;
                      return (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectMCQ(q.id, oIdx)}
                            className={cn(
                              "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border transition-all shrink-0",
                              isCorrect 
                                ? "bg-green-500 border-green-600 text-white" 
                                : "bg-white text-slate-400 hover:bg-slate-50"
                            )}
                            title="Set Kunci Jawaban Benar"
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </button>
                          <input 
                            type="text"
                            value={opt.text || ""}
                            onChange={(e) => handleSingleOptionChange(q.id, oIdx, "text", e.target.value)}
                            className="flex-1 p-2 text-xs rounded-lg border border-slate-200 outline-none"
                            placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : q.question_type === "uraian" ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                    <div className="md:col-span-3 space-y-1">
                      <span className="text-[9px] font-black text-amber-700 uppercase block">Kata Kunci Isian</span>
                      <input 
                        type="text"
                        value={q.options[0]?.text || ""}
                        onChange={(e) => handleSingleOptionChange(q.id, 0, "text", e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-200 outline-none rounded-lg"
                        placeholder="Contoh: rukun islam..."
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-[9px] font-black text-amber-700 uppercase block">Bobot</span>
                      <input 
                        type="number"
                        min="1"
                        value={q.options[0]?.points || 5}
                        onChange={(e) => handleSingleOptionChange(q.id, 0, "points", e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-200 outline-none rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-purple-50/40 p-3 rounded-xl border border-purple-100">
                    <div className="md:col-span-3 space-y-1">
                      <span className="text-[9px] font-black text-purple-700 uppercase block">Kriteria Rubrik Penilaian</span>
                      <textarea 
                        rows={2}
                        value={q.options[0]?.text || ""}
                        onChange={(e) => handleSingleOptionChange(q.id, 0, "text", e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-200 outline-none rounded-lg resize-y"
                        placeholder="Contoh: Poin 5 jika menjelaskan lengkap..."
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-[9px] font-black text-purple-700 uppercase block">Bobot</span>
                      <input 
                        type="number"
                        min="1"
                        value={q.options[0]?.points || 5}
                        onChange={(e) => handleSingleOptionChange(q.id, 0, "points", e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-200 outline-none rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Input Pembahasan */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pembahasan (Opsional):</span>
                  <textarea 
                    value={q.explanation || ""}
                    onChange={(e) => handleExplanationChange(q.id, e.target.value)}
                    rows={1}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                    placeholder="Tulis alasan atau dalil rujukan..."
                  />
                </div>

              </div>
            ))}
            
            {/* TOMBOL SIMPAN KE DATABASE */}
            <button
              onClick={handleSaveAll}
              disabled={isSaving || parsedQuestions.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-black text-sm shadow-xl hover:bg-opacity-90 transition-all disabled:bg-slate-100 disabled:text-slate-300 sticky bottom-0 z-10"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              SIMPAN {parsedQuestions.length} SOAL KE DATABASE
            </button>
          </div>
        )}
      </div>

    </div>
  );
}