/**
 * Lokasi: app/(admin)/proker/_components/proker_form.tsx
 * Deskripsi: Komponen formulir untuk tambah/edit Program Kerja Tahunan.
 * Perbaikan: Menambah input text (catatan) di bawah tombol timeline per bulan.
 */

"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  FileText, 
  MapPin, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { createProkerAction, updateProkerAction } from "../actions";
import { useRouter } from "next/navigation";
import { BULAN, TEAMS } from "@/lib/constants";

const MINGGU = ["M1", "M2", "M3", "M4", "M5"];
const YEARS = [2026, 2027, 2028, 2029, 2030];

// Definisi status timeline
const TIMELINE_STATES = {
  NONE: 0,
  ACTIVITY: 1, // Biru (Ada kegiatan, tanpa biaya)
  FISCAL: 2    // Hijau (Ada kegiatan, ada biaya)
};

export function ProkerForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper untuk inisialisasi timeline dari data lama atau baru
  const initializeTimeline = (dataTimeline: any) => {
    if (!dataTimeline) return {};
    const newTimeline: any = {};
    Object.keys(dataTimeline).forEach(bulan => {
      newTimeline[bulan] = {};
      if (Array.isArray(dataTimeline[bulan])) {
        dataTimeline[bulan].forEach((m: string) => {
          newTimeline[bulan][m] = TIMELINE_STATES.FISCAL;
        });
      } else {
        newTimeline[bulan] = dataTimeline[bulan];
      }
    });
    return newTimeline;
  };

  const [formData, setFormData] = useState({
    tim: initialData?.team || TEAMS[0],
    tahun: initialData?.year || new Date().getFullYear(),
    nama_kegiatan: initialData?.name || "",
    deskripsi: initialData?.description || "",
    tujuan: initialData?.objective || "",
    tempat: initialData?.location || "",
    peserta: initialData?.participants || "",
    rab: initialData?.budget_items?.map((item: any) => ({
        ...item,
        frekuensi: item.frekuensi || 1 
    })) || [{ item: "", harga: 0, satuan: "", jumlah: 1, frekuensi: 1 }],
    timeline: initializeTimeline(initialData?.timeline),
    // [BARU] State untuk catatan timeline per bulan
    timeline_notes: initialData?.timeline_notes || {} 
  });

  // --- COMPUTED VALUES FOR VALIDATION ---
  
  const totalRabFreq = useMemo(() => {
    return formData.rab.reduce((acc: number, item: any) => acc + Number(item.frekuensi || 0), 0);
  }, [formData.rab]);

  const totalFiscalWeeks = useMemo(() => {
    let count = 0;
    Object.values(formData.timeline).forEach((weeks: any) => {
      if (weeks) {
        Object.values(weeks).forEach((val) => {
          if (val === TIMELINE_STATES.FISCAL) count++;
        });
      }
    });
    return count;
  }, [formData.timeline]);

  const isValidFrequency = totalRabFreq === totalFiscalWeeks;

  // --------------------------------------

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'tahun' ? Number(value) : value }));
  };

  const updateRabRow = (index: number, field: string, value: string | number) => {
    const newRab = [...formData.rab];
    newRab[index] = { 
      ...newRab[index], 
      [field]: field === "harga" || field === "jumlah" || field === "frekuensi" ? Number(value) : value 
    };
    setFormData((prev) => ({ ...prev, rab: newRab }));
  };

  const addRabRow = () => {
    setFormData((prev) => ({
      ...prev,
      rab: [...prev.rab, { item: "", harga: 0, satuan: "", jumlah: 1, frekuensi: 1 }]
    }));
  };

  const toggleTimeline = (bulan: string, minggu: string) => {
    setFormData((prev) => {
      const currentMonthData = (prev.timeline as any)[bulan] || {};
      const currentVal = currentMonthData[minggu] || TIMELINE_STATES.NONE;
      
      let nextVal = TIMELINE_STATES.NONE;
      if (currentVal === TIMELINE_STATES.NONE) nextVal = TIMELINE_STATES.ACTIVITY;
      else if (currentVal === TIMELINE_STATES.ACTIVITY) nextVal = TIMELINE_STATES.FISCAL;
      else nextVal = TIMELINE_STATES.NONE;

      const newMonthData = { ...currentMonthData };
      if (nextVal === TIMELINE_STATES.NONE) {
        delete newMonthData[minggu];
      } else {
        newMonthData[minggu] = nextVal;
      }

      return { ...prev, timeline: { ...prev.timeline, [bulan]: newMonthData } };
    });
  };

  // [BARU] Handler untuk input catatan timeline
  const handleTimelineNoteChange = (bulan: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      timeline_notes: {
        ...prev.timeline_notes,
        [bulan]: value
      }
    }));
  };

  const calculateTotal = () => formData.rab.reduce((acc: any, row: any) => acc + (row.harga * row.jumlah * row.frekuensi), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if(!formData.nama_kegiatan) {
        alert("Nama kegiatan wajib diisi");
        return;
    }

    if (!isValidFrequency) {
      setError(`Validasi Gagal: Total Frekuensi di RAB (${totalRabFreq}) TIDAK SAMA dengan jumlah minggu Hijau/Fiskal (${totalFiscalWeeks}) pada timeline.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    startTransition(async () => {
      let result;
      
      const payload = {
        ...formData,
        total_anggaran: calculateTotal()
      };

      if (initialData?.id) {
        result = await updateProkerAction({ id: initialData.id, ...payload });
      } else {
        result = await createProkerAction(payload);
      }

      if (!result.success) {
        setError(result.message);
      } else {
        setSuccess(result.message);
        router.push("/proker");
        router.refresh();
      }
    });
  };

  const getTimelineButtonStyle = (val: number) => {
    switch (val) {
      case TIMELINE_STATES.ACTIVITY: 
        return "bg-blue-500 border-blue-600 text-white shadow-md";
      case TIMELINE_STATES.FISCAL: 
        return "bg-green-500 border-green-600 text-white shadow-md scale-105 ring-2 ring-green-200";
      default: 
        return "bg-white dark:bg-boxdark border-stroke text-gray-400 hover:bg-gray-50";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-pulse">
          <AlertCircle className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Gagal Menyimpan</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 1. Informasi Dasar */}
      <section className="bg-white p-6 rounded-xl border border-stroke dark:bg-boxdark dark:border-strokedark shadow-sm">
        <h3 className="text-xl font-bold mb-6 border-b pb-3 text-black dark:text-white flex items-center gap-2">
          <FileText className="text-primary" size={20}/>
          Informasi Kegiatan
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
              <Briefcase size={14}/> Tim Pelaksana
            </label>
            <select 
              name="tim"
              value={formData.tim}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
            >
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
              <Calendar size={14}/> Tahun Pelaksanaan
            </label>
            <select 
              name="tahun"
              value={formData.tahun}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">Nama Kegiatan</label>
            <input 
              required 
              name="nama_kegiatan" 
              value={formData.nama_kegiatan} 
              onChange={handleInputChange} 
              placeholder="Contoh: Musyawarah Kerja Tahun" 
              className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-strokedark" 
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">Deskripsi Kegiatan</label>
            <input 
              required 
              name="deskripsi" 
              value={formData.deskripsi} 
              onChange={handleInputChange} 
              placeholder="Deskripsi singkat kegiatan..." 
              className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-strokedark" 
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500">Tujuan Strategis</label>
            <input 
              required 
              name="tujuan" 
              value={formData.tujuan} 
              onChange={handleInputChange} 
              placeholder="Apa target utama kegiatan ini?" 
              className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-strokedark" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><MapPin size={14}/> Tempat</label>
            <input 
              name="tempat" 
              value={formData.tempat} 
              onChange={handleInputChange} 
              placeholder="Lokasi kegiatan"
              className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-strokedark" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Users size={14}/> Estimasi Peserta</label>
            <input 
              name="peserta" 
              value={formData.peserta} 
              onChange={handleInputChange} 
              placeholder="Siapa saja pesertanya?"
              className="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-strokedark" 
            />
          </div>
        </div>
      </section>

      {/* 2. RAB */}
      <section className="bg-white p-6 rounded-xl border border-stroke dark:bg-boxdark dark:border-strokedark shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <DollarSign className="text-primary" size={20}/>
            Rencana Anggaran Biaya (RAB)
          </h3>
          <div className="flex items-center gap-4">
            <div className={`text-sm px-3 py-1 rounded-full border ${isValidFrequency ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300 animate-pulse'}`}>
               Total Frekuensi: <b>{totalRabFreq}</b>
            </div>
            <button 
                type="button" 
                onClick={addRabRow} 
                className="text-primary font-bold flex items-center gap-1 text-sm hover:underline"
            >
                <Plus size={16}/> Tambah Item
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="font-bold opacity-50 uppercase tracking-widest text-[10px] border-b border-stroke dark:border-strokedark">
                <th className="pb-3 px-2">Item Kebutuhan</th>
                <th className="pb-3 px-2">Satuan</th>
                <th className="pb-3 px-2 w-20 text-center">Qty</th>
                <th className="pb-3 px-2 w-20 text-center text-blue-600">Freq</th>
                <th className="pb-3 px-2">Harga @</th>
                <th className="pb-3 px-2 text-right">Subtotal</th>
                <th className="pb-3 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {formData.rab.map((row: any, idx: any) => (
                <tr key={idx} className="border-b border-stroke last:border-0 dark:border-strokedark">
                  <td className="py-4 px-2">
                    <input 
                      required 
                      value={row.item} 
                      onChange={(e) => updateRabRow(idx, "item", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary font-medium" 
                      placeholder="Nama Item..." 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      required 
                      value={row.satuan} 
                      onChange={(e) => updateRabRow(idx, "satuan", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary" 
                      placeholder="Unit..." 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      type="number" 
                      min="1"
                      required 
                      value={row.jumlah} 
                      onChange={(e) => updateRabRow(idx, "jumlah", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary text-center bg-gray-50 dark:bg-meta-4 rounded" 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      type="number" 
                      min="1"
                      required 
                      value={row.frekuensi} 
                      onChange={(e) => updateRabRow(idx, "frekuensi", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary text-center font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900" 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      type="number" 
                      required 
                      value={row.harga} 
                      onChange={(e) => updateRabRow(idx, "harga", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary font-bold text-gray-700 dark:text-gray-300" 
                    />
                  </td>
                  <td className="py-4 px-2 text-right font-black text-black dark:text-white">
                    {(row.harga * row.jumlah * row.frekuensi).toLocaleString("id-ID")}
                  </td>
                  <td className="py-4 px-2 text-right">
                    {formData.rab.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setFormData(p => ({...p, rab: p.rab.filter((_: any,i: any)=>i!==idx)}))} 
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="pt-6 text-right font-bold text-gray-500 uppercase text-[10px]">Total Estimasi Anggaran</td>
                <td colSpan={2} className="pt-6 text-right text-xl font-black text-primary italic">
                  Rp {calculateTotal().toLocaleString("id-ID")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 3. Timeline */}
      <section className="bg-white p-6 rounded-xl border border-stroke dark:bg-boxdark dark:border-strokedark shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-3 gap-4">
          <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <Clock className="text-primary" size={20}/>
            Timeline Pelaksanaan
          </h3>
          
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                <span className="text-gray-500">Kosong</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-500">Kegiatan (Non-Biaya)</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded ring-1 ring-green-200"></div>
                <span className="text-gray-500">Fiskal (Ada Biaya)</span>
            </div>
            <div className={`ml-2 px-3 py-1 rounded-full border flex items-center gap-1 ${isValidFrequency ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                {isValidFrequency ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                Target Hijau: <b>{totalFiscalWeeks}</b>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-4 italic">
            * Klik kotak minggu untuk mengubah status: Putih → Biru → Hijau
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BULAN.map((bln) => (
            <div key={bln} className="p-3 bg-gray-50 rounded-xl dark:bg-meta-4 border border-stroke dark:border-strokedark text-center">
              <span className="text-[10px] font-black uppercase opacity-40 mb-3 block">{bln}</span>
              
              {/* TOMBOL MINGGUAN */}
              <div className="flex gap-1 justify-center mb-2">
                {MINGGU.map((m) => {
                  const currentMonthData = (formData.timeline as any)[bln] || {};
                  const status = currentMonthData[m] || TIMELINE_STATES.NONE;
                  
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleTimeline(bln, m)}
                      className={`w-7 h-7 rounded-lg text-[8px] font-black border transition-all ${getTimelineButtonStyle(status)}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* [BARU] Input Catatan/Keterangan per Bulan */}
              <input
                 type="text"
                 placeholder="Ket. kegiatan..."
                 value={(formData.timeline_notes as any)[bln] || ""}
                 onChange={(e) => handleTimelineNoteChange(bln, e.target.value)}
                 className="w-full mt-1 text-[10px] px-2 py-1.5 rounded border border-stroke bg-white dark:bg-boxdark dark:border-strokedark focus:border-primary outline-none transition-colors"
              />

            </div>
          ))}
        </div>
      </section>

      {success && <div className="my-4 p-3 text-sm text-green-700 bg-green-100 border border-green-500 rounded">{success}</div>}

      <div className="flex justify-end gap-3 pt-6 border-t border-stroke dark:border-strokedark">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="px-8 py-3 rounded-lg border border-stroke font-bold hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4 transition-all"
        >
          Batal
        </button>
        <button 
          type="submit" 
          disabled={isPending || !isValidFrequency} 
          className="px-8 py-3 rounded-lg bg-primary text-white font-black shadow-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
        >
          {isPending ? "Sedang Menyimpan..." : "Simpan Program Kerja"}
          {!isValidFrequency && <AlertCircle size={16} />}
        </button>
      </div>
    </form>
  );
}