"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  MailOpen, 
  Loader2, 
  Search, 
  AlertCircle,
  Send,
  Smartphone,
  Layers,
  Sparkles,
  Calendar,
  X,
  Plus,
  BookOpen,
  Timer,
  Trophy,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * CATATAN PENTING UNTUK PROYEK LOKAL ANDA:
 * Di pratinjau Canvas, beberapa impor dari alias lokal dinonaktifkan sementara agar kompilasi lancar.
 * Saat Anda memasang berkas ini di repositori lokal, silakan aktifkan kembali:
 * * 
 */

// --- MODEL DATA NOTIFIKASI ---
interface DbNotification {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  body: string;
  target_path: string;
  is_read: boolean;
  category: string;
}

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

export default function NotificationsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // State Kotak Masuk (Inbox)
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal Penyiaran (Broadcast Modal)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeCase, setActiveCase] = useState<1 | 2 | 3 | 4>(1); // Case 4 untuk pesan kustom
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  
  // State Scanning & Pengiriman
  const [isScanning, setIsScanning] = useState(false);
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "completed">("idle");

  // 1. Memuat Sesi Pengguna & Kotak Masuk Notifikasi
  useEffect(() => {
    const loadInbox = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Memuat Profil Otorisasi
          const { data: prof } = await supabase
            .from("profile")
            .select("user_id, role, village_id, full_name")
            .eq("user_id", user.id)
            .single();
          
          if (prof) setProfile(prof);

          // Memuat Riwayat Notifikasi Pengguna
          const { data: notifData } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (notifData) {
            setNotifications(notifData as DbNotification[]);
          }
        }
      } catch (err) {
        console.error("Gagal menyelaraskan kotak masuk:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInbox();
  }, []);

  // --- REAL-TIME LISTENER ---
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`inbox_notifications_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // --- LOGIKA SIARAN DINAMIS (ADMIN ONLY) ---
  const handleScanTargets = async () => {
    if (!profile?.village_id) return;
    setIsScanning(true);
    setTargets([]);
    setSelectedTargets(new Set());

    try {
      // Ambil daftar admin kelompok binaan
      const { data: kelompokAdmins } = await supabase
        .from("profile")
        .select("user_id, full_name, group_id, group(name)")
        .eq("role", "admin_kelompok")
        .eq("village_id", profile.village_id);

      if (!kelompokAdmins || kelompokAdmins.length === 0) {
        setIsScanning(false);
        return;
      }

      // Saring berdasarkan laporan kosong jika Case 1, 2, atau 3
      if (activeCase !== 4) {
        const reportTable = activeCase === 1 ? "meeting_reports" : 
                            activeCase === 2 ? "attendance_recap" : "evaluation_recap";

        const { data: submittedReports } = await supabase
          .from(reportTable)
          .select("group_id")
          .eq("period_month", selectedMonth)
          .eq("period_year", selectedYear);

        const submittedGroupIds = new Set(submittedReports?.map(r => Number(r.group_id)) || []);
        
        const filtered = kelompokAdmins.filter(
          (admin: any) => admin.group_id && !submittedGroupIds.has(Number(admin.group_id))
        );

        const results = filtered.map((admin: any) => ({
          id: admin.user_id,
          name: admin.full_name,
          kelompok_name: admin.group?.name || "Kelompok Lain"
        }));

        setTargets(results);
        setSelectedTargets(new Set(results.map((t: any) => t.id)));
      } else {
        // Jika kustom, targetkan ke semua kelompok binaan di desa tersebut
        const results = kelompokAdmins.map((admin: any) => ({
          id: admin.user_id,
          name: admin.full_name,
          kelompok_name: admin.group?.name || "Kelompok Lain"
        }));
        setTargets(results);
        setSelectedTargets(new Set(results.map((t: any) => t.id)));
      }
    } catch (err) {
      console.error("Gagal melakukan scanning:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Triger scan ulang tiap parameter penyiaran berubah
  useEffect(() => {
    if (isBroadcastOpen) {
      handleScanTargets();
    }
  }, [selectedMonth, selectedYear, activeCase, isBroadcastOpen]);

  // --- BROADCAST SUBMIT HANDLER ---
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

    const activeNotification = getBroadcastPayload();

    for (let i = 0; i < targetArray.length; i++) {
      const targetId = targetArray[i];

      try {
        // 1. Simpan riwayat di DB user_notifications
        await supabase.from("user_notifications").insert({
          user_id: targetId,
          title: activeNotification.title,
          body: activeNotification.body,
          target_path: activeNotification.targetPath,
          is_read: false,
          category: "reminder"
        });

        // 2. Hubungi API send-notification untuk push FCM
        const response = await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: targetId,
            title: activeNotification.title,
            body: activeNotification.body,
            targetPath: activeNotification.targetPath
          })
        });

        if (response.ok) {
          setSendProgress(prev => ({ ...prev, current: i + 1, success: prev.success + 1 }));
        } else {
          setSendProgress(prev => ({ ...prev, current: i + 1, failed: prev.failed + 1 }));
        }
      } catch (err) {
        setSendProgress(prev => ({ ...prev, current: i + 1, failed: prev.failed + 1 }));
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setSendStatus("completed");
    setIsSending(false);
  };

  // Payload Generator sesuai konfigurasi kasus
  const getBroadcastPayload = () => {
    const monthName = MONTHS.find(m => m.id === selectedMonth)?.name || "";
    const periodText = `${monthName} ${selectedYear}`;

    if (activeCase === 4) {
      return {
        title: customTitle || "Pengumuman 📢",
        body: customBody || "Mohon periksa pembaruan terbaru di aplikasi Anda.",
        targetPath: "/"
      };
    }

    switch (activeCase) {
      case 1:
        return {
          title: "Pengingat Laporan Muslimun 📢",
          body: "Amal sholeh laporan muslimun segera di input ke PJPSuperApp. Atas amal sholehnya disyukuri Alhamdulillaahi jazaa kumulloohu khoiro",
          targetPath: "/muslimun"
        };
      case 2:
        return {
          title: "Pengingat Laporan Kehadiran 📝",
          body: `Amal sholeh laporan kehadiran generus pada bulan ${periodText} segera di input ke PJPSuperApp. Atas amal sholehnya disyukuri Alhamdulillaahi jazaa kumulloohu khoiro`,
          targetPath: "/kbmattendance"
        };
      case 3:
        return {
          title: "Pengingat Laporan Penilaian 🏆",
          body: `Amal sholeh laporan penilaian generus pada bulan ${periodText} segera di input ke PJPSuperApp. Atas amal sholehnya disyukuri Alhamdulillaahi jazaa kumulloohu khoiro`,
          targetPath: "/kbmevaluation"
        };
    }
  };

  const activeBroadcastPayload = getBroadcastPayload();

  // --- ACTIONS UTAMA INBOX ---
  const handleMarkAllRead = async () => {
    if (!userId || notifications.length === 0) return;
    
    // [PERBAIKAN]: unreadCount adalah computed state dari array notifications, 
    // jadi dengan meng-update properti is_read di state notifications menjadi true,
    // nilai unreadCount akan otomatis dihitung ulang menjadi 0. setUnreadCount(0) dihapus.
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    await supabase.from("user_notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  };

  const handleDeleteNotif = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from("user_notifications").delete().eq("id", id);
  };

  const handleClearAll = async () => {
    if (!userId || !window.confirm("Kosongkan seluruh isi kotak masuk Anda?")) return;
    setNotifications([]);
    await supabase.from("user_notifications").delete().eq("user_id", userId);
  };

  // --- FILTER & RENDER LOGIC ---
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.body.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "unread") return !n.is_read;
      if (activeTab === "read") return n.is_read;
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // unreadCount dihitung secara dinamis dari state notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

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
    if (selectedTargets.size === targets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(targets.map(t => t.id)));
    }
  };

  const renderIcon = (path: string) => {
    if (path.includes("muslimun")) return <BookOpen className="text-blue-600" size={20} />;
    if (path.includes("attendance")) return <Timer className="text-emerald-600" size={20} />;
    if (path.includes("evaluation")) return <Trophy className="text-amber-600" size={20} />;
    return <Bell className="text-purple-600" size={20} />;
  };

  // Otorisasi pengirim siaran
  const isAuthorizedToSend = profile && ["admin_desa", "admin_daerah", "superadmin"].includes(profile.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
              <Bell className="animate-pulse" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Kotak Masuk Notifikasi</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Kelola dan pantau semua pengingat yang Anda terima dari pusat.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorizedToSend && (
              <button 
                onClick={() => setIsBroadcastOpen(true)}
                className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs tracking-wider uppercase shadow-xl shadow-blue-600/30 transition-all active:scale-95"
              >
                <Plus size={16} /> Kirim Notifikasi
              </button>
            )}
          </div>
        </div>

        {/* KONTEN UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* TAB / FILTER MENU (KIRI) */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-3 mb-2">Filter</span>
              <button 
                onClick={() => setActiveTab("all")}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === "all" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                )}
              >
                <span>Semua Pesan</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 font-bold">{notifications.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === "unread" ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                )}
              >
                <span>Belum Dibaca</span>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red text-white text-[9px] font-black uppercase animate-pulse">{unreadCount}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab("read")}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === "read" ? "bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                )}
              >
                <span>Sudah Dibaca</span>
              </button>
            </div>

            {/* BATCH ACTIONS */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="w-full py-3 bg-white dark:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Check size={16} /> Tandai Semua Dibaca
              </button>
              <button 
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="w-full py-3 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> Bersihkan Kotak Masuk
              </button>
            </div>
          </div>

          {/* LIST NOTIFIKASI (KANAN) */}
          <div className="md:col-span-3 space-y-4">
            
            {/* SEARCH BOX */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari kata kunci notifikasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3.5 pl-12 rounded-2xl border-none bg-white dark:bg-slate-800 outline-none text-sm font-bold shadow-sm placeholder-slate-400"
              />
            </div>

            {/* LIST UTAMA */}
            {loading ? (
              <div className="py-24 text-center space-y-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
                <p className="text-slate-400 font-bold text-sm">Menyelaraskan kotak masuk...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border-4 border-dashed border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500">
                  <MailOpen size={32} />
                </div>
                <div>
                   <p className="font-bold text-slate-600 dark:text-slate-300 text-lg">Kotak Masuk Kosong</p>
                   <p className="text-xs text-slate-400 mt-1">Tidak ada notifikasi penting untuk kriteria pencarian ini.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "group p-5 rounded-3xl border-2 transition-all flex items-start gap-4 relative",
                      !notif.is_read 
                        ? "bg-blue-50/20 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30" 
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-md"
                    )}
                  >
                    {/* Dynamic Beautiful Icon */}
                    <div className="p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-sm">
                      {renderIcon(notif.target_path)}
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <strong className={cn(
                          "text-sm font-black tracking-tight",
                          !notif.is_read ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"
                        )}>
                          {notif.title}
                        </strong>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
                        {notif.body}
                      </p>

                      {notif.target_path !== "/" && (
                        <a 
                          href={notif.target_path}
                          className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Buka Laporan Terkait &rarr;
                        </a>
                      )}
                    </div>

                    {/* ACTION DELETE NOTIF */}
                    <button 
                      onClick={() => handleDeleteNotif(notif.id)}
                      className="absolute right-4 top-5 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ==========================================
          MODAL / SLIDING BROADCAST CONSOLE
      ========================================== */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30">
                  <Bell size={20} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Konsol Siaran Notifikasi</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Admin Desa &rarr; Admin Kelompok</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBroadcastOpen(false)}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Kolom Kiri: Form & Konfigurasi (3/5) */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 1. Pilih Jenis Case */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Siaran Pengingat</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setActiveCase(1)}
                      className={cn(
                        "p-3 text-left border-2 rounded-2xl text-xs font-bold transition-all",
                        activeCase === 1 ? "border-blue-600 bg-blue-50/20 text-blue-700" : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      Muslimun (Case 1)
                    </button>
                    <button 
                      onClick={() => setActiveCase(2)}
                      className={cn(
                        "p-3 text-left border-2 rounded-2xl text-xs font-bold transition-all",
                        activeCase === 2 ? "border-blue-600 bg-blue-50/20 text-blue-700" : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      Kehadiran (Case 2)
                    </button>
                    <button 
                      onClick={() => setActiveCase(3)}
                      className={cn(
                        "p-3 text-left border-2 rounded-2xl text-xs font-bold transition-all",
                        activeCase === 3 ? "border-blue-600 bg-blue-50/20 text-blue-700" : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      Penilaian (Case 3)
                    </button>
                    <button 
                      onClick={() => setActiveCase(4)}
                      className={cn(
                        "p-3 text-left border-2 rounded-2xl text-xs font-bold transition-all",
                        activeCase === 4 ? "border-blue-600 bg-blue-50/20 text-blue-700" : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      Pesan Bebas (Case 4)
                    </button>
                  </div>
                </div>

                {/* 2. Form Input Kondisional */}
                {activeCase === 4 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Pesan Kustom</label>
                      <input 
                        type="text" 
                        value={customTitle} 
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Contoh: Undangan Rapat Koordinasi"
                        className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700 outline-none text-sm font-bold border-2 border-transparent focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Isi Notifikasi</label>
                      <textarea 
                        rows={3}
                        value={customBody} 
                        onChange={(e) => setCustomBody(e.target.value)}
                        placeholder="Masukkan isi pesan pengumuman..."
                        className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700 outline-none text-sm font-semibold border-2 border-transparent focus:border-blue-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan</label>
                      <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full p-3 text-sm rounded-xl outline-none font-bold"
                      >
                        {MONTHS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun</label>
                      <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full p-3 text-sm rounded-xl outline-none font-bold"
                      >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* 3. Daftar Target Hasil Scan */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Penerima Terdeteksi ({targets.length})
                    </label>
                    {targets.length > 0 && (
                      <button 
                        type="button" 
                        onClick={toggleSelectAll} 
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        {selectedTargets.size === targets.length ? "Hapus Semua" : "Pilih Semua"}
                      </button>
                    )}
                  </div>

                  {isScanning ? (
                    <div className="py-10 text-center space-y-2">
                      <Loader2 className="animate-spin text-blue-600 mx-auto" size={24} />
                      <p className="text-xs font-bold text-slate-400">Mencari laporan yang kosong...</p>
                    </div>
                  ) : targets.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-xs font-bold text-slate-400">
                      Alhamdulillah, semua sektor tertib / tidak ada target.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                      {targets.map((t) => (
                        <div 
                          key={t.id}
                          onClick={() => toggleTarget(t.id)}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                            selectedTargets.has(t.id) ? "border-blue-500 bg-blue-50/20" : "border-slate-100 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center",
                              selectedTargets.has(t.id) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                            )}>
                              {selectedTargets.has(t.id) && <Check size={12} />}
                            </div>
                            <span>{t.kelompok_name} ({t.name})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Kolom Kanan: Pratinjau Ponsel / Live Mockup (2/5) */}
              <div className="lg:col-span-2 flex flex-col justify-between border-l border-slate-100 pl-6 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone size={14} /> Pratinjau Tampilan Ponsel
                  </label>

                  {/* Ponsel Mockup */}
                  <div className="mx-auto w-[220px] h-[360px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-850 flex flex-col justify-between pt-6 pb-2 text-white relative">
                     {/* Notch */}
                     <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-900 rounded-full" />
                     
                     <div className="px-3">
                       <div className="bg-slate-800/90 border border-slate-700/30 p-2.5 rounded-xl backdrop-blur-md text-left space-y-1 relative z-10 shadow">
                         <span className="text-[8px] font-black text-slate-400">PJPSUPERAPP</span>
                         <h5 className="text-[10px] font-black text-white leading-tight">{activeBroadcastPayload.title}</h5>
                         <p className="text-[8px] text-slate-300 leading-normal font-medium line-clamp-4">
                           {activeBroadcastPayload.body}
                         </p>
                       </div>
                     </div>

                     <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto" />
                  </div>
                </div>

                {/* Progress Bar / Send Button */}
                <div className="space-y-4">
                  {sendStatus === "sending" ? (
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="flex items-center gap-1.5"><Loader2 className="animate-spin text-blue-600" /> Memproses...</span>
                        <span>{sendProgress.current} / {sendProgress.total}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }} />
                      </div>
                    </div>
                  ) : sendStatus === "completed" ? (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-center text-xs font-bold">
                       🏆 Penyiaran selesai! Sukses {sendProgress.success}, Gagal {sendProgress.failed}.
                    </div>
                  ) : (
                    <button
                      onClick={handleSendBroadcast}
                      disabled={selectedTargets.size === 0 || isSending}
                      className="w-full py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl text-sm shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Send size={16} /> SIARKAN SEKARANG
                    </button>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}