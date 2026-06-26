"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  Calendar, 
  MapPin, 
  Users, 
  BookOpen, 
  Trash2, 
  Filter, 
  Loader2, 
  Plus, 
  TrendingDown, 
  BookOpenCheck,
  UserCheck,
  UserCheck2,
  AlertCircle,
  User,
  CalendarDays,
  ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

// --- Tipe Data dari Supabase ---
interface MeetingAttendanceRecord {
  id: string;
  created_at: string;
  datetime: string;
  activity: string;
  place: string | null;
  village_id: number;
  group_id: number;
  category_ids: number[]; // Diperbarui menjadi Array BIGINT[]
  material: any[]; // JSONB
  recapitulation: {
    summary: { h: number; i: number; a: number; pct_h: number };
    gender_summary?: {
      male: { h: number; i: number; a: number; pct_h: number };
      female: { h: number; i: number; a: number; pct_h: number };
    };
    students?: {
      name: string;
      gender: "L" | "P";
      status: "H" | "I" | "A";
      category?: number; // tambahan opsional
    }[];
    by_category?: Record<
      string,
      { h: number; i: number; a: number; pct_h: number }
    >;
  };
  notes: string | null;
  group?: { name: string };
  categories?: { id: number; name: string }[]; // Array kategori hasil mapping master data
}

