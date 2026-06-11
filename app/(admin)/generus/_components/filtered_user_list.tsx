"use client";

import { useState, useMemo, useEffect } from "react";
import { UserAdminView } from "@/lib/types/user.types"; // Perlu tipe UserAdminView
import { UserCard } from "@/components/cards/carduser"; // Impor UserCard Anda
import { DeleteUserButton } from "./delete_user_button"; // Asumsi path ini benar
import Link from "next/link";
import { FaEye, FaFilter } from "react-icons/fa";
import { UserDetailModal } from "./user_detail_modal";
import { UpdateCategoryModal } from "./update_category_modal";
import { ArrowDownZA, ArrowUpAZ, ChevronLeft, ChevronRight, Eye, Filter, Layers, Search } from "lucide-react";
import { updateUserAction } from "../actions";
import { CategoryModel } from "@/lib/types/master.types";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * [BARU] Komponen Select Dropdown internal yang ringan
 */
const FilterSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder: string;
}) => (
  <div>
    <label htmlFor={name} className="mb-2.5 block font-medium text-black dark:text-white">
      {label}
    </label>
    <div className="relative z-20 bg-transparent dark:bg-form-input">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        // Gunakan style yang sama dengan search bar Anda
        className="relative z-20 w-full appearance-none rounded-full border border-stroke bg-white py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:focus-visible:border-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {/* Ikon panah/filter */}
      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
        <FaFilter className="text-gray-500" />
      </span>
    </div>
  </div>
);

