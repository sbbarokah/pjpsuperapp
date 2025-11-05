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
        ],
      },
    ],
  },
];
