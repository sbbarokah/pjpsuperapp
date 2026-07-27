"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect, SetStateAction } from "react";
import { BellIcon } from "./icons";
import { createClient } from "@/lib/supabase/client";
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Timer, 
  Trophy,
  Loader2,
  MailOpen
} from "lucide-react";

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

export function Notification() {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // 1. Ambil Data Sesi Pengguna & Notifikasi Awal
  useEffect(() => {
    const initNotifications = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Ambil 10 notifikasi terbaru milik user ini
          const { data, error } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (!error && data) {
            setNotifications(data as DbNotification[]);
            // Hitung jumlah yang belum dibaca
            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
          }
        }
      } catch (err) {
        console.error("Gagal memuat notifikasi:", err);
      } finally {
        setLoading(false);
      }
    };

    initNotifications();
  }, [supabase]);

  // 2. Integrasikan Supabase Realtime (Dengar notifikasi baru secara instan!)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as DbNotification;
          
          // Tambahkan ke daftar state teratas
          setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
          setUnreadCount((prev) => prev + 1);

          // Opsional: Bunyikan notifikasi ringtone kecil di aplikasi
          try {
            const audio = new Audio("/sounds/notification.mp3");
            audio.volume = 0.5;
            audio.play();
          } catch (e) {
            // Browser memblokir autoplay audio sebelum user berinteraksi
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // 3. Tandai Semua Sebagai Dibaca saat Dropdown Dibuka
  const handleOpenDropdown = async (value: SetStateAction<boolean>) => {
    // Mengevaluasi nilai state berikutnya jika dikirim sebagai fungsi callback pengubah state
    const nextOpen = typeof value === "function" ? (value as (prev: boolean) => boolean)(isOpen) : value;
    setIsOpen(nextOpen);

    if (nextOpen && unreadCount > 0 && userId) {
      // Set lokal dulu agar UI terasa responsif (Optimistic Update)
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      // Update status di database Supabase
      try {
        await supabase
          .from("user_notifications")
          .update({ is_read: true })
          .eq("user_id", userId)
          .eq("is_read", false);
      } catch (err) {
        console.error("Gagal memperbarui status baca:", err);
      }
    }
  };

  // 4. Logika Pemilihan Ikon Berdasarkan Kategori Laporan / Target Path
  const renderNotificationIcon = (item: DbNotification) => {
    if (item.target_path.includes("muslimun")) {
      return (
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
          <BookOpen size={20} />
        </div>
      );
    }
    if (item.target_path.includes("attendance")) {
      return (
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
          <Timer size={20} />
        </div>
      );
    }
    if (item.target_path.includes("evaluation")) {
      return (
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
          <Trophy size={20} />
        </div>
      );
    }
    
    // Default Icon
    return (
      <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
        <Bell size={20} />
      </div>
    );
  };

  // Format Waktu Relatif Sederhana (contoh: "3 mnt yang lalu")
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins}m yang lalu`;
    if (diffHours < 24) return `${diffHours}j yang lalu`;
    return `${diffDays}h yang lalu`;
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={handleOpenDropdown}>
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {/* Badge Lonceng Menyala jika Ada yang Belum Dibaca */}
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-4 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[22rem] max-w-[24rem] rounded-3xl"
      >
        {/* HEADER DROPDOWN */}
        <div className="mb-3 flex items-center justify-between px-2 py-1">
          <span className="text-base font-black text-dark dark:text-white uppercase tracking-tight">
            Kotak Masuk
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red px-2.5 py-0.5 text-[10px] font-black uppercase text-white animate-pulse">
              {unreadCount} Baru
            </span>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-xs font-bold uppercase tracking-wider">Memuat Pesan...</span>
          </div>
        ) : notifications.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
              <MailOpen size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Tidak Ada Notifikasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] mx-auto">Semua pengingat dan pesan penting Anda akan muncul di sini.</p>
            </div>
          </div>
        ) : (
          /* NOTIFICATION LIST */
          <ul className="mb-4 max-h-[23rem] space-y-1.5 overflow-y-auto pr-1">
            {notifications.map((item) => (
              <li key={item.id} role="menuitem">
                <Link
                  href={item.target_path || "#"}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl p-3 outline-none transition-all hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3 border-2",
                    !item.is_read 
                      ? "bg-blue-50/20 border-blue-100/55 dark:bg-blue-950/10 dark:border-blue-900/30" 
                      : "bg-white dark:bg-transparent border-transparent"
                  )}
                >
                  {/* Dynamic Beautiful Icon */}
                  {renderNotificationIcon(item)}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className={cn(
                        "block text-xs truncate text-dark dark:text-white uppercase tracking-tight",
                        !item.is_read ? "font-black text-blue-600 dark:text-blue-400" : "font-bold text-slate-700"
                      )}>
                        {item.title}
                      </strong>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium font-sans">
                      {item.body}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* BUTTON ACTION FOOTER */}
        <Link
          href="/notifications"
          onClick={() => setIsOpen(false)}
          className="block rounded-xl border-2 border-primary/20 py-3 text-center text-xs font-black uppercase tracking-widest text-primary outline-none transition-all hover:bg-primary hover:text-white focus:bg-primary focus:text-white dark:border-dark-3 dark:text-dark-6"
        >
          Lihat Semua Notifikasi
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}