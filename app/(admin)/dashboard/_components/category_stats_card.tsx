import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";
import { 
  getGlobalUserStats, 
  getVillageUserStats, 
  GlobalUserStats, 
  VillageUserStats 
} from "@/lib/services/dashboardService";
import { StatsDisplayTable } from "./stats_display";
import { Profile } from "@/lib/types/user.types";

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
  if (mode !== "ringkas") return data;

  // ID kategori yang masuk dalam kelompok Cabe Rawit
  const cabeRawitIds = [1, 2, 3, 4, 5, 6, 7, 12];
  const summarized: StatData[] = [];
  
  const cabeRawitBucket: StatData = {
    id: 0, // ID khusus untuk bucket gabungan
    category: "Cabe Rawit",
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
 * Memproses data mentah menjadi data pivot yang siap ditampilkan.
 * [MODIFIKASI] Menggunakan category_id sebagai key Map.
 */
function pivotStats(stats: (GlobalUserStats | VillageUserStats)[]): StatData[] {
  // Map menggunakan category_id sebagai kunci
  const map = new Map<number, { category: string; male: number; female: number }>();

  for (const row of stats) {
    // Ambil category_id dari payload SQL (fallback ke 0 jika data lama)
    const catId = Number((row as any).category_id || 0);
    const catName = row.category_name;
    const gender = (row.gender || "").toUpperCase();
    
    if (!map.has(catId)) {
      map.set(catId, { category: catName, male: 0, female: 0 });
    }
    const current = map.get(catId)!;

    if (gender === 'L') current.male += row.total_users;
    else if (gender === 'P') current.female += row.total_users;
  }

  return Array.from(map.entries())
    .map(([id, data]) => ({
      id,
      category: data.category,
      male: data.male,
      female: data.female,
      total: data.male + data.female,
    }))
    .sort((a, b) => a.id - b.id); // Sortir berdasarkan ID kategori (lebih pasti daripada string)
}

/**
 * Tombol pengalih tampilan. Menggunakan Link relatif "?" untuk memperbarui 
 * parameter pencarian tanpa memuat ulang rute dasar.
 */
const ViewToggle = ({ current }: { current: string }) => (
  <div className="flex items-center p-1 bg-gray-100 dark:bg-meta-4 rounded-lg w-fit">
    <Link
      href="?view=all"
      scroll={false}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        current !== "ringkas" 
          ? "bg-white text-primary shadow-sm dark:bg-boxdark dark:text-white" 
          : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
      }`}
    >
      Semua
    </Link>
    <Link
      href="?view=ringkas"
      scroll={false}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        current === "ringkas" 
          ? "bg-white text-primary shadow-sm dark:bg-boxdark dark:text-white" 
          : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
      }`}
    >
      Ringkas
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
  searchParams?: { view?: string }
}) {
  const viewMode = searchParams?.view || "all";

  // 1. Fetch Data berdasarkan Role
  let rawStats: any[] = [];
  let title = "Statistik Generus";

  if (profile.role === "superadmin") {
    rawStats = await getGlobalUserStats();
    title = "Statistik Global";
  } else if (profile.village_id) {
    rawStats = await getVillageUserStats(profile.village_id);
    title = profile.role === "admin_desa" ? "Statistik Desa" : "Statistik Kelompok";
    
    // Filter khusus jika admin kelompok
    if (profile.role === "admin_kelompok" && profile.group_id) {
      rawStats = rawStats.filter(s => s.group_id === Number(profile.group_id));
    }
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

  if (fullPivotedData.length === 0) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark text-center py-10">
         <h3 className="text-xl font-bold mb-2">{title}</h3>
         <p className="text-gray-500 italic">Belum ada data statistik untuk ditampilkan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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

      {/* Tabel rincian (Hanya untuk Admin Desa agar bisa melihat per kelompok) */}
      {profile.role === "admin_desa" && <StatsDisplayTable stats={rawStats} />}
    </div>
  );
}