"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen, History, Layers, Edit, Trash2, X, Users, User, Filter } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { saveMaterialAction, deleteMaterialAction } from "../actions";
import { CategoryModel, GroupModel } from "@/lib/types/master.types";

interface UserOption {
  user_id: string;
  full_name: string | null;
  username: string;
}

interface ControlDashboardClientProps {
  progressCards: any[];
  materials: any[];
  history: any[];
  admin: any;
  groups: GroupModel[];
  categories: CategoryModel[];
  onFetchGenerus: (groupId: number, categoryId: number) => Promise<{ success: boolean; data?: UserOption[] }>;
}

export function ControlDashboardClient({ 
  progressCards, 
  materials, 
  history,
  admin,
  groups,
  categories,
  onFetchGenerus
}: ControlDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isAdminKelompok = admin?.role === 'admin_kelompok';

  // --- STATE FILTER DASHBOARD ---
  const currentGroup = searchParams.get("group") || (isAdminKelompok ? String(admin.group_id) : "");
  const currentCategory = searchParams.get("category") || "";
  const currentUser = searchParams.get("user") || "";

  const [fetchedUsers, setFetchedUsers] = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users dinamis jika group dan category dipilih
  useEffect(() => {
    if (currentGroup && currentCategory) {
      setIsLoadingUsers(true);
      onFetchGenerus(Number(currentGroup), Number(currentCategory))
        .then(res => {
          if (res.success && res.data) setFetchedUsers(res.data);
          else setFetchedUsers([]);
        })
        .finally(() => setIsLoadingUsers(false));
    } else {
      setFetchedUsers([]);
    }
  }, [currentGroup, currentCategory, onFetchGenerus]);

  // Fungsi Update Parameter URL
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) params.set(key, value);
    else params.delete(key);

    // Reset child filters jika parent berubah
    if (key === "group") {
      params.delete("category");
      params.delete("user");
    }
    if (key === "category") {
      params.delete("user");
    }

    router.push(`?${params.toString()}`);
  };

  // --- STATE MODAL MASTER MATERI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [totalPages, setTotalPages] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const openModal = (material: any = null) => {
    setErrorMsg("");
    setEditingMaterial(material);
    if (material) {
      setName(material.name);
      setTotalPages(material.total_pages);
      setNotes(material.notes || "");
    } else {
      setName("");
      setTotalPages("");
      setNotes("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalPages || Number(totalPages) < 1) {
      setErrorMsg("Nama dan Total Halaman valid wajib diisi.");
      return;
    }

    setErrorMsg("");
    startTransition(async () => {
      const res = await saveMaterialAction({
        id: editingMaterial?.id,
        name,
        total_pages: Number(totalPages),
        notes,
      });

      if (res.success) closeModal();
      else setErrorMsg(res.message);
    });
  };

  const handleDeleteMaterial = (id: number, matName: string) => {
    if (confirm(`Apakah Anda yakin menghapus materi "${matName}"? Data rekap generus pada materi ini akan ikut terhapus!`)) {
      startTransition(async () => {
        await deleteMaterialAction(id);
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* --- FILTER BAR DASHBOARD --- */}
      <div className="rounded-2xl border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h4 className="mb-4 font-bold text-black dark:text-white flex items-center gap-2">
          <Filter size={18} className="text-primary"/> Filter Dashboard Analisis
        </h4>
        
        <div className={cn("grid grid-cols-1 gap-4", isAdminKelompok ? "md:grid-cols-2" : "md:grid-cols-3")}>
          
          {/* Sembunyikan Pilihan Kelompok Jika Admin Kelompok */}
          {!isAdminKelompok && (
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white flex items-center gap-1.5">
                <Users size={14} className="text-primary" /> Kelompok
              </label>
              <select
                value={currentGroup}
                onChange={(e) => updateFilter("group", e.target.value)}
                className="w-full rounded-full border border-stroke bg-transparent px-5 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
              >
                <option value="">Semua Kelompok</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="dark:bg-boxdark">{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white flex items-center gap-1.5">
              <Layers size={14} className="text-primary" /> Kategori (Kelas)
            </label>
            <select
              value={currentCategory}
              onChange={(e) => updateFilter("category", e.target.value)}
              disabled={!currentGroup && !isAdminKelompok}
              className="w-full rounded-full border border-stroke bg-transparent px-5 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white disabled:opacity-50"
            >
              <option value="">Semua Kelas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-boxdark">{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white flex items-center gap-1.5">
              <User size={14} className="text-primary" /> Generus Spesifik
            </label>
            <select
              value={currentUser}
              onChange={(e) => updateFilter("user", e.target.value)}
              disabled={!currentCategory || isLoadingUsers}
              className="w-full rounded-full border border-stroke bg-transparent px-5 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white disabled:opacity-50"
            >
              <option value="">{isLoadingUsers ? "Memuat Generus..." : "Semua Anak"}</option>
              {fetchedUsers.map((u) => (
                <option key={u.user_id} value={u.user_id} className="dark:bg-boxdark">
                  {u.full_name || u.username}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* --- SECTION 1: GRID PERSENTASE MATERI --- */}
      <div>
        <h3 className="mb-4 text-xl font-bold text-black dark:text-white">Progres Capaian Materi</h3>
        {progressCards.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 italic">Belum ada data progres untuk ditampilkan.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {progressCards.map((card) => (
              <div key={card.material_id} className="rounded-2xl border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                    <BookOpen size={20} className="text-primary dark:text-white" />
                  </div>
                  <span className="text-sm font-black text-meta-3 bg-meta-3/10 px-2.5 py-1 rounded-full">
                    {card.percentage}% Selesai
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div className="w-full">
                    <h4 className="text-title-md font-bold text-black dark:text-white truncate" title={card.name}>
                      {card.name}
                    </h4>
                    <span className="text-xs text-gray-500 block mt-1">{card.total_pages} Halaman (Total)</span>
                    
                    <div className="mt-3 h-2 w-full rounded-full bg-stroke dark:bg-meta-4">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${card.percentage}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1.5 block">{card.total_recap} Anak Telah Mengisi Progres</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- SECTION 2: DUA CARD SEJAJAR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD KIRI: Daftar Kontrol Materi */}
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex flex-col h-[500px]">
          <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-strokedark">
            <h4 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-primary" /> Daftar Target Materi
            </h4>
            <button
              onClick={() => openModal()}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-center text-xs font-semibold text-white hover:bg-opacity-90 shadow-sm transition"
            >
              <Plus size={14} /> Tambah Materi
            </button>
          </div>
          
          <div className="overflow-y-auto flex-grow mt-4 pr-1 gap-3 flex flex-col">
            {materials.length === 0 ? (
              <p className="text-center text-gray-500 text-sm my-auto">Belum ada target materi dikonfigurasi.</p>
            ) : (
              materials.map((mat) => (
                <div key={mat.id} className="group p-3.5 border border-stroke dark:border-strokedark rounded-xl bg-gray-50 dark:bg-meta-4/30 flex items-center justify-between transition-colors hover:bg-gray-100 dark:hover:bg-meta-4">
                  <div>
                    <span className="font-semibold text-sm text-black dark:text-white block">{mat.name}</span>
                    <span className="text-xs text-gray-400 block mt-0.5">{mat.notes || "Tidak ada catatan."}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 dark:bg-boxdark dark:text-slate-300 px-2.5 py-1 rounded-lg">
                      {mat.total_pages} Hal
                    </span>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(mat)} disabled={isPending} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md dark:hover:bg-blue-900/30 transition">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteMaterial(mat.id, mat.name)} disabled={isPending} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md dark:hover:bg-red-900/30 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD KANAN: History Input */}
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex flex-col h-[500px]">
          <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-strokedark">
            <h4 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
              <History size={18} className="text-emerald-600" /> Log Aktivitas Kontrol
            </h4>
            <Link
              href="/control/recap" 
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-center text-xs font-semibold text-white hover:bg-opacity-90 shadow-sm transition"
            >
              <Plus size={14} /> Buka Lembar Progres
            </Link>
          </div>

          <div className="overflow-y-auto flex-grow mt-4 pr-1 gap-3 flex flex-col">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 text-sm my-auto">Belum ada riwayat pengisian progres materi.</p>
            ) : (
              history.map((log) => {
                let filledCount = 0;
                if (Array.isArray(log.recapitulation)) {
                  filledCount = log.recapitulation.filter((status: string) => status !== "E").length;
                }
                
                return (
                  <div key={log.id} className="p-3.5 border border-stroke dark:border-strokedark rounded-xl bg-gray-50 dark:bg-meta-4/30 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-black dark:text-white block truncate">
                        {log.profile?.full_name || log.profile?.username}
                      </span>
                      <span className="text-xs text-gray-500 block mt-0.5 truncate">
                        Kitab: <strong className="text-primary dark:text-white font-medium">{log.control_material?.name}</strong>
                      </span>
                      <span className="text-xs italic text-slate-400 block mt-1">
                        Telah mewarnai/menyelesaikan {filledCount} halaman.
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 bg-white border border-stroke dark:border-strokedark dark:bg-boxdark p-1 px-2 rounded-md shrink-0">
                      {format(new Date(log.created_at), "d MMM HH:mm", { locale: localeId })}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* ================= MODAL TAMBAH/EDIT MATERI ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
              <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                <BookOpen size={20} className="text-primary"/> 
                {editingMaterial ? "Edit Target Materi" : "Tambah Target Materi"}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-black dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nama Kitab / Materi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cth: Al-Baqarah, Kitab Sholat..."
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Jumlah Total Halaman <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  value={totalPages}
                  onChange={(e) => setTotalPages(Number(e.target.value))}
                  placeholder="Cth: 150"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">*Jumlah lembar tombol yang akan digenerate.</span>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cth: Target penyelesaian tahun 2025"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                />
              </div>

              {errorMsg && (
                <div className="rounded-lg border border-red-500 bg-red-100 p-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-stroke pt-4 mt-2 dark:border-strokedark">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-lg border border-stroke px-4 py-2 font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50 transition flex items-center gap-2"
                >
                  {isPending ? "Menyimpan..." : "Simpan Materi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}