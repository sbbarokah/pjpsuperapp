import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuBookOpen, 
  LuFileText, 
  LuDatabase, 
  LuSchool 
} from "react-icons/lu";
import { FaMosque } from "react-icons/fa6";

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
        title: "Laporan 5 Unsur",
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