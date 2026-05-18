"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Calendar, 
  Users, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Loader2, 
  Search, 
  Check, 
  Info,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";

// --- KONFIGURASI BULAN INDONESIA ---
const MONTHS = [
  { id: 1, name: "Januari" },
  { id: 2, name: "Februari" },
  { id: 3, name: "Maret" },
  { id: 4, name: "April" },
  { id: 5, name: "Mei" },
  { id: 6, name: "Juni" },
  { id: 7, name: "Juli" },
  { id: 8, name: "Agustus" },
  { id: 9, name: "September" },
  { id: 10, name: "Oktober" },
  { id: 11, name: "November" },
  { id: 12, name: "Desember" }
];

const YEARS = [2025, 2026, 2027, 2028];

export default function NotificationBroadcastPage() {
  // State Filter Periode & Kasus (Case 1, 2, 3)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeCase, setActiveCase] = useState<1 | 2 | 3>(1);
  
  // State Logika Kontrol Target
  const [isScanning, setIsScanning] = useState(false);
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // State Pengiriman Notifikasi
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "completed">("idle");

  // Menghasilkan konten pesan dinamis berdasarkan Case pilihan sesuai formulir permintaan
  const getNotificationContent = () => {
    const monthName = MONTHS.find(m => m.id === selectedMonth)?.name || "";
    const periodText = `${monthName} ${selectedYear}`;

    switch (activeCase) {
      case 1:
        return {
          title: "Pengingat Laporan Muslimun 📢",
          body: "Amal sholeh laporan muslimun segera di input ke PJPSuperApp. Atas amal sholehnya disyukuri Alhamdulillaahi jazaa kumulloohu khoiro",
          targetPath: "/muslimun",
          externalLink: "https://pjpsuperapp.vercel.app/muslimun"
        };
      case 2:
        return {
          title: "Pengingat Laporan Kehadiran 📝",
          body: `Amal sholeh laporan kehadiran generus pada bulan ${periodText} segera di input ke PJPSuperApp. Atas amal sholehnya disyukuri Alhamdulillaahi jazaa kumulloohu khoiro`,
          targetPath: "/kbmattendance",
          externalLink: "https://pjpsuperapp.vercel.app/kbmattendance"
        };
      case 3:
        return {
          title: "Pengingat Laporan Penilaian 🏆",
          body: `Amal sholeh laporan penilaian generus pada bulan ${periodText} segera di input ke PJPSuperApp. Atas amal sholehnya disyukuri Alhamdulillaahi jazaa kumulloohu khoiro`,
          targetPath: "/kbmevaluation",
          externalLink: "https://pjpsuperapp.vercel.app/kbmevaluation"
        };
    }
  };

  const notification = getNotificationContent();

  // PEMINDAIAN DATA MELALUI BACKEND API ROUTE (Sangat Aman & Bypass RLS secara terkendali)
  const handleScanTargets = async () => {
    setIsScanning(true);
    setTargets([]);
    setSelectedTargets(new Set());
    setSendStatus("idle");
    setErrorMsg("");

    try {
      const response = await fetch(
        `/api/notifications/scan?month=${selectedMonth}&year=${selectedYear}&caseId=${activeCase}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan pemindaian.");
      }

      const result = data.targets || [];
      setTargets(result);
      setSelectedTargets(new Set(result.map((t: any) => t.id))); // Centang semua target secara default

    } catch (err: any) {
      console.error("Gagal memindai target:", err);
      setErrorMsg(err.message || "Gagal memproses pemindaian target dari database.");
    } finally {
      setIsScanning(false);
    }
  };

  // Jalankan pemindaian otomatis jika periode atau jenis laporan berubah
  useEffect(() => {
    handleScanTargets();
  }, [selectedMonth, selectedYear, activeCase]);

  // --- PROSES BROADCAST NOTIFIKASI MASSAL KE API ---
  const handleSendBroadcast = async () => {
    if (selectedTargets.size === 0) return;

    setIsSending(true);
    setSendStatus("sending");
    const targetArray = Array.from(selectedTargets);
    
    setSendProgress({
      current: 0,
      total: targetArray.length,
      success: 0,
      failed: 0
    });

    for (let i = 0; i < targetArray.length; i++) {
      const targetId = targetArray[i];

      try {
        // Tembakkan langsung ke API send-notification internal Next.js Anda untuk push FCM perangkat
        const response = await fetch("/api/notifications/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            targetUserId: targetId,
            title: notification.title,
            body: notification.body,
            targetPath: notification.targetPath
          })
        });

        if (response.ok) {
          setSendProgress(prev => ({ ...prev, current: i + 1, success: prev.success + 1 }));
        } else {
          setSendProgress(prev => ({ ...prev, current: i + 1, failed: prev.failed + 1 }));
        }
      } catch (error) {
        setSendProgress(prev => ({ ...prev, current: i + 1, failed: prev.failed + 1 }));
      }

      // Jeda 300ms antar pengiriman untuk menghindari pemblokiran batas kuota FCM (Anti-Throttling)
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setSendStatus("completed");
    setIsSending(false);
  };

  const toggleTarget = (id: string) => {
    const next = new Set(selectedTargets);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTargets(next);
  };

  const toggleSelectAll = () => {
    if (selectedTargets.size === filteredTargets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(filteredTargets.map(t => t.id)));
    }
  };

  const filteredTargets = targets.filter(t => 
    t.kelompok_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
              <Bell className="animate-bounce" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Siaran Pengingat Laporan</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Kirim notifikasi dorong ke Admin Kelompok yang belum menyelesaikan input data laporan bulanan.</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-2">
            <Sparkles size={14} /> Level: Admin Desa ke Admin Kelompok
          </div>
        </div>

        {/* UTAMA: KIRI KONTROL & DAFTAR, KANAN MOBILE PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI (KONTROL DAN TARGET) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PANEL KONFIGURASI */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="text-blue-600" size={20} /> Langkah 1: Tentukan Kategori Laporan & Periode
              </h2>
              
              {/* Pilihan Kasus / Case */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={() => setActiveCase(1)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between h-28 ${activeCase === 1 ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-600' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <span className="font-black text-xs text-blue-600 uppercase tracking-widest">Case 1</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-white">Laporan Muslimun (Meeting Reports)</span>
                </button>
                <button 
                  onClick={() => setActiveCase(2)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between h-28 ${activeCase === 2 ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-600' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <span className="font-black text-xs text-blue-600 uppercase tracking-widest">Case 2</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-white">Laporan Kehadiran (Attendance Recap)</span>
                </button>
                <button 
                  onClick={() => setActiveCase(3)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between h-28 ${activeCase === 3 ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-600' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <span className="font-black text-xs text-blue-600 uppercase tracking-widest">Case 3</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-white">Laporan Penilaian (Evaluation Recap)</span>
                </button>
              </div>

              {/* Pemilihan Periode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Bulan Laporan</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="w-full p-3 pl-12 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white border-none outline-none font-bold text-sm text-slate-700 focus:ring-2 ring-blue-500"
                    >
                      {MONTHS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Tahun Laporan</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white border-none outline-none font-bold text-sm text-slate-700 focus:ring-2 ring-blue-500"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* DAFTAR TARGET YANG DI-SCAN */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Users className="text-blue-600" size={20} /> Langkah 2: Target Terdeteksi ({filteredTargets.length})
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Daftar Admin Kelompok yang belum menyetor laporan pada periode di atas.</p>
                </div>

                <button 
                  onClick={handleScanTargets}
                  disabled={isScanning}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all active:scale-95"
                >
                  <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} /> Pindai Ulang
                </button>
              </div>

              {/* SEARCH BAR & SELECT ALL */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari kelompok atau nama admin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2.5 pl-10 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white border-none outline-none text-xs font-bold focus:ring-2 ring-blue-500"
                  />
                </div>
                {targets.length > 0 && (
                  <button 
                    onClick={toggleSelectAll}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-600 hover:bg-slate-100 transition-all"
                  >
                    {selectedTargets.size === filteredTargets.length ? "Batalkan Semua" : "Pilih Semua"}
                  </button>
                )}
              </div>

              {/* TAMPILAN JIKA TERJADI ERROR */}
              {errorMsg && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle size={18} /> {errorMsg}
                </div>
              )}

              {/* CONTENT LIST */}
              {isScanning ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Menganalisis data laporan di Supabase...</p>
                </div>
              ) : filteredTargets.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <CheckCircle2 size={44} className="text-green-500 mx-auto" />
                  <p className="font-black text-slate-700 dark:text-white text-base">Semua Sektor Tertib!</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">Alhamdulillah, seluruh admin kelompok terpantau sudah menyelesaikan pengisian laporan.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredTargets.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => toggleTarget(t.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedTargets.has(t.id) 
                          ? 'border-blue-600 bg-blue-50/20' 
                          : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox Indikator */}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                          selectedTargets.has(t.id) 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750'
                        }`}>
                          {selectedTargets.has(t.id) && <Check size={14} />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-800 dark:text-white">{t.kelompok_name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mt-1">
                            <span>Admin: {t.name}</span>
                            <span>•</span>
                            <span className="text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md text-[10px]">BELUM INPUT</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 hidden sm:inline">{t.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AKSI PENGIRIMAN & BAR PROGRES */}
            {selectedTargets.size > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Target Siap Kirim: <span className="font-black text-blue-600">{selectedTargets.size} Perangkat Mobile</span></span>
                  {!isSending && (
                    <button 
                      onClick={handleSendBroadcast}
                      className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm shadow-xl shadow-blue-600/30 transition-all active:scale-95"
                    >
                      <Send size={16} /> MULAI KIRIM NOTIFIKASI
                    </button>
                  )}
                </div>

                {/* Loading / progress bar jika sedang mengirim */}
                {sendStatus === "sending" && (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <Loader2 className="animate-spin" size={14} /> Memproses Antrean...
                      </span>
                      <span>{sendProgress.current} / {sendProgress.total} Selesai</span>
                    </div>
                    {/* Bar Progres */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                        style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-400">
                      <span>Sukses: <span className="text-green-600">{sendProgress.success}</span></span>
                      <span>Gagal: <span className="text-red-500">{sendProgress.failed}</span></span>
                    </div>
                  </div>
                )}

                {sendStatus === "completed" && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-2xl flex items-center justify-between text-green-800 dark:text-green-400">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-green-600" />
                      <div>
                        <p className="font-black text-sm">Pengiriman Selesai!</p>
                        <p className="text-xs font-bold text-green-700/80">
                          Berhasil terkirim & tersimpan ke riwayat sebanyak {sendProgress.success} perangkat, gagal {sendProgress.failed}.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSendStatus("idle")}
                      className="text-xs font-black underline hover:text-green-900"
                    >
                      Tutup
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* KOLOM KANAN (PREVIEW MOBILE PUSH NOTIFICATION) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <Smartphone className="text-blue-600" size={20} /> Layar Mockup Ponsel
              </h2>
              <p className="text-xs text-slate-400 font-medium mb-8">Berikut adalah rupa notifikasi yang akan diterima oleh admin kelompok terpilih.</p>

              {/* HANDPHONE SHELL MOCKUP */}
              <div className="mx-auto w-[260px] h-[520px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-800">
                {/* Notch atas hp */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
                  <div className="w-10 h-1 bg-slate-800 rounded-full" />
                </div>

                {/* Layar Dalam */}
                <div className="w-full h-full bg-slate-950 rounded-[2.5rem] p-4 relative overflow-hidden flex flex-col justify-start pt-12 text-white">
                  
                  {/* Lockscreen Time */}
                  <div className="text-center space-y-1 mb-8">
                     <span className="text-3xl font-black font-mono">10:02</span>
                     <p className="text-[10px] uppercase font-bold text-slate-400">Minggu, 17 Mei</p>
                  </div>

                  {/* NOTIFIKASI PUSH YANG DITERIMA */}
                  <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-2xl backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 text-left space-y-2 relative z-10">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-md flex items-center justify-center">
                          <Bell size={10} fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-black tracking-wide text-slate-300">PJPSUPERAPP</span>
                      </div>
                      <span className="text-[8px] text-slate-500 font-bold">baru saja</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white">{notification.title}</h4>
                      <p className="text-[10px] text-slate-300 leading-normal font-medium font-sans">
                        {notification.body}
                      </p>
                    </div>

                    {/* Path Target indicator */}
                    <div className="pt-2 border-t border-slate-800 text-[8px] font-bold text-blue-400 flex items-center gap-1">
                      <span>Rute: {notification.targetPath}</span>
                    </div>
                  </div>

                  {/* Home indicator bar di bagian bawah */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>

              {/* Detail Tautan URL untuk Tap */}
              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-medium space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Tujuan Redirect Tap</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 dark:text-blue-400 font-bold truncate max-w-[200px]">
                    {notification.externalLink}
                  </span>
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-100 rounded-md text-[9px] font-bold">
                    Web & Mobile
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* FOOTER INFO */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          <Info size={16} className="text-blue-600 flex-shrink-0" />
          <span className="space-y-1">
            <p><strong>Integrasi Penyimpanan Riwayat Aktif:</strong> Pemindaian ini sepenuhnya dijalankan melalui server-side API `/api/notifications/scan` menggunakan otorisasi <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-blue-600 dark:text-blue-300 font-bold">service_role</code>.</p>
            <p className="text-slate-400">Dengan demikian, RLS pada tabel <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-blue-600">profile</code> Anda dapat tetap dipertahankan sangat ketat tanpa perlu melonggarkan celah keamanan dari sisi browser pengguna!</p>
          </span>
        </div>

      </div>
    </div>
  );
}