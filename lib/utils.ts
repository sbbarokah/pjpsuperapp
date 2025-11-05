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
    case "admin_village":
      return "Admin Desa";
    case "admin_group":
      return "Admin Kelompok";
    case "user":
      return "Generus";
    case "parent":
      return "Orang Tua";
    default:
      return "Pengguna";
  }
}