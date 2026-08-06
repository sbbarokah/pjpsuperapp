"use client";

import { useState } from "react";
import { getExportDataAction } from "../actions";
import {
  Download,
  X,
  CheckSquare,
  Square,
  Filter,
  FileSpreadsheet,
  Loader2,
  Users,
  Layers,
  Settings2,
  SlidersHorizontal,
  UserCheck,
  GraduationCap,
  HeartHandshake,
  RotateCcw,
} from "lucide-react";
import { CategoryModel, GroupModel } from "@/lib/types/master.types";

// Daftar seluruh kolom (field) data rawData terkelompok
export const EXPORT_FIELD_GROUPS = [
  {
    groupName: "Informasi Utama & Wilayah",
    icon: UserCheck,
    fields: [
      { id: "full_name", label: "Nama Lengkap" },
      { id: "username", label: "Username" },
      { id: "email", label: "Email" },
      { id: "gender", label: "Jenis Kelamin" },
      { id: "village_name", label: "Desa" },
      { id: "group_name", label: "Kelompok" },
      { id: "category_name", label: "Kelas / Kategori" },
      { id: "status", label: "Status Keaktifan" },
    ],
  },
  {
    groupName: "Data Pribadi & Sekolah",
    icon: GraduationCap,
    fields: [
      { id: "birth_place", label: "Tempat Lahir" },
      { id: "birth_date", label: "Tanggal Lahir" },
      { id: "school_level", label: "Jenjang Sekolah" },
      { id: "school_name", label: "Nama Sekolah" },
    ],
  },
  {
    groupName: "Data Orang Tua & Kontak",
    icon: HeartHandshake,
    fields: [
      { id: "father_name", label: "Nama Ayah" },
      { id: "father_occupation", label: "Pekerjaan Ayah" },
      { id: "mother_name", label: "Nama Ibu" },
      { id: "mother_occupation", label: "Pekerjaan Ibu" },
      { id: "parent_contact", label: "Kontak Orang Tua" },
    ],
  },
] as const;

export const ALL_FIELDS = EXPORT_FIELD_GROUPS.flatMap((g: any) => g.fields);
type FieldId = (typeof ALL_FIELDS)[number]["id"];

interface ExportButtonProps {
  groups?: GroupModel[];
  categories?: CategoryModel[];
}