type FilteredUserListProps = {
  users: UserAdminView[];
  allClass: CategoryModel[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
};

export function FilteredUserListClient({ 
  users, 
  allClass, 
  totalItems, 
  currentPage, 
  itemsPerPage 
}: FilteredUserListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State lokal khusus penampung ketikan teks input (untuk Debounce)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [isInitialMount, setIsInitialMount] = useState(true);

  // State Manajemen Modal
  const [selectedUser, setSelectedUser] = useState<UserAdminView | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [userForCategory, setUserForCategory] = useState<UserAdminView | null>(null);

  // Ambil nilai filter aktif saat ini dari URL params
  const currentGroup = searchParams.get("group") || "";
  const currentCategory = searchParams.get("category") || "";

  // Logika Pusat Perubahan Filter & Pagination via URL Params
  const updateUrlParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // Otomatis reset ke page 1 jika filter utama berubah (bukan trigger ganti page)
    if (!newParams.page) {
      params.set("page", "1");
    }

    router.push(`?${params.toString()}`);
  };

  // Debounce Logic untuk Pencarian Teks Minimal 3 Karakter
  useEffect(() => {
    // Jika ini adalah render pertama kali (misal saat baru pindah halaman),
    // lewati fungsi debounce agar tidak memaksa reset ke Page 1
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    const delayDebounce = setTimeout(() => {
      if (searchInput.length === 0 || searchInput.length >= 3) {
        updateUrlParams({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleOpenCategoryModal = (user: any) => {
    setUserForCategory(user);
    setIsCategoryModalOpen(true);
  };

  // Fungsi Handler Eksekusi Update ke Server Action
  const handleConfirmCategoryUpdate = async (userId: string, newCategoryName: string) => {
    try {
      // 1. Cari data objek kategori lengkap dari properti allClass untuk mendapatkan ID-nya
      // Karena allClass berisi master CategoryModel yang dikirim dari server
      const targetCategory = allClass.find(c => c.name === newCategoryName);

      if (!targetCategory) {
        return { 
          success: false, 
          message: `Kategori "${newCategoryName}" tidak ditemukan dalam master data.` 
        };
      }

      // 2. Susun payload sesuai dengan struktur UpdateUserFormPayload yang dibutuhkan oleh updateUserAction
      const payload = {
        profileData: {
          category_id: targetCategory.id // Ambil ID (bisa berupa number/string/bigint sesuai DB Anda)
        }
      };

      // 3. Panggil Server Action milik Anda
      const response = await updateUserAction(userId, payload);

      if (response.success) {
        router.refresh(); // Segarkan data RSC di client-side
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }

    } catch (err: any) {
      console.error("handleConfirmCategoryUpdate Error:", err);
      return { 
        success: false, 
        message: "Terjadi kesalahan saat memproses pembaruan kategori kelas." 
      };
    }
  };

  const { uniqueGroups, uniqueCategories } = useMemo(() => {
    const groupSet = new Set<string>();
    const categorySet = new Set<string>();

    // Kategori dibaca langsung dari master data allClass agar opsinya lengkap
    allClass.forEach(c => categorySet.add(c.name));

    // Kelompok tetap dari users (atau jika ada master groups dari server, lebih baik gunakan itu)
    users.forEach(user => {
      if (user.group?.name) groupSet.add(user.group.name);
    });

    return {
      uniqueGroups: Array.from(groupSet).sort(),
      uniqueCategories: Array.from(categorySet).sort(),
    };
  }, [users, allClass]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentSort = searchParams.get("sort") || "asc";

  return (
    <div className="flex flex-col gap-6">
      {/* --- [BARU] Komponen Search Bar --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
  
        {/* AREA SEARCH: Diperluas menjadi col-span-4 */}
        <div className="w-full md:col-span-5">
          <label htmlFor="search" className="mb-2.5 block font-medium text-black dark:text-white">
            Cari Nama (min. 3 karakter)
          </label>
          <div className="relative">
            <input
              id="search"
              type="search"
              placeholder="Cari..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex w-full items-center gap-3.5 rounded-full border bg-white py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:focus-visible:border-primary text-black dark:text-white"
            />
            <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* FILTER KELOMPOK: Mengambil col-span-3 */}
        <div className="w-full md:col-span-3">
          <FilterSelect
            label="Filter Kelompok"
            name="group_filter"
            value={currentGroup}
            onChange={(e) => updateUrlParams({ group: e.target.value })}
            options={uniqueGroups}
            placeholder="Semua Kelompok"
          />
        </div>

        {/* FILTER KELAS: Mengambil col-span-4 */}
        <div className="w-full md:col-span-3">
          <FilterSelect
            label="Filter Kelas"
            name="category_filter"
            value={currentCategory}
            onChange={(e) => updateUrlParams({ category: e.target.value })}
            options={uniqueCategories}
            placeholder="Semua Kelas"
          />
        </div>
        
        {/* TOMBOL URUTAN: Dipersempit menjadi col-span-1 saja */}
        <div className="w-full md:col-span-1 flex flex-col items-center md:items-start">
          {/* Label pembantu, tetap rapi di desktop */}
          <label className="mb-2.5 block font-medium text-black dark:text-white invisible md:visible">
            Urutan
          </label>
          
          <button
            type="button"
            title={currentSort === "asc" ? "Urutan: A - Z (Klik untuk Z - A)" : "Urutan: Z - A (Klik untuk A - Z)"}
            onClick={() => updateUrlParams({ sort: currentSort === "asc" ? "desc" : "asc" })}
            className={cn(
              "flex h-[50px] w-[50px] items-center justify-center rounded-full border border-stroke bg-white outline-none transition-all",
              "hover:border-primary hover:bg-gray-50 active:scale-95",
              "dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3",
              currentSort === "desc" 
                ? "text-primary border-primary dark:text-primary dark:border-primary" 
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            {currentSort === "asc" ? (
              <ArrowUpAZ size={20} />
            ) : (
              <ArrowDownZA size={20} />
            )}
          </button>
        </div>
      </div>

      {/* --- GRID USER CARD --- */}
      {totalItems === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300 py-10">
          Tidak ada data Generus yang cocok dengan kriteria pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((user) => (
            <UserCard
              key={user.user_id}
              user={user}
              href={`/generus/edit/${user.user_id}`}
              actions={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleOpenCategoryModal(user);
                    }}
                    className="group flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all dark:text-amber-400"
                    title="Ubah Kategori Kelas"
                  >
                    <Layers size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleViewDetails(user);
                    }}
                    className="group flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    title="Lihat Detail"
                  >
                    <Eye size={14} />
                  </button>
                  <DeleteUserButton id={user.user_id} name={user.full_name || user.username} />
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* --- PANEL PAGINATION CONTROL --- */}
      {totalItems > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-stroke dark:border-slate-700 shadow-default flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Menampilkan <span className="font-black text-slate-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-black text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-black text-slate-850 dark:text-slate-200">{totalItems}</span> data generus
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers size={12} /> Tampilkan:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => updateUrlParams({ limit: Number(e.target.value), page: 1 })}
                className="p-1.5 px-2.5 text-xs font-black rounded-xl border border-stroke dark:border-slate-700 bg-gray-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                <option value={10}>10 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 justify-center w-full md:w-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => updateUrlParams({ page: Math.max(1, currentPage - 1) })}
              className="w-10 h-10 rounded-xl border border-stroke dark:border-slate-700 flex items-center justify-center bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-slate-750 text-black dark:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
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
                  type="button"
                  onClick={() => updateUrlParams({ page: pageNum })}
                  className={cn(
                    "w-10 h-10 rounded-xl text-xs font-black transition-all border",
                    currentPage === pageNum
                      ? "bg-black border-black text-white dark:bg-white dark:text-black dark:border-white shadow-lg"
                      : "border-stroke dark:border-slate-700 bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => updateUrlParams({ page: Math.min(totalPages, currentPage + 1) })}
              className="w-10 h-10 rounded-xl border border-stroke dark:border-slate-700 flex items-center justify-center bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-slate-750 text-black dark:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      )}

      <UserDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />

      <UpdateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        user={userForCategory}
        categories={uniqueCategories} // Menggunakan list kategori unik yang sudah diproses useMemo Anda
        onConfirm={handleConfirmCategoryUpdate}
      />
    </div>
  );
}