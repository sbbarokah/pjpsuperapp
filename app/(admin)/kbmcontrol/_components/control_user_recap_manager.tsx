"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { 
  BookOpen, 
  User, 
  Users,
  Layers,
  Paintbrush, 
  Check, 
  Trash2, 
  Info, 
  Save, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryModel, GroupModel } from "@/lib/types/master.types";

// Tipe Status (G: Green, O: Orange, Y: Yellow, E: Empty)
type PageStatus = "G" | "O" | "Y" | "E";

export interface UserOption {
  user_id: string;
  full_name: string | null;
  username: string;
  group_id: number | null;
  category_id: number | null;
  group_name?: string;
}

export interface MaterialOption {
  id: number;
  name: string;
  total_pages: number;
}

export interface AdminProfile {
  role: string;
  group_id: number | null;
  village_id: number | null;
}

interface ControlRecapManagerProps {
  admin: AdminProfile;
  groups?: GroupModel[];
  categories?: CategoryModel[];
  materials?: MaterialOption[];
  onFetchGenerus: (groupId: number, categoryId: number) => Promise<{ success: boolean; data?: UserOption[]; message?: string }>;
  onLoadRecap: (userId: string, materialId: number) => Promise<{ success: boolean; recapitulation: PageStatus[] }>;
  onSaveFullRecap: (userId: string, materialId: number, recapitulation: PageStatus[]) => Promise<{ success: boolean; message?: string }>;
}

