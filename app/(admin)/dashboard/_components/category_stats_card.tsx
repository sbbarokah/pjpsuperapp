import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";
import { 
  getAdminUserStats,
  getGlobalUserStats, 
  getVillageUserStats, 
  GlobalUserStats, 
  VillageUserStats 
} from "@/lib/services/dashboardService";
import { StatsDisplayTable } from "./stats_display";
import { Profile } from "@/lib/types/user.types";
import { ShieldIcon } from "lucide-react";
import { getCategories } from "@/lib/services/masterService";
import { CategoryFilter } from "./category_filter";

// --- Sub-Komponen Ikon & Card (Internal) ---

const MaleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" {...props}>
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const FemaleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" {...props}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
  </svg>
);

type StatData = {
  id: number;
  male: number;
  female: number;
  total: number;
  category: string;
};

function SuperAdminStatCard({ label, total }: { label: string; total: number }) {
  return (
    <div className="rounded-[10px] bg-slate-50 dark:bg-boxdark-2 p-5 border border-slate-100 dark:border-strokedark shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
       <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
          <ShieldIcon />
       </div>
       <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">{label.replace("_", " ")}</p>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{total}</h4>
       </div>
    </div>
  );
}

function CategoryStatCard({ label, data, colorClass }: { label: string; data: StatData; colorClass?: string }) {
  return (
    <div className={cn(
      "rounded-[10px] p-6 shadow-1 transition-all hover:shadow-2",
      colorClass || "bg-gray dark:bg-gray-dark"
    )}>
      <dt className="mb-4 text-sm font-medium text-dark-6 dark:text-gray-400">{label}</dt>
      
      <dl>
        <dt className="mb-1.5 text-2xl font-bold text-dark dark:text-white">
          {data.total}
          <span className="text-sm font-medium text-dark-6 dark:text-gray-400 ml-2 text-opacity-70">Generus</span>
        </dt>
      </dl>

      <div className="mt-4 flex items-center justify-start gap-6">
        <dl className="text-sm font-medium text-blue-600 dark:text-blue-400">
          <dt className="flex items-center gap-1.5">
            <MaleIcon aria-hidden />
            {data.male}
          </dt>
          <dd className="sr-only">Laki-laki: {data.male}</dd>
        </dl>
        
        <dl className="text-sm font-medium text-pink-600 dark:text-pink-400">
          <dt className="flex items-center gap-1.5">
            <FemaleIcon aria-hidden />
            {data.female}
          </dt>
          <dd className="sr-only">Perempuan: {data.female}</dd>
        </dl>
      </div>
    </div>
  );
}

// --- Logika Pendukung ---

const colorClasses = [
  "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30",
  "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30",
  "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30",
  "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30",
  "bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30",
  "bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30",
];

/**
 * Mengelompokkan kategori 1-7 dan 12 ke dalam satu kategori "Cabe Rawit"
 */
function getDisplayData(data: StatData[], mode: string): StatData[] {
  if (mode === "generus1") {
    const filtered = data.filter(item => ![11,12].includes(item.id));
    return getDisplayData(filtered, "ringkas");
  }

  if (mode !== "ringkas") return data;

  // ID kategori yang masuk dalam kelompok Cabe Rawit
  const cabeRawitIds = [1, 2, 3, 4, 5, 6, 7];
  const praRemajaIds = [8, 13];
  const summarized: StatData[] = [];
  
  const cabeRawitBucket: StatData = {
    id: 0, // ID khusus untuk bucket gabungan
    category: "Cabe Rawit",
    male: 0,
    female: 0,
    total: 0
  };

  const praRemajaBucket: StatData = {
    id: 0, // ID khusus untuk bucket gabungan
    category: "Pra Remaja",
    male: 0,
    female: 0,
    total: 0
  };

  data.forEach(item => {
    if (cabeRawitIds.includes(item.id)) {
      cabeRawitBucket.male += item.male;
      cabeRawitBucket.female += item.female;
      cabeRawitBucket.total += item.total;
    } else {
      summarized.push(item);
    }
  });



  return cabeRawitBucket.total > 0 ? [cabeRawitBucket, ...summarized] : summarized;
}

/**
 * PIVOT STATS (DIUBAH UNTUK MENDUKUNG KEY NAMA KATEGORI)
 * Mencegah data tercampur jika category_id dari DB bernilai 0 atau tidak ada.
 */
function pivotStats(stats: (GlobalUserStats | VillageUserStats)[]): StatData[] {
  const map = new Map<string, { id: number, category: string; male: number; female: number }>();

  for (const row of stats) {
    const catId = Number((row as any).category_id || 0);
    const catName = row.category_name || "Tanpa Kategori";
    const gender = (row.gender || "").toUpperCase();
    
    // Gunakan catName (string) sebagai unik identifier (kunci map)
    if (!map.has(catName)) {
      map.set(catName, { id: catId, category: catName, male: 0, female: 0 });
    }
    const current = map.get(catName)!;

    if (gender === 'L') current.male += row.total_users;
    else if (gender === 'P') current.female += row.total_users;
    
    // Perbarui ID jika pada iterasi selanjutnya ketemu ID-nya
    if (current.id === 0 && catId !== 0) {
       current.id = catId;
    }
  }

  return Array.from(map.values())
    .map(data => ({
      id: data.id,
      category: data.category,
      male: data.male,
      female: data.female,
      total: data.male + data.female,
    }))
    .sort((a, b) => {
      // Sortir berdasarkan ID jika ada, jika tidak urutkan secara alfabetis
      if (a.id !== 0 && b.id !== 0) return a.id - b.id;
      return a.category.localeCompare(b.category);
    });
}