export function ExportButton({ groups = [], categories = [] }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State Multiple Filter – menyimpan array ID (sebagai string)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // State Kolom Terpilih (Default: Semua Kolom)
  const [selectedFields, setSelectedFields] = useState<Set<FieldId>>(
    new Set(ALL_FIELDS.map((f) => f.id))
  );

  // --- Fungsi bantuan multiple filter ---
  const toggleGroupId = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllGroups = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map((g) => String(g.id)));
    }
  };

  const toggleCategoryId = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllCategories = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map((c) => String(c.id)));
    }
  };

  // --- Toggle field & grup (tidak berubah) ---
  const toggleField = (fieldId: FieldId) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  };

  const toggleGroupFields = (fieldIds: readonly FieldId[]) => {
    const allGroupSelected = fieldIds.every((id) => selectedFields.has(id));
    setSelectedFields((prev) => {
      const next = new Set(prev);
      fieldIds.forEach((id) => {
        if (allGroupSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  // --- Preset ---
  const handlePresetAll = () => setSelectedFields(new Set(ALL_FIELDS.map((f) => f.id)));
  const handlePresetIdentity = () =>
    setSelectedFields(new Set(EXPORT_FIELD_GROUPS[0].fields.map((f) => f.id)));
  const handlePresetParents = () =>
    setSelectedFields(new Set(EXPORT_FIELD_GROUPS[2].fields.map((f) => f.id)));
  const handleDeselectAllFields = () => setSelectedFields(new Set());

  const handleExportExecute = async () => {
    if (selectedFields.size === 0) {
      alert("Pilih minimal 1 kolom data untuk diekspor.");
      return;
    }

    setIsLoading(true);
    try {
      // Kirim multiple IDs ke server action (parameter baru)
      const response = await getExportDataAction({
        groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      });

      if (!response.success || !response.data || response.data.length === 0) {
        alert("Gagal mengekspor data atau data tidak ditemukan untuk kombinasi filter ini.");
        return;
      }

      const activeFieldConfigs = ALL_FIELDS.filter((f: any) => selectedFields.has(f.id));
      const headers = activeFieldConfigs.map((f: any) => f.label);

      const csvRows = [
        headers.join(","),
        ...response.data.map((row: any) =>
          activeFieldConfigs
            .map((field) => {
              const val = row[field.id];
              const escaped = String(val ?? "").replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(",")
        ),
      ];

      const csvString = csvRows.join("\n");
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      const dateStr = new Date().toISOString().split("T")[0];
      a.setAttribute("download", `data_sensus_generus_${dateStr}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsOpen(false);
    } catch (error) {
      console.error("Export Execute Error:", error);
      alert("Terjadi kesalahan saat memproses file ekspor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Tombol Peluncur Modal (tidak berubah) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-center font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:bg-boxdark dark:text-emerald-400 dark:hover:bg-emerald-950/20 transition-all shadow-sm active:scale-95"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Ekspor Data
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-boxdark border border-stroke dark:border-strokedark animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Header (tidak berubah) */}
            <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark bg-gray-50 dark:bg-meta-4">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <Settings2 size={22} />
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white leading-tight">
                    Opsi Ekspor Data Generus
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Atur filter data dan tentukan kolom data yang ingin diekspor.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-black dark:hover:bg-strokedark dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
              {/* Filter Cakupan Data – sekarang multiple */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={14} /> 1. Filter Cakupan Data (Opsional)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-stroke dark:bg-meta-4/30 dark:border-strokedark">
                  {/* Filter Kelompok Multiple */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white flex items-center gap-1">
                      <Users size={12} /> Kelompok ({selectedGroupIds.length})
                    </label>
                    <div className="rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-boxdark max-h-44 overflow-y-auto p-2 space-y-1">
                      {groups.length === 0 ? (
                        <p className="text-xs text-gray-400 p-1">Tidak ada data</p>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={toggleAllGroups}
                            className="text-xs text-emerald-600 hover:underline font-medium mb-1"
                          >
                            {selectedGroupIds.length === groups.length
                              ? "Hapus Semua"
                              : "Pilih Semua"}
                          </button>
                          {groups.map((g) => (
                            <label
                              key={g.id}
                              className="flex items-center gap-2 cursor-pointer py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={selectedGroupIds.includes(String(g.id))}
                                onChange={() => toggleGroupId(String(g.id))}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-black dark:text-white">
                                {g.name}
                              </span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Filter Kelas Multiple */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white flex items-center gap-1">
                      <Layers size={12} /> Kelas / Kategori ({selectedCategoryIds.length})
                    </label>
                    <div className="rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-boxdark max-h-44 overflow-y-auto p-2 space-y-1">
                      {categories.length === 0 ? (
                        <p className="text-xs text-gray-400 p-1">Tidak ada data</p>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={toggleAllCategories}
                            className="text-xs text-emerald-600 hover:underline font-medium mb-1"
                          >
                            {selectedCategoryIds.length === categories.length
                              ? "Hapus Semua"
                              : "Pilih Semua"}
                          </button>
                          {categories.map((c) => (
                            <label
                              key={c.id}
                              className="flex items-center gap-2 cursor-pointer py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategoryIds.includes(String(c.id))}
                                onChange={() => toggleCategoryId(String(c.id))}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-black dark:text-white">
                                {c.name}
                              </span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pilih Kolom (tidak berubah) */}
              <div className="space-y-3">
                {/* ... sama seperti sebelumnya ... */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={14} /> 2. Pilih Kolom Data Terlampir ({selectedFields.size}/{ALL_FIELDS.length})
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                    <button onClick={handlePresetAll} className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors text-[11px]">Semua</button>
                    <button onClick={handlePresetIdentity} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors text-[11px]">Identitas</button>
                    <button onClick={handlePresetParents} className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 transition-colors text-[11px]">Orang Tua</button>
                    <button onClick={handleDeselectAllFields} className="px-2 py-1 rounded bg-gray-100 text-red-600 hover:bg-red-50 dark:bg-meta-4 dark:text-red-400 transition-colors text-[11px] flex items-center gap-1" title="Reset Pilihan"><RotateCcw size={10} /> Reset</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {EXPORT_FIELD_GROUPS.map((group) => {
                    const groupFieldIds = group.fields.map(f => f.id);
                    const isAllGroupSelected = groupFieldIds.every(id => selectedFields.has(id));
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.groupName} className="rounded-xl border border-stroke p-3 bg-gray-50/50 dark:bg-meta-4/20 dark:border-strokedark space-y-2.5">
                        <div className="flex items-center justify-between border-b border-stroke/60 dark:border-strokedark/60 pb-2">
                          <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5"><GroupIcon size={14} className="text-emerald-600 dark:text-emerald-400" />{group.groupName}</span>
                          <button type="button" onClick={() => toggleGroupFields(groupFieldIds)} className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium">{isAllGroupSelected ? "Batalkan" : "Pilih Semua"}</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {group.fields.map((field) => {
                            const isChecked = selectedFields.has(field.id);
                            return (
                              <button key={field.id} type="button" onClick={() => toggleField(field.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-medium transition-all ${
                                  isChecked ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-200" : "border-stroke bg-white text-gray-600 hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-gray-400"
                                }`}>
                                {isChecked ? <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Square className="h-4 w-4 text-gray-400 shrink-0" />}
                                <span className="truncate">{field.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer (tidak berubah) */}
            <div className="border-t border-stroke px-6 py-4 flex items-center justify-between dark:border-strokedark bg-gray-50 dark:bg-meta-4">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Format: <strong className="text-black dark:text-white">CSV (.csv) UTF-8</strong></span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsOpen(false)} disabled={isLoading} className="rounded-lg border border-stroke px-4 py-2 text-xs font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-colors disabled:opacity-50">Batal</button>
                <button type="button" onClick={handleExportExecute} disabled={isLoading || selectedFields.size === 0} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:hover:bg-emerald-600 active:scale-95">
                  {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /><span>Mengunduh...</span></>) : (<><Download className="h-4 w-4" /><span>Unduh File ({selectedFields.size} Kolom)</span></>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}