export default function ControlRecapManager({
  admin,
  groups = [],
  categories = [],
  materials = [],   
  onFetchGenerus,
  onLoadRecap,
  onSaveFullRecap
}: ControlRecapManagerProps) {
  const [isPending, startTransition] = useTransition();
  const isAdminKelompok = admin?.role === 'admin_kelompok';

  // --- State Utama Form Seleksi Berjenjang ---
  const [selectedGroupId, setSelectedGroupId] = useState<string>(isAdminKelompok ? String(admin.group_id) : "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  
  // --- State Dinamis Generus ---
  const [fetchedUsers, setFetchedUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // --- State Lembar Data Halaman (Array of Statuses) ---
  const [originalPagesArray, setOriginalPagesArray] = useState<PageStatus[]>([]); // Untuk perbandingan perubahan
  const [pagesArray, setPagesArray] = useState<PageStatus[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // --- State Fitur Interaksi Grid ---
  const [activeBrush, setActiveBrush] = useState<PageStatus | "none">("none");
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null); // Untuk logic Shift+Click

  // --- State Navigasi Blok Halaman ---
  const [activeTabBlock, setActiveTabBlock] = useState<number>(0); 
  const itemsPerBlock = 100;

  // --- State Bulk Action ---
  const [bulkStart, setBulkStart] = useState("");
  const [bulkEnd, setBulkEnd] = useState("");
  const [bulkStatus, setBulkStatus] = useState<PageStatus>("G");
  const [bulkError, setBulkError] = useState<string | null>(null);
  
  // Mengecek apakah ada perubahan yang belum disimpan
  const isDirty = useMemo(() => {
    return JSON.stringify(pagesArray) !== JSON.stringify(originalPagesArray);
  }, [pagesArray, originalPagesArray]);

  // --- Handlers untuk Dropdown Berjenjang ---
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroupId(e.target.value);
    setSelectedCategoryId(""); // Reset kelas
    setSelectedUserId("");     // Reset user
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setSelectedUserId("");     // Reset user
  };

  // Ambil daftar generus dari server saat kelompok dan kelas sudah dipilih
  useEffect(() => {
    if (selectedGroupId && selectedCategoryId) {
      setIsLoadingUsers(true);
      onFetchGenerus(Number(selectedGroupId), Number(selectedCategoryId))
        .then((res) => {
          if (res.success && res.data) {
            setFetchedUsers(res.data);
          } else {
            setFetchedUsers([]);
          }
        })
        .catch(() => setFetchedUsers([]))
        .finally(() => setIsLoadingUsers(false));
    } else {
      setFetchedUsers([]);
    }
  }, [selectedGroupId, selectedCategoryId, onFetchGenerus]);

  const activeMaterial = useMemo(() => {
    return materials.find((m) => String(m.id) === selectedMaterialId) || null;
  }, [selectedMaterialId, materials]);

  // Muat data rekapitulasi saat user dan materi terpilih
  useEffect(() => {
    if (selectedUserId && selectedMaterialId && activeMaterial) {
      setIsSyncing(true);
      setSyncStatus("Memuat data halaman...");
      
      const totalPages = activeMaterial.total_pages;
      
      onLoadRecap(selectedUserId, Number(selectedMaterialId)).then((res) => {
        const newPages = Array(totalPages).fill("E") as PageStatus[];
        
        if (res.success && res.recapitulation && res.recapitulation.length > 0) {
          for (let i = 0; i < Math.min(totalPages, res.recapitulation.length); i++) {
            newPages[i] = res.recapitulation[i];
          }
          setSyncStatus("Lembar terbuka.");
        } else {
          setSyncStatus("Lembar kosong dimuat.");
        }
        
        setPagesArray(newPages);
        setOriginalPagesArray([...newPages]); // Simpan sebagai baseline perbandingan
        setIsSyncing(false);
      });
    } else {
      setPagesArray([]);
      setOriginalPagesArray([]);
      setSyncStatus(null);
    }
    
    setActiveBrush("none");
    setActiveTabBlock(0);
    setLastClickedIndex(null);
    setBulkError(null);
  }, [selectedUserId, selectedMaterialId, activeMaterial, onLoadRecap]);

  // Statistik Keterisian Halaman
  const stats = useMemo(() => {
    if (!activeMaterial || pagesArray.length === 0) return { greenCount: 0, orangeCount: 0, yellowCount: 0, emptyCount: 0, percentage: 0 };
    
    let green = 0, orange = 0, yellow = 0, empty = 0;

    pagesArray.forEach((status) => {
      if (status === "G") green++;
      else if (status === "O") orange++;
      else if (status === "Y") yellow++;
      else empty++;
    });

    const filledCount = green + orange + yellow;
    const percentage = Math.round((filledCount / activeMaterial.total_pages) * 100) || 0;

    return { greenCount: green, orangeCount: orange, yellowCount: yellow, emptyCount: empty, percentage };
  }, [pagesArray, activeMaterial]);

  const tabBlocks = useMemo(() => {
    if (!activeMaterial) return [];
    const blocks = [];
    const count = Math.ceil(activeMaterial.total_pages / itemsPerBlock);
    for (let i = 0; i < count; i++) {
      blocks.push({ 
        index: i, 
        label: `Hal. ${i * itemsPerBlock + 1} - ${Math.min((i + 1) * itemsPerBlock, activeMaterial.total_pages)}` 
      });
    }
    return blocks;
  }, [activeMaterial, itemsPerBlock]);

  // --- EKSEKUSI KLIK HALAMAN (Mendukung Shift+Click) ---
  const handlePageClick = (pageNumber: number, e: React.MouseEvent) => {
    // Mencegah block/highlight teks bawaan browser saat menekan Shift
    if (e.shiftKey) e.preventDefault();

    if (!selectedUserId || !selectedMaterialId) return;

    const pageIndex = pageNumber - 1;
    let nextStatus: PageStatus = "E";
    
    // Tentukan status yang akan di-apply
    if (activeBrush !== "none") {
      nextStatus = activeBrush; 
    } else {
      const current = pagesArray[pageIndex];
      if (current === "E") nextStatus = "G";
      else if (current === "G") nextStatus = "O";
      else if (current === "O") nextStatus = "Y";
      else nextStatus = "E";
    }

    // Ubah Array secara lokal
    setPagesArray((prev) => {
      const updated = [...prev];

      // Jika tombol Shift ditahan dan ada histori klik sebelumnya, warnai semua index di antaranya
      if (e.shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, pageIndex);
        const end = Math.max(lastClickedIndex, pageIndex);
        for (let i = start; i <= end; i++) {
          updated[i] = nextStatus;
        }
      } else {
        // Klik normal
        updated[pageIndex] = nextStatus;
      }

      return updated;
    });

    // Simpan index ini sebagai referensi jika klik berikutnya menggunakan Shift
    setLastClickedIndex(pageIndex);
  };

  // --- EKSEKUSI TANDAI MASAL LOKAL (BULK UPDATE) ---
  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null); // Reset pesan error sebelumnya

    if (!selectedUserId || !selectedMaterialId || !activeMaterial) return;

    const startNum = parseInt(bulkStart);
    const endNum = parseInt(bulkEnd);

    if (isNaN(startNum) || isNaN(endNum) || startNum < 1 || endNum > activeMaterial.total_pages || startNum > endNum) {
      setBulkError("Rentang halaman tidak valid. Pastikan halaman awal lebih kecil atau sama dengan halaman akhir, dan sesuai dengan total halaman kitab.");
      return;
    }

    // Hanya mengubah State lokal agar memunculkan tombol 'Simpan Perubahan'
    setPagesArray((prev) => {
      const updated = [...prev];
      for (let i = startNum - 1; i <= endNum - 1; i++) {
        updated[i] = bulkStatus;
      }
      return updated;
    });

    setBulkStart("");
    setBulkEnd("");
    setLastClickedIndex(null); // Reset memori Shift+Click
  };

  // --- FUNGSI SIMPAN PERUBAHAN KE SERVER ---
  const handleSaveChanges = () => {
    if (!selectedUserId || !selectedMaterialId) return;

    startTransition(async () => {
      setIsSyncing(true);
      setSyncStatus("Menyimpan ke database...");

      const res = await onSaveFullRecap(selectedUserId, Number(selectedMaterialId), pagesArray);

      if (res.success) {
        // Jika sukses, jadikan array ini sebagai baseline original yang baru (menghilangkan tombol Simpan)
        setOriginalPagesArray([...pagesArray]);
        setSyncStatus("Sukses disimpan!");
      } else {
        setSyncStatus("Gagal menyimpan data.");
      }
      setIsSyncing(false);
      
      // Hilangkan pesan setelah 3 detik
      setTimeout(() => setSyncStatus(null), 3000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ================= BAR SELEKSI UTAMA BERJENJANG ================= */}
      <div className="rounded-2xl border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Pilih Kelompok */}
          <div>
            <label className="mb-2 block font-medium text-black dark:text-white flex items-center gap-1.5">
              <Users size={16} className="text-primary" /> Kelompok
            </label>
            <select
              value={selectedGroupId}
              onChange={handleGroupChange}
              disabled={isAdminKelompok || isDirty} 
              className="w-full rounded-full border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">-- Pilih Kelompok --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="dark:bg-boxdark">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Pilih Kategori / Kelas */}
          <div>
            <label className="mb-2 block font-medium text-black dark:text-white flex items-center gap-1.5">
              <Layers size={16} className="text-primary" /> Kategori (Kelas)
            </label>
            <select
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              disabled={(!selectedGroupId && !isAdminKelompok) || isDirty} 
              className="w-full rounded-full border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">-- Pilih Kelas --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-boxdark">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Pilih Generus */}
          <div>
            <label className="mb-2 block font-medium text-black dark:text-white flex items-center gap-1.5">
              <User size={16} className="text-primary" /> Nama Generus
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={!selectedCategoryId || isLoadingUsers || isDirty} 
              className="w-full rounded-full border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">{isLoadingUsers ? "Memuat Generus..." : "-- Pilih Generus --"}</option>
              {fetchedUsers.map((u) => (
                <option key={u.user_id} value={u.user_id} className="dark:bg-boxdark">
                  {u.full_name || u.username}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Pilih Kitab */}
          <div>
            <label className="mb-2 block font-medium text-black dark:text-white flex items-center gap-1.5">
              <BookOpen size={16} className="text-primary" /> Kitab / Target
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              disabled={isDirty}
              className="w-full rounded-full border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">-- Pilih Kitab --</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-boxdark">
                  {m.name} ({m.total_pages} Hal)
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Tampilan Lembar Kontrol */}
      {activeMaterial && selectedUserId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none">
          
          {/* ================= PANEL SEBELAH KIRI (GRID HALAMAN & KUAS) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-stroke pb-4 dark:border-strokedark gap-4">
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                    <BookOpen className="text-primary" size={20} /> Lembar Halaman {activeMaterial.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Klik atau <strong>Tahan tombol SHIFT + Klik</strong> untuk mewarnai halaman secara bersamaan.
                  </p>
                </div>

                {/* INDIKATOR STATUS & TOMBOL SIMPAN */}
                <div className="flex items-center gap-2 text-xs">
                  {isDirty ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                      <button
                        type="button"
                        onClick={() => setPagesArray([...originalPagesArray])}
                        disabled={isSyncing}
                        className="px-3 py-2 rounded-lg border border-stroke text-slate-600 hover:bg-slate-100 dark:border-strokedark dark:text-slate-300 dark:hover:bg-meta-4 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={isSyncing}
                        className="px-4 py-2 rounded-lg bg-primary text-white font-bold flex items-center gap-2 shadow-sm shadow-primary/30 hover:bg-opacity-90 transition disabled:opacity-70"
                      >
                        {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        Simpan Perubahan
                      </button>
                    </div>
                  ) : (
                    syncStatus && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold dark:text-emerald-400">
                        {syncStatus === "Memuat data halaman..." ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} 
                        {syncStatus}
                      </span>
                    )
                  )}
                </div>
              </div>

              {tabBlocks.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-4 pb-3 border-b border-stroke dark:border-strokedark">
                  {tabBlocks.map((block) => (
                    <button
                      key={block.index}
                      type="button"
                      onClick={() => setActiveTabBlock(block.index)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all border",
                        activeTabBlock === block.index
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-gray-100 border-stroke text-slate-600 hover:bg-gray-200 dark:bg-meta-4 dark:border-strokedark dark:text-slate-300"
                      )}
                    >
                      {block.label}
                    </button>
                  ))}
                </div>
              )}

              {/* GRID HALAMAN */}
              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-3.5 mt-6 justify-center">
                {Array.from({ length: activeMaterial.total_pages })
                  .map((_, i) => i + 1)
                  .filter((num) => num >= activeTabBlock * itemsPerBlock + 1 && num <= (activeTabBlock + 1) * itemsPerBlock)
                  .map((pageNum) => {
                    const status = pagesArray[pageNum - 1] || "E";
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={(e) => handlePageClick(pageNum, e)}
                        className={cn(
                          "w-12 h-12 rounded-xl text-xs font-black border transition-all active:scale-90 flex items-center justify-center shadow-sm",
                          status === "G" && "bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/10 hover:bg-emerald-600",
                          status === "O" && "bg-amber-500 border-amber-600 text-white shadow-amber-500/10 hover:bg-amber-600",
                          status === "Y" && "bg-yellow-400 border-yellow-500 text-black shadow-yellow-500/10 hover:bg-yellow-500",
                          status === "E" && "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300 dark:bg-meta-4 dark:border-strokedark dark:text-slate-300 dark:hover:bg-opacity-80"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ================= PANEL SEBELAH KANAN (DIAGNOSTIK, KUAS & BULK) ================= */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* CARD STATISTIK */}
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h4 className="text-base font-bold text-black dark:text-white border-b border-stroke pb-2.5 dark:border-strokedark flex items-center gap-1.5">
                <Sparkles size={16} className="text-primary" /> Statistik Progres Kitab
              </h4>

              <div className="mt-4 flex flex-col items-center">
                <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-slate-50 border-4 border-stroke dark:bg-meta-4 dark:border-strokedark">
                  <div className="text-center">
                    <span className="text-2xl font-black text-black dark:text-white">{stats.percentage}%</span>
                    <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">Keterisian</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-3 mt-6 text-xs">
                  <div className="p-2 border border-stroke rounded-xl bg-emerald-500/5 dark:border-strokedark">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-base">{stats.greenCount} Hal</span>
                    <span className="text-gray-400 text-[10px]">Full Makna & Ket</span>
                  </div>
                  <div className="p-2 border border-stroke rounded-xl bg-amber-500/5 dark:border-strokedark">
                    <span className="text-amber-600 dark:text-amber-400 font-bold block text-base">{stats.orangeCount} Hal</span>
                    <span className="text-gray-400 text-[10px]">Full Makna Saja</span>
                  </div>
                  <div className="p-2 border border-stroke rounded-xl bg-yellow-400/5 dark:border-strokedark">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold block text-base">{stats.yellowCount} Hal</span>
                    <span className="text-gray-400 text-[10px]">Sebagian / Tidak Full</span>
                  </div>
                  <div className="p-2 border border-stroke rounded-xl bg-slate-100 dark:border-strokedark">
                    <span className="text-slate-600 dark:text-slate-300 font-bold block text-base">{stats.emptyCount} Hal</span>
                    <span className="text-gray-400 text-[10px]">Belum Dibahas (Empty)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD KUAS PEWARNA */}
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h4 className="text-base font-bold text-black dark:text-white border-b border-stroke pb-2.5 dark:border-strokedark flex items-center gap-1.5">
                <Paintbrush size={16} className="text-primary" /> Alat Kuas Pewarna
              </h4>
              <div className="flex flex-col gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveBrush(activeBrush === "G" ? "none" : "G")}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                    activeBrush === "G" ? "bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/20" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
                  )}
                >
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />Kuas: Full Makna & Ket</span>
                  {activeBrush === "G" && <Check size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBrush(activeBrush === "O" ? "none" : "O")}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                    activeBrush === "O" ? "bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20" : "bg-amber-500/5 border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                  )}
                >
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />Kuas: Full Makna Saja</span>
                  {activeBrush === "O" && <Check size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBrush(activeBrush === "Y" ? "none" : "Y")}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                    activeBrush === "Y" ? "bg-yellow-400 border-yellow-500 text-black shadow-md shadow-yellow-500/10" : "bg-yellow-400/5 border-yellow-400/20 text-yellow-600 hover:bg-yellow-400/10"
                  )}
                >
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400 border border-white" />Kuas: Sebagian</span>
                  {activeBrush === "Y" && <Check size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBrush(activeBrush === "E" ? "none" : "E")}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                    activeBrush === "E" ? "bg-slate-600 border-slate-700 text-white shadow-md" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-meta-4 dark:border-strokedark dark:text-slate-300"
                  )}
                >
                  <span className="flex items-center gap-2"><Trash2 size={14} />Penghapus (Kosongkan)</span>
                  {activeBrush === "E" && <Check size={16} />}
                </button>
              </div>
            </div>

            {/* CARD BULK INPUT */}
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h4 className="text-base font-bold text-black dark:text-white border-b border-stroke pb-2.5 dark:border-strokedark flex items-center gap-1.5">
                <Layers size={16} className="text-primary" /> Input Masal Cepat
              </h4>

              <form onSubmit={handleBulkSubmit} className="mt-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 block mb-1">Dari Halaman</label>
                    <input 
                      type="number" 
                      value={bulkStart} 
                      onChange={(e) => { setBulkStart(e.target.value); setBulkError(null); }} 
                      required 
                      className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-form-strokedark text-black dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 block mb-1">Sampai Halaman</label>
                    <input 
                      type="number" 
                      value={bulkEnd} 
                      onChange={(e) => { setBulkEnd(e.target.value); setBulkError(null); }} 
                      required 
                      className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-form-strokedark text-black dark:text-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Set Status</label>
                  <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as PageStatus)} className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-form-strokedark text-black dark:text-white">
                    <option value="G">Full Makna & Keterangan</option>
                    <option value="O">Full Makna Saja</option>
                    <option value="Y">Sebagian / Tidak Full</option>
                    <option value="E">Kosongkan Status (Empty)</option>
                  </select>
                </div>

                {bulkError && (
                  <div className="mt-2 rounded border border-red-500 bg-red-100 p-2 text-xs text-red-700">
                    {bulkError}
                  </div>
                )}

                <button type="submit" disabled={!bulkStart || !bulkEnd} className="w-full py-2.5 rounded-lg bg-gray-100 border border-stroke text-slate-700 text-xs font-bold hover:bg-gray-200 dark:bg-meta-4 dark:border-strokedark dark:text-white transition disabled:opacity-50 mt-2">
                  Terapkan Warna ke Lembar
                </button>
              </form>
            </div>

          </div>

        </div>
      ) : (
        <div className="rounded-2xl border border-stroke border-dashed bg-white p-12 text-center shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-meta-4 mx-auto mb-4"><Info className="text-primary" size={24} /></div>
          <h4 className="text-lg font-bold text-black dark:text-white">Lembar Kontrol Belum Terbuka</h4>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">Silakan lengkapi pemilihan (Kelas, Generus, dan Kitab) di panel atas untuk memulai kontrol hafalan/materi.</p>
        </div>
      )}
    </div>
  );
}