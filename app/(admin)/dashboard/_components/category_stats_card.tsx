// [FIX] Menggunakan path impor lokal untuk komponen
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import {
  getGlobalUserStats,
  getVillageUserStats,
  GlobalUserStats,
  VillageUserStats,
} from "@/lib/services/dashboardService";
import { CategoryStatCard } from "@/components/cards/overviewCard"; 
import { StatsDisplayTable } from "./stats_display";

/**
 * Tipe data yang sudah dipivot untuk kartu
 */
type PivotedCategoryStat = {
  category: string;
  male: number;
  female: number;
  total: number;
};

/**
 * Helper untuk mem-pivot data dari getGlobalUserStats (Superadmin)
 */
function pivotGlobalStats(stats: GlobalUserStats[]): PivotedCategoryStat[] {
  const map = new Map<string, { male: number; female: number }>();

  for (const row of stats) {
    const category = row.category_name;
    const gender = row.gender.toUpperCase();
    
    if (!map.has(category)) {
      map.set(category, { male: 0, female: 0 });
    }
    const current = map.get(category)!;

    if (gender === 'L') {
      current.male = row.total_users;
    } else if (gender === 'P') {
      current.female = row.total_users;
    }
  }

  return Array.from(map.entries()).map(([category, counts]) => ({
    category: category,
    male: counts.male,
    female: counts.female,
    total: counts.male + counts.female,
  }));
}

const colorClasses = [
  "bg-blue-100 dark:bg-blue-950",
  "bg-green-100 dark:bg-green-950",
  "bg-yellow-100 dark:bg-yellow-950",
  "bg-indigo-100 dark:bg-indigo-950",
  "bg-pink-100 dark:bg-pink-950",
  "bg-purple-100 dark:bg-purple-950",
];

/**
 * Helper untuk mem-pivot data dari getVillageUserStats (Admin Desa/Kelompok)
 */
function pivotVillageStats(stats: VillageUserStats[]): PivotedCategoryStat[] {
  const map = new Map<string, { male: number; female: number }>();

  for (const row of stats) {
    const category = row.category_name;
    const gender = row.gender.toUpperCase();
    
    if (!map.has(category)) {
      map.set(category, { male: 0, female: 0 });
    }
    const current = map.get(category)!;

    if (gender === 'L') {
      current.male += row.total_users;
    } else if (gender === 'P') {
      current.female += row.total_users;
    }
  }

  return Array.from(map.entries()).map(([category, counts]) => ({
    category: category,
    male: counts.male,
    female: counts.female,
    total: counts.male + counts.female,
  }));
}


/**
 * Komponen Server Asinkron untuk mengambil & menampilkan statistik generus
 * [LOGIKA DIPERBARUI]
 */
export async function CategoryStatsGroup() {
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (error) {
    return <p>Gagal memuat statistik generus.</p>;
  }

  // --- Tampilan untuk Admin Desa ---
  if (profile.role === "admin_desa" && profile.village_id) {
    const villageStats = await getVillageUserStats(profile.village_id);
    if (villageStats.length === 0) { /* ... (fallback) ... */ }
    
    const villagePivotedData = pivotVillageStats(villageStats);
    
    // [BARU] Hitung Total Desa
    const villageGrandTotal = villagePivotedData.reduce((acc, stat) => {
      acc.male += stat.male;
      acc.female += stat.female;
      acc.total += stat.total;
      return acc;
    }, { male: 0, female: 0, total: 0 });

    return (
      <div className="flex flex-col gap-6">
        {/* 1. Kartu Agregat Desa */}
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
            Statistik Generus Desa (Total)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            {/* [BARU] Kartu Total */}
            <CategoryStatCard
              key="total-desa"
              label="Total Generus Desa"
              data={villageGrandTotal}
              colorClass="bg-primary/10 dark:bg-primary/20 border border-primary/50"
            />
            {/* Kartu per Kategori */}
            {villagePivotedData.map((stat, index) => (
              <CategoryStatCard
                key={stat.category}
                label={stat.category}
                data={stat}
                colorClass={colorClasses[index % colorClasses.length]}
              />
            ))}
          </div>
        </div>
        
        {/* 2. Tabel Rincian per Kelompok */}
        <StatsDisplayTable stats={villageStats} />
      </div>
    );
  }

  // --- Tampilan untuk Admin Kelompok ---
  if (profile.role === "admin_kelompok" && profile.village_id && profile.group_id) {
    const villageStats = await getVillageUserStats(profile.village_id);
    const groupStats = villageStats.filter(
      stat => stat.group_id === Number(profile.group_id)
    );
    if (groupStats.length === 0) { /* ... (fallback) ... */ }

    const groupPivotedData = pivotVillageStats(groupStats);
    
    // [BARU] Hitung Total Kelompok
    const groupGrandTotal = groupPivotedData.reduce((acc, stat) => {
      acc.male += stat.male;
      acc.female += stat.female;
      acc.total += stat.total;
      return acc;
    }, { male: 0, female: 0, total: 0 });

    return (
      <div className="flex flex-col gap-6">
        {/* 1. Kartu Agregat Kelompok */}
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
            Statistik Generus Kelompok (Total)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
            {/* [BARU] Kartu Total */}
            <CategoryStatCard
              key="total-kelompok"
              label="Total Generus Kelompok"
              data={groupGrandTotal}
              colorClass="bg-primary/10 dark:bg-primary/20 border border-primary/50"
            />
            {/* Kartu per Kategori */}
            {groupPivotedData.map((stat, index) => (
              <CategoryStatCard
                key={stat.category}
                label={stat.category}
                data={stat}
                colorClass={colorClasses[index % colorClasses.length]}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // --- Tampilan untuk Superadmin (Kartu Agregat Global) ---
  const globalStats = await getGlobalUserStats();
  const globalPivotedData = pivotGlobalStats(globalStats);

  if (globalPivotedData.length === 0) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Statistik Generus per Kategori (Global)
        </h3>
        <p className="text-gray-600 dark:text-gray-400">Belum ada data untuk ditampilkan.</p>
      </div>
    );
  }

  const globalGrandTotal = globalPivotedData.reduce((acc, stat) => {
    acc.male += stat.male;
    acc.female += stat.female;
    acc.total += stat.total;
    return acc;
  }, { male: 0, female: 0, total: 0 });

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-5 text-xl font-semibold text-black dark:text-white">
        Statistik Generus per Kategori (Global)
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {/* [BARU] Kartu Total */}
        <CategoryStatCard
          key="total-global"
          label="Total Generus Global"
          data={globalGrandTotal}
          colorClass="bg-primary/10 dark:bg-primary/20 border border-primary/50"
        />
        {/* Kartu per Kategori */}
        {globalPivotedData.map((stat, index) => (
          <CategoryStatCard
            key={stat.category}
            label={stat.category}
            data={stat}
            colorClass={colorClasses[index % colorClasses.length]}
          />
        ))}
      </div>
    </div>
  );
}