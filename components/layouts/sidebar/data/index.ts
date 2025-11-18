import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "",
    items: [
      {
        title: "Dasbor",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Generus",
        url: "/generus",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Kurikulum",
        url: "/material",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "Laporan 5 Unsur",
        url: "/muslimun",
        icon: Icons.User,
        items: [],
      },
      {
        title: "KBM",
        icon: Icons.User,
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
        icon: Icons.User,
        items: [],
      },
      {
        title: "Master Data",
        icon: Icons.Alphabet,
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
