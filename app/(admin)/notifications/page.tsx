"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  MailOpen, 
  Loader2, 
  Search, 
  Plus,
  BookOpen,
  Timer,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

export default function NotificationsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // State Kotak Masuk (Inbox)
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // --- ACTIONS UTAMA INBOX ---
  const handleMarkAllRead = async () => {
    if (!userId || notifications.length === 0) return;
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
              <Link 
                href="/notifications/console"
                className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs tracking-wider uppercase shadow-xl shadow-blue-600/30 transition-all active:scale-95"
              >
                <Plus size={16} /> Kirim Notifikasi
              </Link>
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
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
                  activeTab === "all" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                )}
              >
                <span>Semua Pesan</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 font-bold">{notifications.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
                  activeTab === "unread" ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                )}
              >
                <span>Belum Dibaca</span>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase animate-pulse">{unreadCount}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab("read")}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
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
    </div>
  );
}