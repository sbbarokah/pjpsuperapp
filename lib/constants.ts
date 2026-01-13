
// lib/constants.ts

export const roleOptions = [
  { value: "user", label: "Siswa (User)" },
  { value: "admin_kelompok", label: "Admin Kelompok" },
  { value: "admin_desa", label: "Admin Desa" },
  { value: "superadmin", label: "Superadmin" },
];

export const genderOptions = [
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
];

export const monthOptions = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export const currentYear = new Date().getFullYear();
export const yearOptions = [
  { value: String(currentYear), label: String(currentYear) },
  { value: String(currentYear - 1), label: String(currentYear - 1) },
];