"use client";

import { useState, useTransition } from "react";
import Swal from "sweetalert2";

import { AttendanceRecapWithRelations } from "@/lib/types/attendance.types";
import { Profile } from "@/lib/types/user.types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEdit, FaTrashAlt, FaUsers, FaCalendarAlt } from "react-icons/fa";
import { deleteRecapAction } from "../actions";
import { monthOptions } from "@/lib/constants";

interface ListProps {
  recaps: AttendanceRecapWithRelations[];
  profile: Profile;
}

const RecapCard = ({
  recap,
  onDelete,
}: {
  recap: AttendanceRecapWithRelations;
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
    
    <div className="p-4 flex-grow">
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
        <FaCalendarAlt />
        <span>Periode: {monthOptions.find(m => m.value == recap.period_month)?.label} {recap.period_year}</span>
      </div>
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
        <FaUsers />
        <span>{recap.generus_count} Generus, {recap.meeting_count} Pertemuan</span>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-bold text-lg text-green-600">{recap.present_percentage.toFixed(1)}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Hadir</p>
        </div>
        <div>
          <p className="font-bold text-lg text-yellow-600">{recap.permission_percentage.toFixed(1)}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Izin</p>
        </div>
        <div>
          <p className="font-bold text-lg text-red-600">{recap.absent_percentage.toFixed(1)}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Alpa</p>
        </div>
      </div>
    </div>
    
    <div className="p-4 border-t border-stroke dark:border-strokedark flex justify-end items-center gap-3">
      <Link href={`/kbmattendance/edit/${recap.id}`} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm">
        <FaEdit /> Edit
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

export function RecapListClient({ recaps, profile }: ListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const handleDelete = (id: string, groupName: string, catName: string) => {
    // [MODIFIKASI] Menggunakan SweetAlert2
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus rekap presensi ${groupName} - ${catName}. Data yang dihapus tidak dapat dikembalikan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Warna merah untuk konfirmasi hapus
      cancelButtonColor: '#3085d6', // Warna biru untuk batal
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        // Jalankan server action jika user menekan "Ya"
        startTransition(async () => {
          setError(null);
          
          // Tampilkan loading (opsional, tapi bagus untuk UX)
          Swal.fire({
            title: 'Menghapus...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          const response = await deleteRecapAction(id);
          
          if (!response.success) {
            setError(response.message);
            // Tampilkan Error
            Swal.fire({
              icon: 'error',
              title: 'Gagal!',
              text: response.message,
            });
          } else {
            router.refresh();
            // Tampilkan Sukses
            Swal.fire({
              icon: 'success',
              title: 'Terhapus!',
              text: 'Rekap presensi berhasil dihapus.',
              timer: 2000,
              showConfirmButton: false
            });
          }
        });
      }
    });
  };

  if (recaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Rekap Presensi
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Klik "Buat Rekap Baru" untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recaps.map((recap) => (
          <RecapCard
            key={recap.id}
            recap={recap}
            onDelete={() => handleDelete(recap.id, recap.group.name, recap.category.name)}
          />
        ))}
      </div>
    </div>
  );
}