/**
 * Tombol pengalih tampilan. Menggunakan Link relatif "?" untuk memperbarui 
 * parameter pencarian tanpa memuat ulang rute dasar.
 */
const ViewToggle = ({ current }: { current: string }) => (
  <div className="flex items-center p-1 bg-gray-100 dark:bg-meta-4 rounded-lg w-fit flex-wrap gap-1">
    <Link
      href="?view=all"
      scroll={false}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        current === "all" || current === "generus1" ? "" : "..." // jangan overwrite
      }`}
    >
      Semua
    </Link>
    <Link
      href="?view=ringkas"
      scroll={false}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        current === "ringkas" ? "bg-white text-primary shadow-sm dark:bg-boxdark dark:text-white" : "text-gray-500"
      }`}
    >
      Ringkas
    </Link>
    <Link
      href="?view=generus1"
      scroll={false}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        current === "generus1" ? "bg-white text-primary shadow-sm dark:bg-boxdark dark:text-white" : "text-gray-500"
      }`}
    >
      Generus
    </Link>
  </div>
);

// --- Komponen Utama (Server Component) ---

/**
 * Komponen ini harus dipanggil dari app/(admin)/page.tsx 
 * dengan meneruskan searchParams yang sudah di-await.
 */
export async function CategoryStatsGroup({ 
  profile,
  searchParams 
}: { 
  profile: Profile,
  searchParams?: { view?: string; categories?: string };
}) {
  const viewMode = searchParams?.view || "all";
  const categoriesFilter = searchParams?.categories;

  // 1. Fetch Data berdasarkan Role
  let rawStats: any[] = [];
  let adminStats: { role: string; total: number }[] = []; // State untuk statistik admin
  let title = "Statistik Generus";

  const allCategories = await getCategories();

  if (profile.role === "superadmin") {
    rawStats = await getGlobalUserStats();
    title = "Statistik Global";

    // [BARU] Coba ambil statistik admin. Menggunakan import dinamis agar
    // tidak error jika fungsi getAdminUserStats belum dibuat di file dashboardService.
    try {
      adminStats = await getAdminUserStats();
    } catch (e) {
      // Data dummy (fallback) jika service getAdminUserStats belum diimplementasi
      adminStats = [
        { role: "admin_desa", total: 0 },
        { role: "pengurus_desa", total: 0 },
        { role: "admin_kelompok", total: 0 },
        { role: "pengurus_kelompok", total: 0 },
      ];
    }
  } else if (profile.village_id) {
    rawStats = await getVillageUserStats(profile.village_id);
    title = profile.role === "admin_desa" ? "Statistik Desa" : "Statistik Kelompok";
    
    if (profile.role === "admin_kelompok" && profile.group_id) {
      rawStats = rawStats.filter(s => s.group_id === Number(profile.group_id));
    }
  }

  // 🔹 Filter rawStats berdasarkan categories dari query string
  if (categoriesFilter !== "all" && categoriesFilter) {
    const allowedIds = categoriesFilter.split(",").map(Number);
    rawStats = rawStats.filter((s: any) => allowedIds.includes(Number(s.category_id)));
  } else if (!categoriesFilter) {
    // Default: tampilkan 1-10
    const defaultIds = [1,2,3,4,5,6,7,8,9,10];
    rawStats = rawStats.filter((s: any) => defaultIds.includes(Number(s.category_id)));
  }

  // 2. Olah Data (Pivot & Grouping)
  const fullPivotedData = pivotStats(rawStats);
  const displayData = getDisplayData(fullPivotedData, viewMode);
  
  const grandTotal = fullPivotedData.reduce((acc, stat) => ({
    id: 0,
    category: '',
    male: acc.male + stat.male,
    female: acc.female + stat.female,
    total: acc.total + stat.total
  }), { id: 0, category: '', male: 0, female: 0, total: 0 });

  if (fullPivotedData.length === 0 && adminStats.length === 0) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark text-center py-10">
         <h3 className="text-xl font-bold mb-2">{title}</h3>
         <p className="text-gray-500 italic">Belum ada data statistik untuk ditampilkan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Filter Kategori */}
      <CategoryFilter categories={allCategories} />
      
      {/* [BARU] Kartu Statistik Admin & Pengurus (Khusus Superadmin) */}
      {profile.role === "superadmin" && adminStats && adminStats.length > 0 && (
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-bold text-black dark:text-white mb-4">Statistik Pengurus & Admin</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
             {adminStats.map((stat, idx) => (
                <SuperAdminStatCard key={idx} label={stat.role} total={stat.total} />
             ))}
          </div>
        </div>
      )}

      {/* Kartu Statistik Generus */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-black dark:text-white">
            {title}
          </h3>
          <ViewToggle current={viewMode} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          {/* Kartu Total Keseluruhan (Selalu Ada) */}
          <CategoryStatCard
            label="Total Keseluruhan"
            data={{ ...grandTotal }}
            colorClass="bg-primary/5 dark:bg-primary/10 border border-primary/20"
          />

          {/* Kartu Per Kategori (Dinamis berdasarkan viewMode) */}
          {displayData.map((stat, index) => (
            <CategoryStatCard
              key={stat.category || index}
              label={stat.category || "N/A"}
              data={stat}
              colorClass={colorClasses[index % colorClasses.length]}
            />
          ))}
        </div>
      </div>

      {/* [DIUBAH] Tabel rincian kini muncul untuk Superadmin dan Admin Desa */}
      {["superadmin", "admin_desa", "pengurus_desa"].includes(profile.role) && (
        <StatsDisplayTable stats={rawStats} />
      )}
    </div>
  );
}