"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Maximize, Minimize, X, 
  Settings, ChevronLeft, ChevronRight, Users, ClipboardCheck, 
  AlertTriangle, Lightbulb, StickyNote, TrendingUp, BookOpen, Layers, Check,
  Palette, CheckCircle // Tambahan Ikon
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PresentationClient({ context, monthName, year }: any) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // State Konfigurasi Tampilan
  const [config, setConfig] = useState({
    coverTitle: "Laporan Kegiatan Belajar Mengajar",
    coverSubtitle: context?.groupName || "Nama Kelompok",
    coverPeriod: `${monthName} ${year}`,
    coverAuthor: "Pengurus Kelompok",
    orderMode: "by_class", // 'by_class' | 'by_point'
    attendanceMode: "average", // 'average' | 'detail'
    evaluationMode: "summary", // 'summary' | 'detail'
    
    // [BARU] Pengaturan Tema & Halaman Penutup
    theme: "dark", // 'light' | 'medium' | 'dark'
    closingLine1: `Demikian laporan KBM bulan ${monthName}`,
    closingLine2: "Alhamdulillaahi jazaa kumulloohu khoiroo",
    closingLine3: `Tim PJP ${context?.groupName || "Kelompok"}`,
  });

  // Pemetaan Palet Warna Tema Dinamis
  const themeMap = {
    dark: {
      bg: "bg-slate-950",
      text: "text-white",
      card: "bg-slate-800/80",
      border: "border-slate-700",
      subtext: "text-slate-400",
      accent: "text-indigo-400",
      navBg: "bg-slate-900/90",
      line: "bg-slate-700",
    },
    medium: {
      bg: "bg-blue-900",
      text: "text-blue-50",
      card: "bg-blue-800/80",
      border: "border-blue-700",
      subtext: "text-blue-200",
      accent: "text-blue-300",
      navBg: "bg-blue-950/90",
      line: "bg-blue-800",
    },
    light: {
      bg: "bg-slate-50",
      text: "text-slate-900",
      card: "bg-white",
      border: "border-slate-200",
      subtext: "text-slate-600",
      accent: "text-blue-600",
      navBg: "bg-white/90",
      line: "bg-slate-300",
    }
  };
  
  const t = themeMap[config.theme as keyof typeof themeMap] || themeMap.dark;

  // Helper Warna Kotak Catatan (Notes)
  const getNoteBoxClass = (type: 'success' | 'warning' | 'idea') => {
    const isLight = config.theme === 'light';
    switch(type) {
      case 'success': return isLight ? 'bg-green-50 border-green-200 text-green-800' : 'bg-green-900/20 border-green-800/50 text-green-100';
      case 'warning': return isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-900/20 border-red-800/50 text-red-100';
      case 'idea': return isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-yellow-900/20 border-yellow-800/50 text-yellow-100';
      default: return '';
    }
  };

  // State untuk filter Kategori / Kelas
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    context?.data?.map((item: any) => item.category.id) || []
  );

  const toggleCategory = (catId: number) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
    setCurrentSlide(0); 
  };

  // Toggle Fullscreen Browser API
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  // Generate Slides
  const slides = useMemo(() => {
    let generated: any[] = [];
    generated.push({ type: 'cover' });

    if (!context || !context.data) return generated;

    const filteredData = context.data.filter((item: any) => 
      selectedCategories.includes(item.category.id)
    );

    if (config.orderMode === 'by_class') {
      filteredData.forEach((item: any) => {
        generated.push({ type: 'attendance', data: item });
        generated.push({ type: 'evaluation', data: item });
        generated.push({ type: 'notes', data: item });
      });
    } else {
      filteredData.forEach((item: any) => generated.push({ type: 'attendance', data: item }));
      filteredData.forEach((item: any) => generated.push({ type: 'evaluation', data: item }));
      filteredData.forEach((item: any) => generated.push({ type: 'notes', data: item }));
    }

    // [BARU] Tambahkan slide penutup di akhir
    generated.push({ type: 'closing' });

    return generated;
  }, [context, config.orderMode, selectedCategories]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement && !showConfig) {
           // bisa kembali
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, showConfig]);

  // Render Konten Slide Dinamis
  const renderSlideContent = () => {
    const slide = slides[currentSlide];

    if (!slide) return null;

    if (slide.type === 'cover') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className={`w-24 h-24 bg-blue-500/20 ${t.accent} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
            <BookOpen size={48} />
          </div>
          <h1 className={`text-5xl md:text-7xl font-black tracking-tight leading-tight px-4 ${t.text}`}>{config.coverTitle}</h1>
          <h2 className={`text-3xl md:text-4xl font-bold ${t.accent}`}>{config.coverSubtitle}</h2>
          <div className={`w-24 h-1 rounded-full mx-auto my-8 ${t.line}`}></div>
          <p className={`text-2xl ${t.subtext}`}>Periode: <span className={`font-bold ${t.text}`}>{config.coverPeriod}</span></p>
          <p className={`text-xl mt-12 ${t.subtext}`}>Disusun oleh: {config.coverAuthor}</p>
        </div>
      );
    }

    // [BARU] Render Slide Penutup
    if (slide.type === 'closing') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-500 px-8">
          <h2 className={`text-3xl md:text-5xl font-black tracking-tight leading-tight ${t.text}`}>
            {config.closingLine1}
          </h2>
          <h3 className={`text-2xl md:text-4xl font-bold ${t.accent}`}>
            {config.closingLine2}
          </h3>
          <div className={`w-24 h-1 rounded-full mx-auto my-8 ${t.line}`}></div>
          <p className={`text-xl md:text-2xl font-medium ${t.subtext}`}>
            {config.closingLine3}
          </p>
        </div>
      );
    }

    const { category, attendance, evaluation, manualReport } = slide.data;
    const catName = category?.name || "Kelas";

    if (slide.type === 'attendance') {
      return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 p-8 md:p-16">
          <h2 className={`text-4xl font-black mb-2 flex items-center gap-4 ${t.text}`}>
            <Users className={t.accent} size={40} /> Kehadiran - Kelas {catName}
          </h2>
          <div className={`w-full h-px mb-8 ${t.line}`}></div>

          {config.attendanceMode === 'average' ? (
             <div className="flex-1 flex items-center justify-center gap-8">
                <div className={`p-12 rounded-3xl text-center border flex-1 shadow-xl transition-colors ${t.card} ${t.border}`}>
                  <p className="text-7xl font-black text-green-500 mb-4">{attendance?.present_percentage?.toFixed(1) || manualReport?.attendance_present_percentage || 0}%</p>
                  <p className={`text-2xl font-bold ${t.subtext}`}>Rata-rata Hadir</p>
                </div>
                <div className={`p-12 rounded-3xl text-center border flex-1 shadow-xl transition-colors ${t.card} ${t.border}`}>
                  <p className="text-7xl font-black text-yellow-500 mb-4">{attendance?.permission_percentage?.toFixed(1) || manualReport?.attendance_permission_percentage || 0}%</p>
                  <p className={`text-2xl font-bold ${t.subtext}`}>Rata-rata Izin</p>
                </div>
                <div className={`p-12 rounded-3xl text-center border flex-1 shadow-xl transition-colors ${t.card} ${t.border}`}>
                  <p className="text-7xl font-black text-red-500 mb-4">{attendance?.absent_percentage?.toFixed(1) || manualReport?.attendance_absent_percentage || 0}%</p>
                  <p className={`text-2xl font-bold ${t.subtext}`}>Rata-rata Alfa</p>
                </div>
             </div>
          ) : (
            <div className={`flex-1 rounded-3xl border overflow-hidden flex flex-col shadow-xl transition-colors ${t.card} ${t.border}`}>
               {attendance?.raw_data?.attendances ? (
                  <div className="overflow-y-auto p-8 custom-scrollbar">
                    <table className="w-full text-left text-2xl">
                      <thead>
                        <tr className={`${t.subtext} border-b-2 ${t.border}`}>
                          <th className="pb-6 font-bold">Nama Generus</th>
                          <th className="pb-6 font-bold text-center text-green-500">Hadir</th>
                          <th className="pb-6 font-bold text-center text-yellow-500">Izin</th>
                          <th className="pb-6 font-bold text-center text-red-500">Alfa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(attendance.raw_data.attendances).map(([id, st]: any) => (
                          <tr key={id} className={`border-b ${t.border} ${t.text}`}>
                            <td className="py-5 font-medium">{st.name}</td>
                            <td className="py-5 text-center font-bold">{st.p}</td>
                            <td className="py-5 text-center font-bold">{st.i}</td>
                            <td className="py-5 text-center font-bold">{st.a}</td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Rata-Rata Kelas */}
                      <tfoot>
                        <tr className={`border-t-2 ${t.border} ${t.text}`}>
                          <td className="py-5 font-bold text-right pr-6">Rata-rata Kelas:</td>
                          <td className="py-5 text-center font-black text-green-500">{attendance?.present_percentage?.toFixed(1) || 0}%</td>
                          <td className="py-5 text-center font-black text-yellow-500">{attendance?.permission_percentage?.toFixed(1) || 0}%</td>
                          <td className="py-5 text-center font-black text-red-500">{attendance?.absent_percentage?.toFixed(1) || 0}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
               ) : (
                 <div className={`flex-1 flex items-center justify-center text-3xl italic ${t.subtext}`}>Data rincian tidak tersedia (Input Manual)</div>
               )}
            </div>
          )}
        </div>
      );
    }

    if (slide.type === 'evaluation') {
      return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 p-8 md:p-16">
          <h2 className={`text-4xl font-black mb-2 flex items-center gap-4 ${t.text}`}>
            <ClipboardCheck className={t.accent} size={40} /> Evaluasi Materi - Kelas {catName}
          </h2>
          <div className={`w-full h-px mb-8 ${t.line}`}></div>

          <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
            {evaluation?.raw_data ? evaluation.raw_data.map((item: any, idx: number) => {
              const matName = context.materials?.get ? context.materials.get(item.material_id) : "Materi";
              return (
                <div key={idx} className={`p-8 rounded-3xl border shadow-lg transition-colors ${t.card} ${t.border}`}>
                  <h3 className={`text-3xl font-black mb-6 leading-tight ${t.text}`}>{matName || item.material_id}</h3>
                  <div className={`bg-black/10 p-6 rounded-2xl text-2xl mb-6 border ${t.border} ${t.subtext}`}>
                    <span className={`font-bold block mb-2 ${t.accent}`}>Kesimpulan:</span> 
                    <span className="leading-relaxed">{item.evaluation_note || "-"}</span>
                  </div>
                  
                  {config.evaluationMode === 'detail' && item.show_details && item.scores && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                       {Object.entries(item.scores).map(([uid, sData]: any) => (
                         <div key={uid} className={`bg-black/20 p-5 rounded-2xl flex justify-between items-center border ${t.border} ${t.text}`}>
                           <span className="truncate pr-4 text-xl font-medium">{sData.name || "Siswa"}</span>
                           <span className={`font-black text-3xl ${t.accent}`}>{sData.score || sData}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              )
            }) : (
              <div className={`p-10 rounded-3xl border text-2xl whitespace-pre-wrap leading-relaxed shadow-xl transition-colors ${t.card} ${t.border} ${t.subtext}`}>
                {manualReport?.raw_data ? Object.entries(manualReport.raw_data).map(([id, note]: any) => (
                  <p key={id} className={`mb-6 pb-6 border-b last:border-0 last:mb-0 last:pb-0 ${t.border}`}>
                    <strong className={`block mb-2 text-3xl ${t.text}`}>{context.materials?.get ? context.materials.get(id) : id}:</strong> 
                    {note}
                  </p>
                )) : "Tidak ada catatan evaluasi."}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (slide.type === 'notes') {
      return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 p-8 md:p-16">
          <h2 className={`text-4xl font-black mb-2 flex items-center gap-4 ${t.text}`}>
            <StickyNote className={t.accent} size={40} /> Catatan Kelas - {catName}
          </h2>
          <div className={`w-full h-px mb-8 ${t.line}`}></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
            <div className={`border-2 p-10 rounded-[2rem] shadow-lg transition-colors ${getNoteBoxClass('success')}`}>
              <h3 className="text-3xl font-black mb-6 flex items-center gap-4"><TrendingUp size={36}/> Info Keberhasilan</h3>
              <p className="text-2xl leading-relaxed whitespace-pre-wrap font-medium">{manualReport?.program_success_info || evaluation?.achievement || "-"}</p>
            </div>
            <div className={`border-2 p-10 rounded-[2rem] shadow-lg transition-colors ${getNoteBoxClass('warning')}`}>
              <h3 className="text-3xl font-black mb-6 flex items-center gap-4"><AlertTriangle size={36}/> Kendala</h3>
              <p className="text-2xl leading-relaxed whitespace-pre-wrap font-medium">{manualReport?.challenges_info || evaluation?.challenges || "-"}</p>
            </div>
            <div className={`border-2 p-10 rounded-[2rem] shadow-lg lg:col-span-2 transition-colors ${getNoteBoxClass('idea')}`}>
              <h3 className="text-3xl font-black mb-6 flex items-center gap-4"><Lightbulb size={36}/> Solusi & Usulan</h3>
              <p className="text-2xl leading-relaxed whitespace-pre-wrap font-medium">{evaluation?.solutions || evaluation?.notes || manualReport?.challenges_info || "-"}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-500 ${t.bg}`}>
      
      {/* AREA KONTEN SLIDE */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
           {renderSlideContent()}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className={`h-20 border-t flex items-center justify-between px-8 backdrop-blur-md z-40 transition-colors duration-500 ${t.navBg} ${t.border}`}>
           <button 
             onClick={() => setCurrentSlide(p => Math.max(0, p - 1))}
             disabled={currentSlide === 0}
             className={`${t.text} disabled:opacity-20 p-3 hover:bg-black/10 rounded-full transition-all active:scale-90`}
           >
             <ChevronLeft size={32}/>
           </button>
           
           {/* Progress Indicator */}
           <div className="flex items-center gap-2.5 max-w-[50%] overflow-x-auto no-scrollbar">
             {slides.map((_, i) => (
               <div 
                  key={i} 
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer shrink-0 ${i === currentSlide ? 'w-12 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : `w-2.5 hover:bg-blue-400 ${t.line}`}`}
               />
             ))}
           </div>

           <button 
             onClick={() => setCurrentSlide(p => Math.min(slides.length - 1, p + 1))}
             disabled={currentSlide === slides.length - 1}
             className={`${t.text} disabled:opacity-20 p-3 hover:bg-black/10 rounded-full transition-all active:scale-90`}
           >
             <ChevronRight size={32}/>
           </button>
        </div>
      </div>

      {/* FLOATING ACTION TOOLS DI SUDUT KANAN ATAS */}
      <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
        <button 
          onClick={toggleFullscreen} 
          className="p-4 bg-slate-900/80 backdrop-blur-md text-white rounded-full hover:bg-blue-600 transition-all shadow-2xl hover:shadow-blue-500/20 active:scale-90"
          title={isFullscreen ? "Keluar Fullscreen" : "Masuk Fullscreen"}
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
        <button 
          onClick={() => setShowConfig(!showConfig)} 
          className={`p-4 backdrop-blur-md text-white rounded-full transition-all shadow-2xl active:scale-90 ${showConfig ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-900/80 hover:bg-slate-800'}`}
          title="Pengaturan Tampilan"
        >
          <Settings size={24} className={showConfig ? "animate-spin-slow" : ""} />
        </button>
        <button 
          onClick={handleExit} 
          className="p-4 bg-red-600/80 backdrop-blur-md text-white rounded-full hover:bg-red-700 transition-all shadow-2xl hover:shadow-red-500/20 active:scale-90"
          title="Tutup Presentasi"
        >
          <X size={24} />
        </button>
      </div>

      {/* PANEL KONFIGURASI MENGAMBANG (Selalu Mode Gelap untuk UI Overlay) */}
      {showConfig && (
        <div className="absolute top-0 right-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-40 text-slate-300">
          <div className="p-8 border-b border-slate-800/80 flex justify-between items-center text-white">
            <h3 className="text-xl font-bold tracking-tight">Konfigurasi Presentasi</h3>
            <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"><X size={20}/></button>
          </div>
          
          <div className="p-8 flex-1 overflow-y-auto space-y-10 custom-scrollbar">
            
            {/* Filter Categories Settings */}
            <div className="space-y-5">
              <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest flex items-center gap-2">
                <Layers size={14}/> Pilih Kelas Ditampilkan
              </h4>
              <div className="flex flex-col gap-3 bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                {context?.data?.map((item: any) => (
                  <label key={item.category.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center border transition-all",
                      selectedCategories.includes(item.category.id) 
                        ? 'bg-indigo-500 border-indigo-500 text-white' 
                        : 'bg-slate-900 border-slate-600'
                    )}>
                      {selectedCategories.includes(item.category.id) && <Check size={14} />}
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      {item.category.name}
                    </span>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={selectedCategories.includes(item.category.id)}
                      onChange={() => toggleCategory(item.category.id)}
                    />
                  </label>
                ))}
                {context?.data?.length === 0 && (
                  <span className="text-sm text-slate-500 italic">Tidak ada kelas tersedia</span>
                )}
              </div>
            </div>

            {/* Theme Settings (BARU) */}
            <div className="space-y-5">
              <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest flex items-center gap-2">
                <Palette size={14}/> Warna Tema
              </h4>
              <div className="flex gap-2">
                <button onClick={() => setConfig({...config, theme: 'light'})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${config.theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Terang</button>
                <button onClick={() => setConfig({...config, theme: 'medium'})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${config.theme === 'medium' ? 'border-blue-400 bg-blue-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Medium</button>
                <button onClick={() => setConfig({...config, theme: 'dark'})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${config.theme === 'dark' ? 'border-indigo-500 bg-slate-950 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Gelap</button>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-5">
              <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest flex items-center gap-2">
                <Settings size={14}/> Mode Tampilan
              </h4>
              
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold">Urutan Transisi Slide</label>
                <select value={config.orderMode} onChange={e => {setConfig({...config, orderMode: e.target.value}); setCurrentSlide(0);}} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="by_class">Semua Poin per Kelas (Fokus Kelas)</option>
                  <option value="by_point">Semua Kelas per Poin (Fokus Evaluasi)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold">Rincian Kehadiran</label>
                <select value={config.attendanceMode} onChange={e => setConfig({...config, attendanceMode: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="average">Ringkasan Persentase (%)</option>
                  <option value="detail">Tabel Rinci per Siswa</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold">Rincian Evaluasi Materi</label>
                <select value={config.evaluationMode} onChange={e => setConfig({...config, evaluationMode: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="summary">Ringkasan & Kesimpulan</option>
                  <option value="detail">Tampilkan Nilai Anak (Jika ada)</option>
                </select>
              </div>
            </div>

            {/* Cover Settings */}
            <div className="space-y-5">
              <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={14}/> Halaman Sampul
              </h4>
              <div className="space-y-3">
                <input type="text" value={config.coverTitle} onChange={e => setConfig({...config, coverTitle: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Judul"/>
                <input type="text" value={config.coverSubtitle} onChange={e => setConfig({...config, coverSubtitle: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Sub Judul"/>
                <input type="text" value={config.coverPeriod} onChange={e => setConfig({...config, coverPeriod: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Periode"/>
                <input type="text" value={config.coverAuthor} onChange={e => setConfig({...config, coverAuthor: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Disusun oleh"/>
              </div>
            </div>
            
            {/* Closing Page Settings (BARU) */}
            <div className="space-y-5">
              <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14}/> Halaman Penutup
              </h4>
              <div className="space-y-3">
                <input type="text" value={config.closingLine1} onChange={e => setConfig({...config, closingLine1: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Demikian laporan..."/>
                <input type="text" value={config.closingLine2} onChange={e => setConfig({...config, closingLine2: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Alhamdulillah..."/>
                <input type="text" value={config.closingLine3} onChange={e => setConfig({...config, closingLine3: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 p-3.5 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Tim PJP..."/>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global Style untuk kustomisasi scrollbar dalam presentasi */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5); 
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5); 
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8); 
        }
      `}</style>
    </div>
  );
}