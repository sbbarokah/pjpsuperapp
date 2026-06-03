"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  History, 
  ClipboardCheck, 
  ListTodo, 
  FileText, 
  Clock, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";


export default function ActivityLogPage() {
  const supabase = createClient();
  
  // State Filter Utama
  const [activeTab, setActiveTab] = useState<"all" | "muslimun" | "attendance" | "evaluation">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State Pagination & Size
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // Master State Data
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState<{ show: boolean; title: string; text: string } | null>(null);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Ambil data master untuk mapping nama
      const [gRes, cRes] = await Promise.all([
        supabase.from("group").select("id, name"),
        supabase.from("category").select("id, name")
      ]);
      setGroups(gRes.data || []);
      setCategories(cRes.data || []);

      // 2. Ambil data dari view (tanpa join)
      const { data, error } = await supabase
        .from("activity_log_view")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) setAllActivities(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Membuat Lookup Map
  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g.name])), [groups]);
  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  // Format Waktu Relatif via date-fns locale Indonesia
  const timeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: id 
      });
    } catch (error) {
      return dateString;
    }
  };

  // Reset penunjuk halaman ke posisi 1 jika kriteria filter diganti oleh user
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemsPerPage]);

  // 2. Pemrosesan Data: Memfilter Log berdasarkan Tab Aktif & Pencarian Nama Kelompok Binaan
  const filteredActivities = useMemo(() => {
    return allActivities.filter((item) => {
      if (activeTab !== "all" && item.activity_type !== activeTab) return false;
      const groupName = groupMap.get(item.group_id) || "";
      const catName = catMap.get(item.category_id) || "";
      const searchLower = searchQuery.toLowerCase();
      return groupName.toLowerCase().includes(searchLower) || catName.toLowerCase().includes(searchLower);
    });
  }, [allActivities, activeTab, searchQuery, groupMap, catMap]);

  // 3. Statistik Ringkas Total Counter Badge yang Adaptif terhadap Pencarian
  const counts = useMemo(() => {
    return {
      all: filteredActivities.length,
      muslimun: filteredActivities.filter(item => item.activity_type === 'muslimun').length,
      attendance: filteredActivities.filter(item => item.activity_type === 'attendance').length,
      evaluation: filteredActivities.filter(item => item.activity_type === 'evaluation').length,
    };
  }, [filteredActivities]);

  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedActivities = useMemo(() => {
    return filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredActivities, currentPage, itemsPerPage]);

  // Render Ikon Visual Indikator Kategori Laporan secara Cepat
  const renderActivityMeta = (type: 'attendance' | 'evaluation' | 'muslimun') => {
    switch (type) {
      case "attendance":
        return {
          label: "Input Presensi",
          route: "kbmattendance",
          iconStyle: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
          icon: <ClipboardCheck size={14} />
        };
      case "evaluation":
        return {
          label: "Input Penilaian",
          route: "kbmevaluation",
          iconStyle: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
          icon: <ListTodo size={14} />
        };
      case "muslimun":
        return {
          label: "Laporan Muslimun",
          route: "muslimun",
          iconStyle: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
          icon: <FileText size={14} />
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-lg">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight dark:text-white">Log Aktivitas Sistem</h1>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Audit log menyeluruh berkas input laporan mutasi berkala seluruh sektor kelompok.</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-primary transition-colors bg-slate-100 dark:bg-slate-700 px-4 py-2.5 rounded-xl self-start sm:self-center"
          >
            &larr; Dasbor Utama
          </Link>
        </div>

        {/* SEARCH & TAB FILTERS CONTROLLER */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          
          {/* Navigasi 4 Tab Klasifikasi */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Semua", total: counts.all },
              { id: "muslimun", label: "Muslimun", total: counts.muslimun },
              { id: "attendance", label: "Presensi", total: counts.attendance },
              { id: "evaluation", label: "Penilaian KBM", total: counts.evaluation },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-2 transition-all",
                  activeTab === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-md font-bold",
                  activeTab === tab.id ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-900"
                )}>
                  {tab.total}
                </span>
              </button>
            ))}
          </div>

          {/* Baris Input Kata Kunci */}
          <div className="relative w-full lg:max-w-xs shrink-0">
            <div className="absolute left-4 top-3.5 text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Cari sektor atau cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white outline-none border-none text-xs font-bold focus:ring-2 ring-slate-900 dark:ring-white transition-all"
            />
          </div>

        </div>

        {/* MAIN LIST LOG TABLE CONTAINER */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm overflow-hidden">
          
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="inline-block animate-spin text-slate-900 dark:text-white">
                <Loader2 size={40} />
              </div>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">Menyusun baris audit log...</p>
            </div>
          ) : paginatedActivities.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Filter size={18} />
              </div>
              <div>
                <p className="font-black text-slate-700 dark:text-slate-200 text-sm">Aktivitas Tidak Ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[240px] mx-auto">Tidak ada mutasi laporan yang cocok untuk kriteria filter atau pencarian Anda.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-750">
              {paginatedActivities.map((act) => {
                const meta = renderActivityMeta(act.activity_type);
                return (
                  <div key={act.id} className="p-5 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", meta.iconStyle)}>{meta.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm">{groupMap.get(act.group_id) || "Sektor Kelompok"}</span>
                          {catMap.get(act.category_id) && (
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 rounded uppercase">{catMap.get(act.category_id)}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {meta.label} - <code className="font-bold text-blue-600">{act.period_month}/{act.period_year}</code>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold">{timeAgo(act.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* --- DYNAMIC RESPONSIVE PAGINATION AND SIZE CONTROLLER --- */}
        {!loading && totalItems > 0 && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-150 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Rentang Catatan & Selektor Baris */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center sm:text-left">
                Menampilkan <span className="font-black text-slate-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-black text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-black text-slate-850 dark:text-slate-200">{totalItems}</span> log aktivitas
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1"><Layers size={12} /> Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="p-1.5 px-2.5 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                >
                  <option value={10}>10 Baris</option>
                  <option value={25}>25 Baris</option>
                  <option value={50}>50 Baris</option>
                  <option value={100}>100 Baris</option>
                </select>
              </div>
            </div>

            {/* Navigasi Kontroler Halaman */}
            <div className="flex items-center gap-1.5 justify-center w-full md:w-auto">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-750 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isNearCurrent = Math.abs(currentPage - pageNum) <= 1;
                const isEdge = pageNum === 1 || pageNum === totalPages;

                if (!isNearCurrent && !isEdge) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-xs text-slate-400 px-1 font-bold">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={cn(
                      "w-10 h-10 rounded-xl text-xs font-black transition-all",
                      currentPage === pageNum
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg"
                        : "border border-slate-150 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-750 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>

          </div>
        )}

      </div>

      {/* MODAL DIALOG PREVIEW SIMULASI (Mengganti window.confirm demi keamanan iframe Canvas) */}
      {modalConfig && modalConfig.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] max-w-sm w-full border border-slate-100 dark:border-slate-700 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-black dark:text-white leading-tight">{modalConfig.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{modalConfig.text}</p>
            <div className="flex justify-center gap-2 pt-2">
              <button 
                onClick={() => setModalConfig(null)}
                className="px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}