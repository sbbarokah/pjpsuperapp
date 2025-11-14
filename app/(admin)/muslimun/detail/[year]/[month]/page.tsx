import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getGroupsByVillage, getCategories } from "@/lib/services/masterService";

import { notFound } from "next/navigation";
import { GroupModel, CategoryModel, VillageModel } from "@/lib/types/master.types";
import { getMeetingReportsByPeriod } from "@/lib/services/mReportService";
import { getKbmReportsByPeriod } from "@/lib/services/reportService";
import { MeetingReportWithRelations } from "@/lib/types/mreport.types";
import { KbmReportWithRelations } from "@/lib/types/report.types";
import { VillageReportTables } from "../../../_components/village_report_table";

export const metadata = {
  title: "Laporan MusyaWarah 5 Unsur | Admin",
};

interface DetailPageProps {
  params: {
    year: string;
    month: string;
  };
}

/**
 * Tipe data agregasi yang akan kita buat
 * untuk mempermudah rendering.
 */
export type AggregatedGroupData = {
  group: GroupModel;
  meetingReport: MeetingReportWithRelations | null;
  kbmReports: KbmReportWithRelations[]; // Laporan KBM mentah per kategori
  
  // Data KBM yang sudah diagregasi (dijumlahkan)
  summary: {
    count_male: number;
    count_female: number;
    count_total: number;
    attendance_total_meetings: number;
    
    // Untuk rata-rata
    attendance_present_sum: number;
    attendance_permission_sum: number;
    attendance_absent_sum: number;
    attendance_report_count: number; // Jumlah laporan KBM yg masuk
  };
};

// --- LOGIKA AGREGASI ---
function aggregateData(
  groups: GroupModel[],
  meetingReports: MeetingReportWithRelations[],
  kbmReports: KbmReportWithRelations[],
): AggregatedGroupData[] {
  
  // 1. Buat Peta (Map) untuk data agregasi
  const dataMap = new Map<number | string, AggregatedGroupData>();

  // 2. Inisialisasi Peta dengan semua kelompok di desa
  for (const group of groups) {
    dataMap.set(group.id, {
      group: group,
      meetingReport: null,
      kbmReports: [],
      summary: {
        count_male: 0,
        count_female: 0,
        count_total: 0,
        attendance_total_meetings: 0,
        attendance_present_sum: 0,
        attendance_permission_sum: 0,
        attendance_absent_sum: 0,
        attendance_report_count: 0,
      },
    });
  }

  // 3. Masukkan Meeting Reports ke Peta
  for (const report of meetingReports) {
    const data = dataMap.get(report.group_id);
    if (data) {
      data.meetingReport = report;
    }
  }

  // 4. Masukkan dan Agregasi KBM Reports ke Peta
  for (const report of kbmReports) {
    // Tipe group_id di kbm_report adalah string, di grup adalah number
    const groupId = parseInt(String(report.group_id), 10); 
    const data = dataMap.get(groupId);
    
    if (data) {
      data.kbmReports.push(report); // Tambah ke daftar mentah
      
      // Lakukan agregasi (penjumlahan)
      data.summary.count_male += report.count_male || 0;
      data.summary.count_female += report.count_female || 0;
      data.summary.count_total += report.count_total || 0;
      data.summary.attendance_total_meetings += report.attendance_total_meetings || 0;
      
      data.summary.attendance_present_sum += report.attendance_present_percentage || 0;
      data.summary.attendance_permission_sum += report.attendance_permission_percentage || 0;
      data.summary.attendance_absent_sum += report.attendance_absent_percentage || 0;
      data.summary.attendance_report_count += 1;
    }
  }

  // 5. Konversi Peta kembali ke Array
  return Array.from(dataMap.values());
}

// --- Komponen Halaman Utama ---
export default async function VillageReportDetailPage({ params }: DetailPageProps) {
  const { year, month } = await params;

  const yearParam = parseInt(year, 10);
  const monthParam = parseInt(month, 10);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const periodLabel = `${monthNames[monthParam - 1]} ${year}`;

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

  // 1. Ambil semua data mentah secara paralel
  const [
    groups,
    categories,
    meetingReports,
    kbmReports,
  ] = await Promise.all([
    getGroupsByVillage(villageId),
    getCategories(),
    getMeetingReportsByPeriod({ villageId, year: yearParam, month: monthParam }),
    getKbmReportsByPeriod({ villageId, year: yearParam, month: monthParam }),
  ]);

  // 2. Lakukan Agregasi Data
  const aggregatedData = aggregateData(groups, meetingReports, kbmReports);

  // 3. Ambil Nama Desa (dari laporan pertama, jika ada)
  const villageName = aggregatedData[0]?.meetingReport?.village?.name || "Desa";

  return (
    <>
      <Breadcrumb pageName={`Laporan Desa: ${villageName}`} />
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="mb-2 text-2xl font-semibold text-black dark:text-white">
          Laporan Konsolidasi KBM Desa {villageName}
        </h2>
        <p className="text-lg font-medium">
          Periode: <span className="text-primary">{periodLabel}</span>
        </p>
      </div>

      {/* Kirim data yang sudah bersih dan teragregasi 
        ke komponen Tampilan (Client Component)
      */}
      <div className="mt-8">
        <VillageReportTables 
          data={aggregatedData}
          categories={categories}
        />
      </div>
    </>
  );
}