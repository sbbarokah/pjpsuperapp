"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Wand2, Save, Trash2, CheckCircle2, AlertCircle, Loader2, Info 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
        // Memisahkan soal berdasarkan nomor di awal baris (cth: "1. ", "2. ")
        const regexSplit = /(?:^|\n)(?=\d+\.)/g;
        const blocks = rawText.split(regexSplit).map(b => b.trim()).filter(b => b);

        const results = blocks.map((block, index) => {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l);
          
          let qText = "";
          let opts: { text: string, isCorrect: boolean }[] = [];
          let keyStr = "";
          let exp = "";
          let diff = "medium"; // Default

          let mode = "q"; // q, opt, key, exp

          lines.forEach(line => {
            const lower = line.toLowerCase();
            
            // Cek Pilihan Jawaban (A., B., C., a., b.)
            if (/^[a-e][\.\)]\s+/i.test(line)) {
              opts.push({ text: line.replace(/^[a-eA-E][\.\)]\s*/, ''), isCorrect: false });
              mode = "opt";
            } 
            // Cek Kunci Jawaban
            else if (lower.startsWith("kunci:") || lower.startsWith("jawaban:")) {
              keyStr = lower.replace(/^(kunci|jawaban):\s*/i, "").trim();
              mode = "key";
            } 
            // Cek Kesulitan Spesifik Soal Ini
            else if (lower.startsWith("kesulitan:")) {
              const d = lower.replace("kesulitan:", "").trim();
              if (d === 'mudah') diff = 'easy';
              else if (d === 'sulit') diff = 'hard';
              else if (d === 'hots') diff = 'HOTS';
              else diff = 'medium';
              mode = "diff";
            }
            // Cek Pembahasan
            else if (lower.startsWith("pembahasan:")) {
              exp = line.replace(/pembahasan:\s*/i, "").trim();
              mode = "exp";
            } 
            // Menangkap multiline text
            else {
              if (mode === "q") {
                // Hapus angka di awal soal (opsional)
                qText += (qText ? "\n" : "") + line.replace(/^\d+\.\s*/, '');
              } else if (mode === "exp") {
                exp += "\n" + line;
              }
            }
          });

          // Tandai jawaban benar
          if (keyStr) {
            // Asumsi format "A" atau "B"
            const kIndex = keyStr.toLowerCase().charCodeAt(0) - 97; // a=0, b=1
            if (opts[kIndex]) {
              opts[kIndex].isCorrect = true;
            }
          }

          // Fallback jika tidak ada opsi sama sekali (misal soal esai/BS)
          if (opts.length === 0) {
            opts = [
              { text: "Benar", isCorrect: keyStr.toLowerCase() === 'benar' },
              { text: "Salah", isCorrect: keyStr.toLowerCase() === 'salah' }
            ];
          }

          return {
            id: `temp-${Date.now()}-${index}`,
            question: qText,
            options: opts.map(o => ({ teks: o.text, poin: o.isCorrect ? 5 : 0 })),
            explanation: exp,
            difficulty: diff
          };
        });

        setParsedQuestions(results);
        if (results.length > 0) {
          setSuccessMsg(`Berhasil mengekstrak ${results.length} soal! Silakan tinjau dan atur kesulitan sebelum menyimpan.`);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Terjadi kesalahan saat memproses teks.");
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

  // --- SIMPAN KE DATABASE ---
  const handleSaveAll = async () => {
    // Validasi 3 parameter
    if (!globalClass || !globalCat || !globalMat) {
      setErrorMsg("Pilih Kelas, Kategori, dan Materi Utama terlebih dahulu untuk menyimpan soal-soal ini.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Ambil user ID
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Siapkan Payload Batch
      const payloads = parsedQuestions.map(q => ({
        category_id: Number(globalClass),           // ID Kelas (baru)
        material_category_id: Number(globalCat),    // ID Kategori Materi
        material_id: globalMat,                     // ID Materi Spesifik
        question: q.question,
        explanation: q.explanation || null,
        difficulty: q.difficulty,
        options: q.options.map((opt: any) => ({
          text: opt.teks,
          points: opt.poin
        })),
        created_by: user?.id || null
      }));

      // 3. Simpan Batch ke DB
      const { error } = await supabase.from('question_bank').insert(payloads);
      
      if (error) throw error;

      setSuccessMsg(`${payloads.length} Soal berhasil disimpan ke Database!`);
      setParsedQuestions([]);
      setRawText("");
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 pb-20">
      
      {/* --- PANEL KIRI: INPUT TEXT --- */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-stroke pb-3 dark:border-strokedark">
            <h2 className="text-xl font-bold text-black dark:text-white">
              1. Atur Materi (Global)
            </h2>
            {isLoadingMaster && <Loader2 size={16} className="animate-spin text-primary" />}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kelas / Tingkat</label>
              <select 
                value={globalClass}
                onChange={(e) => setGlobalClass(e.target.value)}
                disabled={isLoadingMaster}
                className="w-full p-3 text-sm rounded-xl border border-stroke bg-slate-50 dark:bg-meta-4 outline-none focus:border-primary transition-all disabled:opacity-50"
              >
                <option value="">-- Pilih Kelas --</option>
                {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kategori Materi</label>
              <select 
                value={globalCat}
                onChange={(e) => { setGlobalCat(e.target.value); setGlobalMat(""); }}
                disabled={isLoadingMaster}
                className="w-full p-3 text-sm rounded-xl border border-stroke bg-slate-50 dark:bg-meta-4 outline-none focus:border-primary transition-all disabled:opacity-50"
              >
                <option value="">-- Pilih Kategori --</option>
                {materialCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Materi Spesifik</label>
              <select 
                value={globalMat}
                onChange={(e) => setGlobalMat(e.target.value)}
                disabled={!globalCat || isLoadingMaster}
                className="w-full p-3 text-sm rounded-xl border border-stroke bg-slate-50 dark:bg-meta-4 outline-none focus:border-primary transition-all disabled:opacity-50"
              >
                <option value="">-- Pilih Materi --</option>
                {filteredMaterials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-stroke pb-3 dark:border-strokedark">
            <h2 className="text-xl font-bold text-black dark:text-white">2. Paste Soal</h2>
          </div>
          
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30">
            <h5 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><Info size={16}/> Format Pendukung:</h5>
            <pre className="text-xs text-blue-700 dark:text-blue-400 font-mono whitespace-pre-wrap">
{`1. Siapa nabi pertama?
A. Nabi Adam
B. Nabi Nuh
C. Nabi Idris
Kunci: A
Kesulitan: Mudah
Pembahasan: Karena beliau manusia pertama.`}
            </pre>
          </div>

          <textarea
            rows={15}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste puluhan soal Anda di sini..."
            className="w-full p-4 rounded-xl border border-stroke bg-slate-50 dark:bg-meta-4 outline-none focus:border-primary transition-all resize-y text-sm font-mono"
          />

          <button
            onClick={handleParse}
            disabled={isParsing || !rawText}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {isParsing ? <Loader2 className="animate-spin" /> : <Wand2 />}
            Mulai Ekstrak Soal
          </button>
        </div>
      </div>

      {/* --- PANEL KANAN: PREVIEW & EDIT --- */}
      <div className="bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-sm h-fit">
        <div className="flex items-center justify-between mb-4 border-b border-stroke pb-3 dark:border-strokedark">
          <h2 className="text-xl font-bold text-black dark:text-white">3. Tinjau & Simpan</h2>
          {parsedQuestions.length > 0 && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
              {parsedQuestions.length} Soal Siap
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2 text-sm">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {successMsg}
          </div>
        )}

        {parsedQuestions.length === 0 ? (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center">
            <Wand2 size={48} className="mb-4 opacity-20" />
            <p>Hasil ekstrak akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2">
            {parsedQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-gray-50 dark:bg-meta-4 rounded-xl border border-stroke dark:border-strokedark relative group">
                <button 
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus soal ini"
                >
                  <Trash2 size={18}/>
                </button>
                
                <h4 className="font-bold text-black dark:text-white mb-2 whitespace-pre-wrap pr-8">
                  <span className="text-primary mr-1">{idx + 1}.</span> {q.question}
                </h4>

                {/* Dropdown Tingkat Kesulitan INDIVIDUAL */}
                <div className="mb-3 flex items-center gap-2">
                   <label className="text-[10px] font-bold uppercase text-gray-500">Kesulitan:</label>
                   <select 
                     value={q.difficulty}
                     onChange={(e) => handleDifficultyChange(q.id, e.target.value)}
                     className={`text-xs font-bold px-2 py-1 rounded border outline-none ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-700 border-green-200' :
                        q.difficulty === 'hard' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        q.difficulty === 'HOTS' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                     }`}
                   >
                     <option value="easy">Mudah</option>
                     <option value="medium">Sedang</option>
                     <option value="hard">Sulit</option>
                     <option value="HOTS">HOTS</option>
                   </select>
                </div>

                <div className="space-y-1 mb-3">
                  {q.options.map((opt: any, oIdx: number) => {
                    const isAns = opt.poin > 0;
                    return (
                      <div key={oIdx} className={`text-sm p-2 rounded border ${isAns ? 'bg-green-100 border-green-300 text-green-800 font-bold dark:bg-green-900/30' : 'bg-white border-stroke dark:bg-boxdark dark:border-strokedark'}`}>
                        {String.fromCharCode(65 + oIdx)}. {opt.teks}
                        {isAns && <span className="float-right text-xs bg-green-500 text-white px-2 rounded">KUNCI</span>}
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <div className="text-xs p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800/30">
                    <strong className="text-blue-800 dark:text-blue-300 block mb-1">Pembahasan:</strong>
                    <span className="text-blue-700 dark:text-blue-400 whitespace-pre-wrap">{q.explanation}</span>
                  </div>
                )}
              </div>
            ))}
            
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-opacity-90 transition-all disabled:opacity-50 sticky bottom-0"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Simpan {parsedQuestions.length} Soal ke Database
            </button>
          </div>
        )}
      </div>

    </div>
  );
}