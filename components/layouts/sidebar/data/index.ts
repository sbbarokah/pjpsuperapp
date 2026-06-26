import { 
  LayoutDashboard as LuLayoutDashboard, 
  Users as LuUsers, 
  BookOpen as LuBookOpen, 
  School as LuSchool, 
  GraduationCap, 
  FileText as LuFileText, 
  Bell as BellIcon, 
  Database as LuDatabase,
  History as LuHistory,
  FolderOpen as LuFolderOpen,
  Settings as LuSettings,
  Building2 as LuBuilding,
  GitBranch as LuGitBranch,
  Layers as LuLayers
} from "lucide-react";
import { FaMosque } from "react-icons/fa";

// =====================================================================
// 1. MENU KHUSUS SUPERADMIN (FLAT / TIDAK ADA SUBMENU)
// Sesuai permintaan: dashboard, users, generus, desa, kelompok, kelas, kategori materi
// =====================================================================
export const SUPERADMIN_NAV_DATA = [
  {
    label: "MENU SUPERADMIN",
    items: [
      { title: "Dasbor", url: "/", icon: LuLayoutDashboard, items: [] },
      { title: "Pengguna", url: "/users", icon: LuUsers, items: [] },
      { title: "Generus", url: "/generus", icon: GraduationCap, items: [] },
      { title: "Desa", url: "/villages", icon: LuBuilding, items: [] },
      { title: "Kelompok", url: "/group", icon: LuDatabase, items: [] },
      { title: "Kelas", url: "/categories", icon: LuSchool, items: [] },
      { title: "Kategori Materi", url: "/mcategories", icon: LuLayers, items: [] },
    ],
  },
];

export const PENGURUS_NAV_DATA = [
  {
    label: "MENU UTAMA",
    items: [
      { title: "Dasbor", url: "/", icon: LuLayoutDashboard, items: [] },
      { title: "Generus", url: "/generus", icon: LuUsers, items: [] },
      // { title: "Pengguna", url: "/users", icon: LuUsers, items: [] }, // Dihapus dari sini karena ini khusus superadmin
      { title: "Kurikulum", url: "/material", icon: LuBookOpen, items: [] },
      { title: "Muslimun", url: "/muslimun", icon: FaMosque, items: [] },
      { title: "Laporan KBM", url: "/kbmreport", icon: LuSchool, items: [] },
      { 
        title: "E-Learning", 
        icon: GraduationCap, 
        items: [
          { title: "Bank Soal", url: "/elearning/question-bank" },
          { title: "Kuis", url: "/elearning/quizz" },
        ], 
      },
      { title: "Proker", url: "/proker", icon: LuGitBranch, items: [] },
      { title: "Berkas", url: "/documents", icon: LuFolderOpen, items: [] },
      { title: "Log Aktivitas", url: "/activity-log", icon: LuHistory, items: [] },
      { 
        title: "Master Data", 
        icon: LuDatabase, 
        items: [
          { title: "Desa", url: "/villages" },
          { title: "Kelompok", url: "/group" },
          { title: "Kelas", url: "/categories" },
          { title: "Kategori Materi", url: "/mcategories" },
        ], 
      },
    ],
  },
];

// =====================================================================
// 2. MENU UNTUK ADMIN DESA, KELOMPOK, & PENGURUS
// (Akan difilter lebih lanjut di komponen Sidebar menggunakan RBAC)
// =====================================================================
export const ADMIN_NAV_DATA = [
  {
    label: "MENU UTAMA",
    items: [
      { title: "Dasbor", url: "/", icon: LuLayoutDashboard, items: [] },
      { title: "Generus", url: "/generus", icon: LuUsers, items: [] },
      // { title: "Pengguna", url: "/users", icon: LuUsers, items: [] }, // Dihapus dari sini karena ini khusus superadmin
      { title: "Kurikulum", url: "/material", icon: LuBookOpen, items: [] },
      { title: "Muslimun", url: "/muslimun", icon: FaMosque, items: [] },
      { 
        title: "KBM", 
        icon: LuSchool, 
        items: [
          { title: "Input Presensi", url: "/kbmpresence" },
          { title: "Kehadiran KBM", url: "/kbmattendance" },
          { title: "Penilaian KBM", url: "/kbmevaluation" },
          { title: "Laporan KBM", url: "/kbmreport" },
          { title: "Lembar Kontrol", url: "/kbmcontrol" },
        ], 
      },
      { 
        title: "E-Learning", 
        icon: GraduationCap, 
        items: [
          { title: "Bank Soal", url: "/elearning/question-bank" },
          { title: "Kuis", url: "/elearning/quizz" },
        ], 
      },
      { title: "Proker", url: "/proker", icon: LuGitBranch, items: [] },
      { 
        title: "Manajemen Sistem", 
        icon: LuSettings,
        items: [
          { title: "Berkas", url: "/documents", icon: LuFolderOpen },
          { title: "Notifikasi", url: "/notifications", icon: BellIcon },
          { title: "Log Aktivitas", url: "/activity-log", icon: LuHistory },
        ],
      },
      { 
        title: "Master Data", 
        icon: LuDatabase, 
        items: [
          { title: "Desa", url: "/villages" },
          { title: "Kelompok", url: "/group" },
          { title: "Kelas", url: "/categories" },
          { title: "Kategori Materi", url: "/mcategories" },
        ], 
      },
    ],
  },
];