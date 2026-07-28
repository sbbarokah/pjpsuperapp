"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BellIcon } from "./icons";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  BookOpen,
  Timer,
  Trophy,
  Loader2,
  MailOpen,
  X,
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

  // 1. Ambil data sesi & notifikasi awal
  useEffect(() => {
    const initNotifications = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (!error && data) {
            setNotifications(data as DbNotification[]);
            setUnreadCount(data.filter((n) => !n.is_read).length);
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

  // 2. Supabase Realtime
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
          setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
          setUnreadCount((prev) => prev + 1);
          try {
            const audio = new Audio("/sounds/notification.mp3");
            audio.volume = 0.5;
            audio.play();
          } catch (e) {
            // Autoplay mungkin diblokir
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // 3. Tandai semua sebagai dibaca saat modal dibuka
  const handleOpenModal = () => {
    setIsOpen(true);
    if (unreadCount > 0 && userId) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .then(({ error }) => {
          if (error) console.error("Gagal update status baca:", error);
        });
    }
  };

  const handleCloseModal = () => setIsOpen(false);

  // 4. Ikon per kategori
  const renderNotificationIcon = (item: DbNotification) => {
    if (item.target_path.includes("muslimun")) {
      return (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-inner dark:bg-blue-900/30 dark:text-blue-400">
          <BookOpen size={20} />
        </div>
      );
    }
    if (item.target_path.includes("attendance")) {
      return (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner dark:bg-emerald-900/30 dark:text-emerald-400">
          <Timer size={20} />
        </div>
      );
    }
    if (item.target_path.includes("evaluation")) {
      return (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-inner dark:bg-amber-900/30 dark:text-amber-400">
          <Trophy size={20} />
        </div>
      );
    }
    return (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
        <Bell size={20} />
      </div>
    );
  };

  // Waktu relatif
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
    <>
      {/* Tombol Pemicu */}
      <Link
        href="/notifications"
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
      >
        <span className="relative">
          <BellIcon />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red ring-2 ring-gray-2 dark:ring-dark-3"
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red opacity-75" />
            </span>
          )}
        </span>
      </Link>
      {/* <button
        onClick={handleOpenModal}
        aria-label="Lihat Notifikasi"
      >
        <span className="relative">
          <BellIcon />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red ring-2 ring-gray-2 dark:ring-dark-3"
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red opacity-75" />
            </span>
          )}
        </span>
      </button> */}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
            aria-hidden="true"
          />

          {/* Panel Modal */}
          <div
            className={cn(
              "relative z-10 w-full max-w-md max-h-[80vh] overflow-hidden rounded-3xl border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-dark",
              isMobile ? "max-h-[90vh]" : ""
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Kotak Masuk Notifikasi"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-3">
              <h2 className="text-base font-black uppercase tracking-tight text-dark dark:text-white">
                Kotak Masuk
              </h2>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red px-2.5 py-0.5 text-[10px] font-black uppercase text-white animate-pulse">
                    {unreadCount} Baru
                  </span>
                )}
                <button
                  onClick={handleCloseModal}
                  className="rounded-full p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600 dark:hover:bg-dark-3 dark:hover:text-white"
                  aria-label="Tutup"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[55vh] p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Memuat Pesan...
                  </span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="space-y-3 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
                    <MailOpen size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Tidak Ada Notifikasi
                    </p>
                    <p className="mx-auto mt-0.5 max-w-[200px] text-[11px] text-slate-400">
                      Semua pengingat dan pesan penting Anda akan muncul di sini.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {notifications.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.target_path || "#"}
                        onClick={handleCloseModal}
                        className={cn(
                          "flex items-start gap-4 rounded-2xl border-2 p-3 outline-none transition-all hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
                          !item.is_read
                            ? "border-blue-100/55 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/10"
                            : "border-transparent bg-white dark:bg-transparent"
                        )}
                      >
                        {renderNotificationIcon(item)}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <strong
                              className={cn(
                                "block truncate text-xs uppercase tracking-tight text-dark dark:text-white",
                                !item.is_read
                                  ? "font-black text-blue-600 dark:text-blue-400"
                                  : "font-bold text-slate-700"
                              )}
                            >
                              {item.title}
                            </strong>
                            <span className="whitespace-nowrap text-[9px] font-bold text-slate-400">
                              {formatTimeAgo(item.created_at)}
                            </span>
                          </div>
                          <p className="text-xs font-medium leading-normal text-slate-500 dark:text-slate-400">
                            {item.body}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3 dark:border-dark-3">
              <Link
                href="/notifications"
                onClick={handleCloseModal}
                className="block rounded-xl border-2 border-primary/20 py-3 text-center text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-white focus:bg-primary focus:text-white dark:border-dark-3 dark:text-dark-6"
              >
                Lihat Semua Notifikasi
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}