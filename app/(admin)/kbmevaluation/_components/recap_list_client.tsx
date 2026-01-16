"use client";

import { EvaluationRecapWithRelations } from "@/lib/types/evaluation.types";
import { Profile } from "@/lib/types/user.types";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEdit, FaTrashAlt, FaBook, FaCalendarAlt, FaUser } from "react-icons/fa";
import { deleteEvaluationRecapAction } from "../actions";
import { currentYear, monthOptions, yearOptions } from "@/lib/constants";
import { CategoryModel, GroupModel } from "@/lib/types/master.types";
import IconSearch from "@/components/icon/IconSearch";
import { FiFilter } from "react-icons/fi";
import { IoDuplicate } from "react-icons/io5";
import Swal from "sweetalert2";

interface ListProps {
  recaps: EvaluationRecapWithRelations[];
  profile: Profile;
  masterGroups: GroupModel[];
  masterCategories: CategoryModel[];
}

const RecapCard = ({
  recap,
  onDelete,
}: {
  recap: EvaluationRecapWithRelations;
  onDelete: () => void;
}) => (
  <div className="flex flex-col justify-between rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="p-4 border-b border-stroke dark:border-strokedark">
      <h3 className="font-semibold text-lg text-black dark:text-white truncate">
        {recap.group.name}
      </h3>
      <p className="text-sm font-medium text-primary">
        {recap.category.name}
      </p>
    </div>
    
    <div className="p-4 flex-grow min-h-[100px]">
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
        <FaCalendarAlt />
        <span>Periode: {monthOptions.find(m => m.value == recap.period_month)?.label} {recap.period_year}</span>
      </div>
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
        <FaUser />
        <span>Author: {recap.author?.full_name}</span>
      </div>
      <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <FaBook className="mt-1 flex-shrink-0" />
        <p className="line-clamp-3">
          <span className="font-medium">Catatan:</span> {recap.notes || "-"}
        </p>
      </div>
    </div>
    
    <div className="p-4 border-t border-stroke dark:border-strokedark flex justify-end items-center gap-3">
      <Link href={`/kbmevaluation/duplicate/${recap.id}`} className="text-green-500 hover:text-green-700 flex items-center gap-1 text-sm">
        <IoDuplicate /> Salin
      </Link>
      <Link href={`/kbmevaluation/edit/${recap.id}`} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm">
        <FaEdit /> Ubah
      </Link>
      <button
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
      >
        <FaTrashAlt /> Hapus
      </button>
    </div>
  </div>
);

export function RecapListClient({ recaps, profile, masterGroups, masterCategories }: ListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // State Filter
  const [filter, setFilter] = useState({
    groupId: "",
    categoryId: "",
    month: "",
    year: String(currentYear),
  });

  const isAdminDesa = profile.role === 'admin_desa';

  // Logic Filtering
  const filteredRecaps = useMemo(() => {
    return recaps.filter((item) => {
      const matchGroup = filter.groupId ? String(item.group_id) === filter.groupId : true;
      const matchCategory = filter.categoryId ? String(item.category_id) === filter.categoryId : true;
      const matchMonth = filter.month ? String(item.period_month) === filter.month : true;
      const matchYear = filter.year ? String(item.period_year) === filter.year : true;
      return matchGroup && matchCategory && matchMonth && matchYear;
    });
  }, [recaps, filter]);

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDelete = (id: string, groupName: string, catName: string) => {
    Swal.fire({
      title: "Anda yakin?",
      text: `Anda akan menghapus laporan penilaiai kelas "${catName}" kelompok "${groupName}". Aksi ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6", // Biru
      cancelButtonColor: "#d33", // Merah
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      customClass: {
        popup: 'dark:bg-boxdark dark:text-white',
        confirmButton: 'bg-primary',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        confirmDelete(id);
      }
    });
  };

  const confirmDelete = (id: string) => {
    startTransition(async () => {
      const response = await deleteEvaluationRecapAction(id);

      if (response.success) {
        Swal.fire({
          title: "Terhapus!",
          text: response.message,
          icon: "success",
          customClass: {
            popup: 'dark:bg-boxdark dark:text-white',
          }
        });
        // 'revalidatePath' di action akan memuat ulang data di server.
        // 'router.refresh()' memastikan klien mengambil data baru itu.
        router.refresh();
      } else {
        Swal.fire({
          title: "Gagal!",
          text: response.error || "Terjadi kesalahan",
          icon: "error",
          customClass: {
            popup: 'dark:bg-boxdark dark:text-white',
          }
        });
      }
    });
  };

  if (recaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Rekap Penilaian
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Klik "Buat Rekap Baru" untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* --- Section Filter --- */}
      <div className="rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-2 mb-4 text-primary font-bold">
          <FiFilter />
          <span>Filter Laporan</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter Kelompok (Hanya Admin Desa) */}
          {isAdminDesa && (
            <div>
              <label className="mb-1 block text-xs font-medium text-black dark:text-white">Kelompok</label>
              <select
                name="groupId"
                value={filter.groupId}
                onChange={handleFilterChange}
                className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
              >
                <option value="">Semua Kelompok</option>
                {masterGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {/* Filter Kategori (Semua Admin) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Kategori</label>
            <select
              name="categoryId"
              value={filter.categoryId}
              onChange={handleFilterChange}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
            >
              <option value="">Semua Kategori</option>
              {masterCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Filter Bulan */}
          <div>
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Bulan</label>
            <select
              name="month"
              value={filter.month}
              onChange={handleFilterChange}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
            >
              <option value="">Semua Bulan</option>
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Tahun</label>
            <select
              name="year"
              value={filter.year}
              onChange={handleFilterChange}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
            >
              <option value="">Semua Tahun</option>
              {yearOptions.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </div>
        </div>
        
        {/* Reset Filter Button */}
        {(filter.groupId || filter.categoryId || filter.month || filter.year !== String(currentYear)) && (
          <button 
            onClick={() => setFilter({ groupId: "", categoryId: "", month: "", year: String(currentYear) })}
            className="mt-4 text-xs text-red-500 hover:underline font-medium"
          >
            Reset Filter
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* --- Display Hasil --- */}
      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      {filteredRecaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700 bg-white dark:bg-boxdark">
          <div className="bg-gray-100 dark:bg-meta-4 p-4 rounded-full mb-4 text-gray-400">
            <IconSearch />
          </div>
          <h3 className="text-lg font-medium text-black dark:text-white">
            Tidak Ada Data Ditemukan
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Coba sesuaikan filter Anda atau buat rekap baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecaps.map((recap) => (
            <RecapCard
              key={recap.id}
              recap={recap}
              onDelete={() => handleDelete(recap.id, recap.group.name, recap.category.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}