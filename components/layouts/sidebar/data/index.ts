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
  GitBranch as LuGitBranch
} from "lucide-react";
import { FaMosque } from "react-icons/fa";

export const NAV_DATA = [
  {
    label: "MENU UTAMA",
    items: [
      { title: "Dasbor", url: "/", icon: LuLayoutDashboard, items: [] },
      { title: "Generus", url: "/generus", icon: LuUsers, items: [] },
      { title: "Kurikulum", url: "/material", icon: LuBookOpen, items: [] },
      { title: "Muslimun", url: "/muslimun", icon: FaMosque, items: [] }, // Menggunakan Lucide sebagai pengganti FaMosque
      { 
        title: "KBM", 
        icon: LuSchool, 
        items: [
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
      { title: "Proker", url: "/proker", icon: LuGitBranch, items: [] }, // Menggunakan Lucide sebagai pengganti FaProjectDiagram
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