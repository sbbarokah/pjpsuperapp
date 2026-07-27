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
  RotateCcw
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
    ]
  },
  {
    groupName: "Data Pribadi & Sekolah",
    icon: GraduationCap,
    fields: [
      { id: "birth_place", label: "Tempat Lahir" },
      { id: "birth_date", label: "Tanggal Lahir" },
      { id: "school_level", label: "Jenjang Sekolah" },
      { id: "school_name", label: "Nama Sekolah" },
    ]
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
    ]
  }
] as const;

// Flattened list untuk kalkulasi total field
export const ALL_FIELDS = EXPORT_FIELD_GROUPS.flatMap((g: any) => g.fields);
type FieldId = typeof ALL_FIELDS[number]["id"];

interface ExportButtonProps {
  groups?: GroupModel[];
  categories?: CategoryModel[];
}

export function ExportButton({ groups = [], categories = [] }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State Filter Opsional
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // State Kolom Terpilih (Default: Semua Kolom)
  const [selectedFields, setSelectedFields] = useState<Set<FieldId>>(
    new Set(ALL_FIELDS.map((f) => f.id))
  );

  // Toggle pilihan field individu
  const toggleField = (fieldId: FieldId) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  // Toggle pilihan per kelompok
  const toggleGroupFields = (fieldIds: readonly FieldId[]) => {
    const allGroupSelected = fieldIds.every(id => selectedFields.has(id));
    setSelectedFields(prev => {
      const next = new Set(prev);
      fieldIds.forEach(id => {
        if (allGroupSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });
  };

  // Preset 1: Pilih Semua
  const handlePresetAll = () => {
    setSelectedFields(new Set(ALL_FIELDS.map((f) => f.id)));
  };

  // Preset 2: Identitas & Wilayah saja
  const handlePresetIdentity = () => {
    const identityFields = EXPORT_FIELD_GROUPS[0].fields.map(f => f.id);
    setSelectedFields(new Set(identityFields));
  };

  // Preset 3: Data Orang Tua & Kontak saja
  const handlePresetParents = () => {
    const parentFields = EXPORT_FIELD_GROUPS[2].fields.map(f => f.id);
    setSelectedFields(new Set(parentFields));
  };

  // Preset 4: Hapus Semua
  const handleDeselectAllFields = () => {
    setSelectedFields(new Set());
  };

  const handleExportExecute = async () => {
    if (selectedFields.size === 0) {
      alert("Pilih minimal 1 kolom data untuk diekspor.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Panggil Server Action dengan parameter filter
      const response = await getExportDataAction({
        groupId: selectedGroup || undefined,
        categoryId: selectedCategory || undefined,
      });

      if (!response.success || !response.data || response.data.length === 0) {
        alert("Gagal mengekspor data atau data tidak ditemukan untuk kombinasi filter ini.");
        return;
      }

      // 2. Filter hanya kolom (field) yang dicentang oleh user berdasarkan urutan ALL_FIELDS
      const activeFieldConfigs = ALL_FIELDS.filter((f: any) => selectedFields.has(f.id));
      const headers = activeFieldConfigs.map((f: any) => f.label);

      const csvRows = [
        headers.join(","), // Header Row
        ...response.data.map((row: any) =>
          activeFieldConfigs
            .map((field) => {
              const val = row[field.id];
              // Escape double quote & bungkus dalam tanda kutip untuk format CSV aman
              const escaped = String(val ?? "").replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(",")
        ),
      ];

      const csvString = csvRows.join("\n");

      // 3. Tambahkan UTF-8 Byte Order Mark (BOM) agar Excel membaca karakter dan tanda kutip dengan rapi
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

      setIsOpen(false); // Tutup modal setelah berhasil
    } catch (error) {
      console.error("Export Execute Error:", error);
      alert("Terjadi kesalahan saat memproses file ekspor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Tombol Peluncur Modal */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-center font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:bg-boxdark dark:text-emerald-400 dark:hover:bg-emerald-950/20 transition-all shadow-sm active:scale-95"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Ekspor Data
      </button>

      {/* MODAL POP-UP KONFIGURASI EKSPOR */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-boxdark border border-stroke dark:border-strokedark animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark bg-gray-50 dark:bg-meta-4">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <Settings2 size={22} />
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white leading-tight">
                    Opsi Ekspor Data Generus (rawData)
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

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
              
              {/* BAGIAN 1: FILTER CAKUPAN DATA */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={14} /> 1. Filter Cakupan Data (Opsional)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-stroke dark:bg-meta-4/30 dark:border-strokedark">
                  {/* Select Kelompok */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white flex items-center gap-1">
                      <Users size={12} /> Filter Kelompok
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-xs text-black outline-none focus:border-emerald-500 dark:border-strokedark dark:bg-boxdark dark:text-white"
                    >
                      <option value="">Semua Kelompok</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Kelas/Kategori */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white flex items-center gap-1">
                      <Layers size={12} /> Filter Kelas / Kategori
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-xs text-black outline-none focus:border-emerald-500 dark:border-strokedark dark:bg-boxdark dark:text-white"
                    >
                      <option value="">Semua Kelas</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: PILIH KOLOM / FIELD DATA (RAW DATA) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={14} /> 2. Pilih Kolom Data Terlampir ({selectedFields.size}/{ALL_FIELDS.length})
                  </h4>
                  
                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={handlePresetAll}
                      className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors text-[11px]"
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={handlePresetIdentity}
                      className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors text-[11px]"
                    >
                      Identitas
                    </button>
                    <button
                      type="button"
                      onClick={handlePresetParents}
                      className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 transition-colors text-[11px]"
                    >
                      Orang Tua
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFields}
                      className="px-2 py-1 rounded bg-gray-100 text-red-600 hover:bg-red-50 dark:bg-meta-4 dark:text-red-400 transition-colors text-[11px] flex items-center gap-1"
                      title="Reset Pilihan"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>
                </div>

                {/* Render Per Group */}
                <div className="space-y-4">
                  {EXPORT_FIELD_GROUPS.map((group) => {
                    const groupFieldIds = group.fields.map(f => f.id);
                    const isAllGroupSelected = groupFieldIds.every(id => selectedFields.has(id));
                    const GroupIcon = group.icon;

                    return (
                      <div 
                        key={group.groupName} 
                        className="rounded-xl border border-stroke p-3 bg-gray-50/50 dark:bg-meta-4/20 dark:border-strokedark space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-stroke/60 dark:border-strokedark/60 pb-2">
                          <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                            <GroupIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                            {group.groupName}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleGroupFields(groupFieldIds)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                          >
                            {isAllGroupSelected ? "Batalkan Kelompok Ini" : "Pilih Kelompok Ini"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {group.fields.map((field) => {
                            const isChecked = selectedFields.has(field.id);
                            return (
                              <button
                                type="button"
                                key={field.id}
                                onClick={() => toggleField(field.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-medium transition-all ${
                                  isChecked
                                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-200"
                                    : "border-stroke bg-white text-gray-600 hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-gray-400"
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-gray-400 shrink-0" />
                                )}
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

            {/* Modal Footer */}
            <div className="border-t border-stroke px-6 py-4 flex items-center justify-between dark:border-strokedark bg-gray-50 dark:bg-meta-4">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Format: <strong className="text-black dark:text-white">CSV (.csv) UTF-8</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="rounded-lg border border-stroke px-4 py-2 text-xs font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExportExecute}
                  disabled={isLoading || selectedFields.size === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:hover:bg-emerald-600 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mengunduh...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Unduh File ({selectedFields.size} Kolom)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}