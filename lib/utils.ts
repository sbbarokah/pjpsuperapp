import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Memotong string ke panjang maksimum dan menambahkan elipsis.
 * @param text Teks yang akan dipotong
 * @param maxLength Panjang maksimum (default: 50)
 * @returns Teks yang telah dipotong
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

export function getRoleName(role: string): string {
  switch (role) {
    case "superadmin":
      return "Administrator";
    case "admin_desa":
      return "Admin Desa";
    case "admin_kelompok":
      return "Admin Kelompok";
    case "user":
      return "Generus";
    case "parent":
      return "Orang Tua";
    default:
      return "Pengguna";
  }
}

/**
 * Mengubah angka bulan (1-12) menjadi nama bulan dalam Bahasa Indonesia.
 * @param monthNumber Angka bulan (1 = Januari)
 * @returns Nama bulan (cth: "Januari")
 */
export function getMonthName(monthNumber: number): string {
  // Buat tanggal fiktif untuk bulan tersebut
  const date = new Date(2000, monthNumber - 1, 1); 
  
  // Gunakan Intl.DateTimeFormat untuk mendapatkan nama bulan
  return new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date);
}

/**
 * Memformat tanggal 'created_at' menjadi string yang mudah dibaca.
 * @param dateString String ISO timestamp (cth: "2025-11-13T10:00:00Z")
 * @returns Tanggal terformat (cth: "13 November 2025")
 */
export function formatReportDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(date);
}