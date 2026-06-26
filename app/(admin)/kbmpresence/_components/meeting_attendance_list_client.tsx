"use client";

import React, { useState, useMemo, useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, MapPin, Users, BookOpen, Trash2, Filter, Loader2 } from "lucide-react";
import { deleteMeetingAttendanceAction } from "../actions";

const MONTHS = [
  { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
  { value: "3", label: "Maret" }, { value: "4", label: "April" },
  { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
  { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
  { value: "9", label: "September" }, { value: "10", label: "Oktober" },
  { value: "11", label: "November" }, { value: "12", label: "Desember" }
];

// Generate opsi tahun (misal: 2024 s/d tahun ini + 2)
const currentYear = new Date().getFullYear();
const YEARS = Array.from(new Array(5), (val, index) => currentYear - 2 + index);

interface MeetingAttendanceListClientProps {
  records: any[];
  profile: any;
}

export function MeetingAttendanceListClient({ records, profile }: MeetingAttendanceListClientProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State Filter (Default: Tampilkan Semua)
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(String(currentYear));

  // Logika Penyaringan Data
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

  // Handler Hapus Data Sesi
  const handleDelete = (id: string, activityName: string) => {
    if (window.confirm(`Hapus data pertemuan "${activityName}"?\nData yang dihapus tidak bisa dikembalikan.`)) {
      startTransition(async () => {
        setErrorMsg(null);
        const res = await deleteMeetingAttendanceAction(id);
        if (!res.success) {
          setErrorMsg(res.message);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
          <Filter size={18} />
          <span>Filter:</span>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-sm font-bold focus:border-blue-500 text-slate-700 dark:text-slate-300"
          >
            <option value="">Semua Bulan</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none text-sm font-bold focus:border-blue-500 text-slate-700 dark:text-slate-300"
          >
            <option value="">Semua Tahun</option>
            {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ERROR MESSAGE PANEL */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* GRID DAFTAR PRESENSI */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">
            Belum ada data pertemuan yang dicatat untuk periode ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => {
            const summary = record.recapitulation?.summary;
            return (
              <div key={record.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all relative group">
                
                {/* Tombol Hapus (Muncul saat hover) */}
                <button 
                  onClick={() => handleDelete(record.id, record.activity)}
                  disabled={isPending}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Hapus Data"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>

                <div className="flex justify-between items-start mb-4 pr-10">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight">
                    {record.activity}
                  </h3>
                </div>
                
                <div className="mb-4 inline-flex">
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    {format(new Date(record.datetime), "dd MMM yyyy, HH:mm", { locale: localeId })} WIB
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" /> {record.place || "Tidak ada lokasi"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <Users size={14} className="text-slate-400" /> {record.group?.name || "Kelompok"}
                  </p>
                  {record.material?.length > 0 && (
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-400" /> {record.material.length} Sesi Materi
                    </p>
                  )}
                </div>

                {summary && (
                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        {Number(summary.h || 0) + Number(summary.i || 0) + Number(summary.a || 0)}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-2">
                      <p className="text-[10px] font-black uppercase text-green-600 mb-1">Hadir</p>
                      <p className="font-bold text-green-700 dark:text-green-500">{(summary.pct_h || 0).toFixed(0)}%</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                      <p className="text-[10px] font-black uppercase text-yellow-600 mb-1">Izin</p>
                      <p className="font-bold text-yellow-700 dark:text-yellow-500">{summary.i || 0}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                      <p className="text-[10px] font-black uppercase text-red-600 mb-1">Alfa</p>
                      <p className="font-bold text-red-700 dark:text-red-500">{summary.a || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}