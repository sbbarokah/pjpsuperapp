/**
 * Lokasi: app/(admin)/proker/_components/proker_form.tsx
 * Deskripsi: Komponen formulir untuk tambah/edit Program Kerja Tahunan.
 * Perbaikan: Mengganti dependency next/navigation dengan simulasi router untuk lingkungan ini.
 */

"use client";

import React, { useState, useTransition } from "react";
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  FileText, 
  MapPin, 
  Users, 
  Target, 
  Clock 
} from "lucide-react";
import { createProkerAction, updateProkerAction } from "../actions";

// Simulasi useRouter karena next/navigation mungkin tidak tersedia di lingkungan kompilasi ini
const useRouter = () => ({
  push: (path: string) => console.log(`Navigasi ke: ${path}`),
  back: () => console.log("Navigasi kembali"),
  refresh: () => console.log("Memperbarui data"),
});

const TEAMS = [
  "4S Desa", "LDII", "Senkom", "Persinas", "Fosgi", "ASAD", 
  "Tim Kematian", "Tim PNKB", "PJP Desa", "KMM Desa", 
  "Tim Benda SB", "Tim Pembangunan"
];

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MINGGU = ["M1", "M2", "M3", "M4", "M5"];
const YEARS = [2026, 2027, 2028, 2029, 2030];

const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { 
  style: 'currency', 
  currency: 'IDR', 
  minimumFractionDigits: 0 
}).format(val);

export function ProkerForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  console.log("isi initial data", initialData);

  const [formData, setFormData] = useState({
    tim: initialData?.team || TEAMS[0],
    tahun: initialData?.year || new Date().getFullYear(),
    nama_kegiatan: initialData?.name || "",
    deskripsi: initialData?.description || "",
    tujuan: initialData?.objective || "",
    tempat: initialData?.location || "",
    peserta: initialData?.participants || "",
    rab: initialData?.budget_items || [{ item: "", harga: 0, satuan: "", jumlah: 1 }],
    timeline: initialData?.timeline || BULAN.reduce((acc, bln) => ({ ...acc, [bln]: [] }), {}),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'tahun' ? Number(value) : value }));
  };

  const updateRabRow = (index: number, field: string, value: string | number) => {
    const newRab = [...formData.rab];
    newRab[index] = { 
      ...newRab[index], 
      [field]: field === "harga" || field === "jumlah" ? Number(value) : value 
    };
    setFormData((prev) => ({ ...prev, rab: newRab }));
  };

  const addRabRow = () => {
    setFormData((prev) => ({
      ...prev,
      rab: [...prev.rab, { item: "", harga: 0, satuan: "", jumlah: 1 }]
    }));
  };

  const toggleTimeline = (bulan: string, minggu: string) => {
    setFormData((prev) => {
      const currentWeeks = (prev.timeline as any)[bulan] || [];
      const newWeeks = currentWeeks.includes(minggu)
        ? currentWeeks.filter((w: string) => w !== minggu)
        : [...currentWeeks, minggu];
      return { ...prev, timeline: { ...prev.timeline, [bulan]: newWeeks } };
    });
  };

  const calculateTotal = () => formData.rab.reduce((acc: any, row: any) => acc + (row.harga * row.jumlah), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validasi sederhana
    if(!formData.nama_kegiatan) {
        alert("Nama kegiatan wajib diisi");
        return;
    }

    startTransition(async () => {
      let result;
      
      if (initialData?.id) {
        // Mode Edit
        result = await updateProkerAction({
            id: initialData.id,
            ...formData
        });
      } else {
        // Mode Create
        result = await createProkerAction(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
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
              placeholder="Contoh: Musyawarah Kerja Tahun" 
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
          <button 
            type="button" 
            onClick={addRabRow} 
            className="text-primary font-bold flex items-center gap-1 text-sm hover:underline"
          >
            <Plus size={16}/> Tambah Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="font-bold opacity-50 uppercase tracking-widest text-[10px] border-b border-stroke dark:border-strokedark">
                <th className="pb-3 px-2">Item Kebutuhan</th>
                <th className="pb-3 px-2">Satuan</th>
                <th className="pb-3 px-2 w-20">Qty</th>
                <th className="pb-3 px-2">Harga</th>
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
                      placeholder="Konsumsi" 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      required 
                      value={row.satuan} 
                      onChange={(e) => updateRabRow(idx, "satuan", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary" 
                      placeholder="Porsi" 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      type="number" 
                      required 
                      value={row.jumlah} 
                      onChange={(e) => updateRabRow(idx, "jumlah", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary" 
                    />
                  </td>
                  <td className="py-4 px-2">
                    <input 
                      type="number" 
                      required 
                      value={row.harga} 
                      onChange={(e) => updateRabRow(idx, "harga", e.target.value)} 
                      className="w-full bg-transparent outline-none focus:text-primary font-bold text-primary" 
                    />
                  </td>
                  <td className="py-4 px-2 text-right font-black text-black dark:text-white">
                    {(row.harga * row.jumlah).toLocaleString("id-ID")}
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
                <td colSpan={4} className="pt-6 text-right font-bold text-gray-500 uppercase text-[10px]">Total Estimasi Anggaran</td>
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
        <h3 className="text-xl font-bold mb-6 border-b pb-3 text-black dark:text-white flex items-center gap-2">
          <Clock className="text-primary" size={20}/>
          Timeline Pelaksanaan (Mingguan)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {BULAN.map((bln) => (
            <div key={bln} className="p-3 bg-gray-50 rounded-xl dark:bg-meta-4 border border-stroke dark:border-strokedark text-center">
              <span className="text-[10px] font-black uppercase opacity-40 mb-3 block">{bln}</span>
              <div className="flex gap-1 justify-center">
                {MINGGU.map((m) => {
                  const isActive = (formData.timeline as any)[bln]?.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleTimeline(bln, m)}
                      className={`w-7 h-7 rounded-lg text-[8px] font-black border transition-all ${
                        isActive 
                          ? "bg-primary border-primary text-white shadow-md scale-105" 
                          : "bg-white dark:bg-boxdark border-stroke text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <div className="my-4 p-3 text-sm text-red-700 bg-red-100 border border-red-500 rounded">{error}</div>}
      {success && <div className="my-4 p-3 text-sm text-green-700 bg-green-100 border border-green-500 rounded">{success}</div>}

      {/* Tombol Aksi */}
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
          disabled={isPending} 
          className="px-8 py-3 rounded-lg bg-primary text-white font-black shadow-lg hover:bg-opacity-90 disabled:opacity-50 transition-all active:scale-95"
        >
          {isPending ? "Sedang Menyimpan..." : "Simpan Program Kerja"}
        </button>
      </div>
    </form>
  );
}