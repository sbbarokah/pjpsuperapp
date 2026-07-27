"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOutIcon } from "lucide-react";
import Swal from "sweetalert2";

export function LogoutButton() {
  const handleLogoutClick = () => {
    Swal.fire({
      title: "Konfirmasi Keluar",
      text: "Apakah Anda yakin ingin keluar dari akun?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
      customClass: {
        popup: "dark:bg-boxdark dark:text-white",
        confirmButton: "bg-red-600 hover:bg-red-700",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Error logging out:", error.message);
          Swal.fire({
            title: "Gagal Keluar",
            text: error.message,
            icon: "error",
            customClass: {
              popup: "dark:bg-boxdark dark:text-white",
            },
          });
          return;
        }

        // Optional: tampilkan pesan sukses sebelum reload
        await Swal.fire({
          title: "Berhasil Keluar",
          text: "Anda telah keluar dari akun.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: "dark:bg-boxdark dark:text-white",
          },
        });

        window.location.reload();
      }
    });
  };

  return (
    <button
      onClick={handleLogoutClick}
      className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-500 dark:border-gray-700 dark:bg-dark-2 dark:text-gray-400 dark:hover:border-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
      title="Keluar / Log Out"
      aria-label="Log Out"
    >
      <LogOutIcon className="size-4" />
    </button>
  );
}