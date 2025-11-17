import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";
import { notFound } from "next/navigation";
import { GroupModel, CategoryModel } from "@/lib/types/master.types";
import { getKbmReportsByPeriod } from "@/lib/services/reportService";
import { KbmReportWithRelations } from "@/lib/types/report.types";
import { KbmReportTables } from "../../../_components/kbm_report_table";

export const metadata = {
  title: "Laporan Konsolidasi KBM | Admin",
};

interface DetailPageProps {
  params: {
    year: string;
    month: string;
  };
}

/**
 * Tipe data agregasi yang disederhanakan, HANYA untuk KBM.
 */
export type AggregatedKbmGroupData = {
  group: GroupModel;
  kbmReports: KbmReportWithRelations[]; // Laporan KBM mentah per kategori
};

// --- LOGIKA AGREGASI (Sederhana) ---
function aggregateKbmData(
  groups: GroupModel[],
  kbmReports: KbmReportWithRelations[],
): AggregatedKbmGroupData[] {
  
  const dataMap = new Map<number | string, AggregatedKbmGroupData>();

  // 1. Inisialisasi Peta dengan semua kelompok di desa
  for (const group of groups) {
    dataMap.set(group.id, {
      group: group,
      kbmReports: [],
    });
  }

  // 2. Masukkan KBM Reports ke Peta
  for (const report of kbmReports) {
    const groupId = parseInt(String(report.group_id), 10); 
    const data = dataMap.get(groupId);
    
    if (data) {
      data.kbmReports.push(report); // Tambah ke daftar mentah
    }
  }

  // 3. Konversi Peta kembali ke Array
  return Array.from(dataMap.values());
}

// --- Komponen Halaman Utama ---
export default async function KbmReportDetailPage({ params }: DetailPageProps) {
  const { year, month } = await params;

  const yearParam = parseInt(year, 10);
  const monthParam = parseInt(month, 10);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const periodLabel = `${monthNames[monthParam - 1]} ${yearParam}`;

  if (isNaN(yearParam) || isNaN(monthParam)) {
    notFound();
  }

  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    notFound();
  }

  if (profile.role !== "admin_desa" || !profile.village_id) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Hanya Admin Desa yang dapat mengakses halaman ini.</p>
      </>
    );
  }

  const villageId = profile.village_id;

  // 1. Ambil data mentah (TANPA meetingReports)
  const [
    groups,
    categories,
    kbmReports,
  ] = await Promise.all([
    getGroupsByVillage(villageId),
    getCategories(),
    getKbmReportsByPeriod({ villageId, year: yearParam, month: monthParam }),
  ]);

  // 2. Lakukan Agregasi Data
  const aggregatedData = aggregateKbmData(groups, kbmReports);
  console.log("isi kbm", kbmReports[0]);

  // 3. Ambil Nama Desa
  // Ambil dari profil karena kita tidak mengambil data relasi desa
  const villageName = kbmReports[0]?.village?.name || `Desa (ID: ${profile.village_id})`;
  // const villageName = aggregatedData[0]?.meetingReport?.village?.name || "Desa";

  return (
    <>
      <Breadcrumb pageName={`Laporan KBM: ${villageName}`} />
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="mb-2 text-2xl font-semibold text-black dark:text-white">
          Laporan KBM Desa {villageName}
        </h2>
        <p className="text-lg font-medium">
          Periode: <span className="text-primary">{periodLabel}</span>
        </p>
      </div>

      {/* Kirim data ke komponen Tampilan KBM */}
      <div className="mt-8">
        <KbmReportTables 
          data={aggregatedData}
          categories={categories}
        />
      </div>
    </>
  );
}