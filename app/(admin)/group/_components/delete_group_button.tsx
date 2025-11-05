"use client"; // Ini adalah Client Component

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
// Pastikan Anda sudah menginstal SweetAlert2: npm install sweetalert2
import { deleteGroupAction } from "../actions"; // Import Server Action

/**
 * Ikon Trash Sederhana (Anda bisa ganti dengan ikon dari library Anda)
 */
function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-500 group-hover:text-red-700"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}

interface DeleteGroupButtonProps {
  id: string;
  name: string;
}

export function DeleteGroupButton({ id, name }: DeleteGroupButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); // Untuk refresh data setelah hapus

  const handleDelete = () => {
    Swal.fire({
      title: "Anda yakin?",
      text: `Anda akan menghapus kelompok "${name}". Aksi ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6", // Biru
      cancelButtonColor: "#d33", // Merah
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      // Tambahkan styling untuk dark mode jika perlu
      customClass: {
        popup: 'dark:bg-boxdark dark:text-white',
        confirmButton: 'bg-primary',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Gunakan useTransition untuk state loading
        startTransition(async () => {
          const response = await deleteGroupAction(id);

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
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="group rounded p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-50"
      title="Hapus Kelompok"
    >
      {isPending ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary" /> // Spinner
      ) : (
        <TrashIcon />
      )}
    </button>
  );
}