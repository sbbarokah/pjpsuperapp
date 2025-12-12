import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { notFound } from "next/navigation";
import { getGroupsByVillage } from "@/lib/services/masterService";
import { monthOptions } from "@/lib/constants";
import Link from "next/link";
import { FaBuilding, FaArrowLeft } from "react-icons/fa";
import { getMeetingReportsByPeriod } from "@/lib/services/mReportService";
import { MuslimunRecapTable } from "../../../_components/muslimun_recap_table";

export const metadata = {
  title: "Laporan Musyawarah 5 Unsur | Admin",
};

interface DetailPageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

export default async function MuslimunReportDetailPage({ params }: DetailPageProps) {
  // 1. Parse Params (Next.js 15 Async Params)
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  if (isNaN(year) || isNaN(month)) notFound();

  // 2. Validasi User
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const isAdminDesa = profile.role === "admin_desa";
  const isAdminKelompok = profile.role === "admin_kelompok";

  if (!isAdminDesa && !isAdminKelompok) {
    return <div className="p-6">Akses Ditolak.</div>;
  }

  const villageId = Number(profile.village_id);
  if (!villageId) return <div className="p-6 text-red-500">Profil tidak valid (Desa tidak ditemukan).</div>;

  // 3. Fetch Data
  // Kita perlu daftar SEMUA grup untuk mengetahui mana yang SUDAH dan BELUM lapor
  const [allGroups, meetingReports] = await Promise.all([
    getGroupsByVillage(villageId),
    getMeetingReportsByPeriod({ 
      villageId, 
      year, 
      month 
      // Note: Service ini idealnya mengembalikan semua laporan desa untuk bulan tsb
    }), 
  ]);

  // 4. Filtering Data Berdasarkan Role
  let displayedGroups = allGroups;
  let displayedReports = meetingReports;

  if (isAdminKelompok) {
    // Admin Kelompok hanya melihat datanya sendiri
    const myGroupId = Number(profile.group_id);
    displayedGroups = allGroups.filter(g => g.id === myGroupId);
    displayedReports = meetingReports.filter(r => r.group_id === myGroupId);
  }

  // Helper Data
  const monthName = monthOptions.find(m => m.value.toString() == String(month))?.label || month;
  const villageName = displayedReports[0]?.village?.name || `Desa (ID: ${profile.village_id})`;

  return (
    <>
      {/* Header & Navigasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
             <Link href="/admin/muslimun" className="text-gray-500 hover:text-primary transition-colors">
                <FaArrowLeft />
             </Link>
             <Breadcrumb pageName={`Laporan Musyawarah`} />
        </div>
        
        {/* [FITUR BARU] Link Cross-Reference ke Laporan KBM (Hanya Admin Desa) */}
        {isAdminDesa && (
           <Link 
             href={`/admin/report/detail-village/${year}/${month}`}
             className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition"
           >
             <FaBuilding />
             Lihat Korelasi KBM (Matrix)
           </Link>
        )}
      </div>

      {/* Kartu Ringkasan */}
      <div className="mb-8 rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
          Rekapitulasi Musyawarah Desa {villageName}
        </h2>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          Periode: <span className="text-primary">{monthName} {year}</span>
        </p>
        
        {/* Statistik Sederhana */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm border-t border-stroke pt-4 dark:border-strokedark">
            <div className="flex items-center gap-2">
                <span className="text-gray-500">Total Kelompok:</span>
                <span className="font-bold text-black dark:text-white text-lg">{displayedGroups.length}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-gray-500">Laporan Masuk:</span>
                <span className="font-bold text-green-600 text-lg">{displayedReports.length}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-gray-500">Belum Lapor:</span>
                <span className="font-bold text-red-600 text-lg">{displayedGroups.length - displayedReports.length}</span>
            </div>
        </div>
      </div>

      {/* Tabel Detail 5 Unsur */}
      <div className="mt-8">
        <MuslimunRecapTable 
          reports={displayedReports} 
          groups={displayedGroups} 
        />
      </div>
    </>
  );
}