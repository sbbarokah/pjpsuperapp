import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuBookOpen, 
  LuFileText, 
  LuDatabase, 
  LuSchool 
} from "react-icons/lu";
import { FaMosque } from "react-icons/fa6";
import { FaProjectDiagram } from "react-icons/fa";

export const NAV_DATA = [
  {
    label: "MENU UTAMA", // Saya tambahkan label agar terlihat rapi
    items: [
      {
        title: "Dasbor",
        url: "/",
        icon: LuLayoutDashboard, // Ganti Icons.HomeIcon
        items: [],
      },
      {
        title: "Generus",
        url: "/generus",
        icon: LuUsers, // Ganti Icons.User
        items: [],
      },
      {
        title: "Kurikulum",
        url: "/material",
        icon: LuBookOpen, // Ganti Icons.Alphabet
        items: [],
      },
      {
        title: "Muslimun",
        url: "/muslimun",
        icon: FaMosque, // Ikon Masjid untuk Muslimun
        items: [],
      },
      {
        title: "KBM",
        icon: LuSchool, // Ikon Sekolah untuk KBM
        items: [
          {
            title: "Kehadiran KBM",
            url: "/kbmattendance",
          },
          {
            title: "Penilaian KBM",
            url: "/kbmevaluation",
          },
          {
            title: "Laporan KBM",
            url: "/kbmreport",
          },
        ],
      },
      {
        title: "Proker",
        url: "/proker",
        icon: FaProjectDiagram, // Ganti Icons.User
        items: [],
      },
      {
        title: "Berkas",
        url: "/documents",
        icon: LuFileText, // Ganti Icons.User
        items: [],
      },
      {
        title: "Master Data",
        icon: LuDatabase, // Ganti Icons.Alphabet
        items: [
          {
            title: "Desa",
            url: "/villages",
          },
          {
            title: "Kelompok",
            url: "/group",
          },
          {
            title: "Kelas",
            url: "/categories",
          },
          {
            title: "Kategori Materi",
            url: "/mcategories",
          },
        ],
      },
    ],
  },
];