const MONTHS = [
  { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
  { value: "3", label: "Maret" }, { value: "4", label: "April" },
  { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
  { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
  { value: "9", label: "September" }, { value: "10", label: "Oktober" },
  { value: "11", label: "November" }, { value: "12", label: "Desember" }
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from(new Array(5), (val, index) => currentYear - 2 + index);

export default function MeetingAttendancePage() {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  // State Utama
  const [records, setRecords] = useState<MeetingAttendanceRecord[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State Filter (Default: Bulan & Tahun Berjalan)
  const [monthFilter, setMonthFilter] = useState<string>(String(new Date().getMonth() + 1));
  const [yearFilter, setYearFilter] = useState<string>(String(currentYear));

  // --- FETCH DATA DARI SUPABASE ---
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Dapatkan Sesi Pengguna
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sesi login berakhir. Silakan masuk kembali.");

      // 2. Dapatkan Detail Profil & Hak Akses Role
      const { data: userProfile, error: profileError } = await supabase
        .from("profile")
        .select("role, village_id, group_id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !userProfile) throw new Error("Profil pengguna gagal dimuat.");
      setProfile(userProfile);

      // 3. Ambil Master Data Kategori untuk pemetaan ID Array ke Nama di Client Memory
      const { data: masterCategories, error: catError } = await supabase
        .from("category")
        .select("id, name");

      if (catError) throw catError;
      const categoryMap = new Map((masterCategories || []).map(c => [c.id, c.name]));

      // 4. Bangun Query Presensi (Berdasarkan Tabel: "meeting_attendances")
      // let query = supabase
      //   .from("meeting_attendances")
      //   .select(`
      //     *,
      //     group:group_id (name)
      //   `)
      //   .order("datetime", { ascending: false });
      let query = supabase
        .from("meeting_attendances")
        .select(`
          *,
          group:group!fk_meeting_attendance_group(name)
        `)
        .order("datetime", { ascending: false });

      // RBAC Enforcer di Sisi Klien (Filter Scope Wilayah)
      if (userProfile.role === "admin_desa") {
        query = query.eq("village_id", userProfile.village_id);
      } else if (userProfile.role === "admin_kelompok") {
        query = query.eq("group_id", userProfile.group_id);
      }

      const { data: dbRecords, error: dbError } = await query;
      
      if (dbError) {
        if (dbError.code === "P0001" || dbError.message.includes("does not exist")) {
          throw new Error("Tabel 'meeting_attendances' belum terdaftar di Supabase. Harap jalankan migrasi SQL terlebih dahulu.");
        }
        throw dbError;
      }

      // Gabungkan & petakan nama kategori dari array category_ids
      const formattedRecords = (dbRecords || []).map((record: any) => {
        const recordCategories = (record.category_ids || []).map((id: number) => ({
          id,
          name: categoryMap.get(id) || `Kelas ${id}`
        }));
        return {
          ...record,
          categories: recordCategories
        };
      });

      setRecords(formattedRecords as MeetingAttendanceRecord[]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memuat data dari Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LOGIKA PENYARINGAN DATA CLIENT-SIDE (BULAN & TAHUN) ---
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate = new Date(record.datetime);
      const rMonth = String(recordDate.getMonth() + 1);
      const rYear = String(recordDate.getFullYear());

      const matchMonth = monthFilter ? rMonth === monthFilter : true;
      const matchYear = yearFilter ? rYear === yearFilter : true;

      return matchMonth && matchYear;
    });
  }, [records, monthFilter, yearFilter]);

  // --- KALKULASI STATISTIK DARI DATABASE ---

  // 1. Statistik Gender (dari array students)
  const genderStats = useMemo(() => {
    let maleH = 0, maleTotal = 0;
    let femaleH = 0, femaleTotal = 0;

    filteredRecords.forEach(r => {
      const students = r.recapitulation?.students || [];
      students.forEach(s => {
        if (s.gender === "L") {
          maleTotal++;
          if (s.status === "H") maleH++;
        } else if (s.gender === "P") {
          femaleTotal++;
          if (s.status === "H") femaleH++;
        }
      });
    });

    return {
      malePercent: maleTotal > 0 ? (maleH / maleTotal) * 100 : 0,
      femalePercent: femaleTotal > 0 ? (femaleH / femaleTotal) * 100 : 0,
    };
  }, [filteredRecords]);

  // 2. Total Persentase Hadir, Izin, Alfa (seluruh siswa)
  const overallStats = useMemo(() => {
    let total = 0, hadir = 0, izin = 0, alfa = 0;
    filteredRecords.forEach(r => {
      const students = r.recapitulation?.students || [];
      students.forEach(s => {
        total++;
        if (s.status === "H") hadir++;
        else if (s.status === "I") izin++;
        else if (s.status === "A") alfa++;
      });
    });
    return {
      total,
      hadirPercent: total > 0 ? (hadir / total) * 100 : 0,
      izinPercent: total > 0 ? (izin / total) * 100 : 0,
      alfaPercent: total > 0 ? (alfa / total) * 100 : 0,
    };
  }, [filteredRecords]);

  // 3. Kehadiran per Kategori (dari by_category)
  const categoryAttendanceStats = useMemo(() => {
    const map = new Map<string, { h: number; t: number }>();
    filteredRecords.forEach(r => {
      const byCat = r.recapitulation?.by_category;
      if (byCat) {
        Object.entries(byCat).forEach(([catId, stats]) => {
          // Cari nama kategori dari record.categories
          const catName = r.categories?.find(c => c.id === Number(catId))?.name || `Kelas ${catId}`;
          const current = map.get(catName) || { h: 0, t: 0 };
          map.set(catName, {
            h: current.h + stats.h,
            t: current.t + (stats.h + stats.i + stats.a),
          });
        });
      }
    });

    return Array.from(map.entries()).map(([name, val]) => ({
      name,
      percentage: val.t > 0 ? (val.h / val.t) * 100 : 0,
    }));
  }, [filteredRecords]);

  // 3. Papan Informasi: 5 Generus dengan Kehadiran Terendah
  const lowAttendanceStudents = useMemo(() => {
    const studentStats = new Map<string, { h: number; t: number }>();
    
    filteredRecords.forEach(r => {
      const studentsList = r.recapitulation?.students || [];

      studentsList.forEach((s) => {
        const current = studentStats.get(s.name) || { h: 0, t: 0 };
        studentStats.set(s.name, {
          h: current.h + (s.status === "H" ? 1 : 0),
          t: current.t + 1
        });
      });
    });

    return Array.from(studentStats.entries())
      .map(([name, val]) => ({
        name,
        percentage: val.t > 0 ? (val.h / val.t) * 100 : 0,
        total: val.t,
        present: val.h
      }))
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5);
  }, [filteredRecords]);

  // 4. Papan Informasi: 3 Materi Pengajian Terakhir
  const recentMaterials = useMemo(() => {
    const list: { topic: string; presenter: string; pages?: string; activity: string; date: string }[] = [];
    const sorted = [...filteredRecords].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    for (const record of sorted) {
      if (record.material) {
        record.material.forEach((m: any) => {
          if (list.length < 3) {
            list.push({
              topic: m.topic || 'Tanpa Topik',
              presenter: m.presenter || 'Tanpa Pemateri',
              pages: m.pages || '',
              activity: record.activity,
              date: record.datetime
            });
          }
        });
      }
      if (list.length >= 3) break;
    }
    return list;
  }, [filteredRecords]);

  // --- OPERASI SUPABASE: HAPUS REKORD ---
  const handleDelete = (id: string, activityName: string) => {
    if (window.confirm(`Hapus data pertemuan "${activityName}"?\nData yang dihapus tidak bisa dikembalikan.`)) {
      startTransition(async () => {
        setErrorMsg(null);
        try {
          const { error: deleteError } = await supabase
            .from("meeting_attendances")
            .delete()
            .eq("id", id);

          if (deleteError) throw deleteError;

          // Perbarui State Lokal
          setRecords(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || "Gagal menghapus data dari Supabase.");
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Menyelaraskan dengan Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans">
      {/* Header & Navigasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb pageName="Presensi Pertemuan" showNav={false} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pantau tingkat kehadiran generus serta rekapitulasi materi pengajian rutin dari Supabase.
          </p>
        </div>
        
        {profile?.role !== "pengurus_desa" && profile?.role !== "pengurus_kelompok" && (
          <Link
            href="/kbmpresence/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition-all text-sm"
          >
            <Plus size={18} />
            Input Presensi Baru
          </Link>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
          <Filter size={18} />
          <span>Filter Laporan:</span>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-sm font-bold focus:border-blue-500 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">Semua Bulan</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-sm font-bold focus:border-blue-500 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">Semua Tahun</option>
            {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* --- KARTU RINGKASAN PERSENTASE KEHADIRAN (STATISTICS SECTION) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Rerata Hadir Laki-Laki */}
        <div className="rounded-[20px] p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest block">
              Rerata Hadir Laki‑Laki
            </span>
            <div className="flex items-baseline mt-1.5 gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {genderStats.malePercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <UserCheck size={24} />
          </div>
        </div>

        {/* Rerata Hadir Perempuan */}
        <div className="rounded-[20px] p-6 bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-800/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest block">
              Rerata Hadir Perempuan
            </span>
            <div className="flex items-baseline mt-1.5 gap-2">
              <span className="text-3xl font-black text-pink-600 dark:text-pink-400">
                {genderStats.femalePercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl">
            <UserCheck2 size={24} />
          </div>
        </div>

        {/* Total Persentase Hadir / Izin / Alfa */}
        <div className="rounded-[20px] p-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/30 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest block mb-2">
            Total Kehadiran
          </span>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-green-600 font-bold">Hadir</span>
              <span className="font-bold">{overallStats.hadirPercent.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-yellow-600 font-bold">Izin</span>
              <span className="font-bold">{overallStats.izinPercent.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600 font-bold">Alfa</span>
              <span className="font-bold">{overallStats.alfaPercent.toFixed(0)}%</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              Total: {overallStats.total} siswa
            </div>
          </div>
        </div>

        {/* Kehadiran Per Kategori */}
        <div className="rounded-[20px] p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest block mb-2">
            Per Kategori
          </span>
          <div className="space-y-2 max-h-16 overflow-y-auto pr-1">
            {categoryAttendanceStats.length === 0 ? (
              <p className="text-xs text-slate-400 italic mt-2">Tidak ada data</p>
            ) : (
              categoryAttendanceStats.map(cat => (
                <div key={cat.name} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE PANEL */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 flex items-center gap-2">
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}

      {/* MAIN CONTENT GRID (LIST & SIDEBAR BOARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* KOLOM KIRI: DAFTAR PRESENSI (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Users size={18} className="text-indigo-600" /> Sesi Pertemuan Periode Ini
          </h2>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">
                Belum ada data pertemuan yang dicatat untuk periode ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredRecords.map((record) => {
                const summary = record.recapitulation?.summary;
                const canDelete = profile?.role !== "pengurus_desa" && profile?.role !== "pengurus_kelompok";
                
                return (
                  <div key={record.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all relative group">
                    
                    {/* Tombol Hapus (Hanya muncul jika berhak & saat hover) */}
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(record.id, record.activity)}
                        disabled={isPending}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all md:opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Hapus Data"
                      >
                        {isPending ? <Loader2 size={18} className="animate-spin text-primary" /> : <Trash2 size={18} />}
                      </button>
                    )}

                    <div className="flex justify-between items-start mb-3 pr-10">
                      <div>
                        {/* Dukungan Rendering Banyak Lencana Kelas Sekaligus */}
                        <div className="flex flex-wrap gap-1.5">
                          {record.categories && record.categories.length > 0 ? (
                            record.categories.map((cat: any) => (
                              <span key={cat.id} className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded uppercase tracking-wider">
                                Kelas: {cat.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-black text-slate-500 bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded uppercase tracking-wider">
                              Kelas: Umum
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-base text-slate-800 dark:text-white leading-tight mt-2.5">
                          {record.activity}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="mb-3 inline-flex">
                      <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap">
                        {format(new Date(record.datetime), "dd MMM yyyy, HH:mm", { locale: localeId })} WIB
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-5 text-xs">
                      <p className="font-medium text-slate-500 flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400" /> {record.place || "Tidak ada lokasi"}
                      </p>
                      <p className="font-medium text-slate-500 flex items-center gap-2">
                        <Users size={13} className="text-slate-400" /> {record.group?.name || "Kelompok"}
                      </p>
                      {/* {record.material && record.material.length > 0 && (
                        <div className="mt-1 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-700/50">
                           <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Materi:</p>
                           <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5 mt-0.5">
                              {record.material.map((m, idx) => (
                                <li key={idx} className="truncate">{m.title || m}</li>
                              ))}
                           </ul>
                        </div>
                      )} */}
                    </div>

                    {summary && (
                      <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-1.5">
                          <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Total</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {Number(summary.h || 0) + Number(summary.i || 0) + Number(summary.a || 0)}
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-1.5">
                          <p className="text-[8px] font-black uppercase text-green-600 mb-0.5">Hadir</p>
                          <p className="text-xs font-bold text-green-700 dark:text-green-500">{(summary.pct_h || 0).toFixed(0)}%</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-1.5">
                          <p className="text-[8px] font-black uppercase text-yellow-600 mb-0.5">Izin</p>
                          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{summary.i || 0}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-1.5">
                          <p className="text-[8px] font-black uppercase text-red-600 mb-0.5">Alfa</p>
                          <p className="text-xs font-bold text-red-700 dark:text-red-500">{summary.a || 0}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: SIDEBAR BOARDS PANEL (Col Span 1) */}
        <div className="space-y-6">
          
          {/* BOARD 1: 5 GENERUS DENGAN KEHADIRAN TERENDAH */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2 text-sm">
              <TrendingDown className="text-red-500" size={18} />
              5 Kehadiran Terendah
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Daftar generus yang paling memerlukan pembinaan khusus akibat tingkat kehadiran minim dari draf kueri Supabase.
            </p>

            <div className="space-y-3 pt-2">
              {lowAttendanceStudents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">Tidak ada data kehadiran</div>
              ) : (
                lowAttendanceStudents.map((st, idx) => (
                  <div key={st.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{idx + 1}. {st.name}</span>
                      <span className="font-black text-red-600 dark:text-red-400">{st.percentage.toFixed(0)}% ({st.present}/{st.total})</span>
                    </div>
                    {/* Progress bar visual */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${st.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BOARD 2: 3 MATERI TERAKHIR PENGAJIAN */}
          <MateriCard recentMaterials={recentMaterials} />
        </div>

      </div>
    </div>
  );
}

function MateriCard({ recentMaterials = [] }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2.5 text-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-xl">
            <BookOpenCheck className="text-indigo-600 dark:text-indigo-400" size={16} />
          </div>
          3 Materi Terakhir
        </h3>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
        Rekam jejak materi kurikulum pengajian pekan ini.
      </p>

      {/* List Container */}
      <div className="space-y-3 pt-2">
        {recentMaterials.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl text-xs text-slate-400">
            Belum ada data materi bulan ini
          </div>
        ) : (
          recentMaterials.map((m: any, idx: any) => (
            <div 
              key={idx} 
              className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
            >
              {/* Badge Number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                0{idx + 1}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {m?.topic}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User size={10} /> {m.presenter}
                  </span>
                  {m.pages && (
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-medium">
                      Hal. {m.pages}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-medium">
                  <CalendarDays size={9} />
                  {format(new Date(m.date), "dd MMMM yyyy", { locale: localeId })}
                </div>
              </div>

              {/* Action Icon */}
              <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 self-center opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}