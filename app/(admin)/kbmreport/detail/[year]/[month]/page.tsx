import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { notFound, redirect } from "next/navigation";
import { getGroupsByVillage } from "@/lib/services/masterService";
import { monthOptions } from "@/lib/constants";
import { GroupSelector } from "./_components/group_selector";
import { GroupModel } from "@/lib/types/master.types";
import { getKbmGroupDetailData } from "@/lib/services/reportService";
import { KbmCategorySection } from "../../../_components/kbm_category_section";
import Link from "next/link";
import { FaBuilding } from "react-icons/fa";
import { GroupKbmReportPrintView } from "./_components/group_kbm_print_view";

export const metadata = {
  title: "Detail Laporan KBM | Admin",
};

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
  searchParams: Promise<{
    groupId?: string;
    group_id?: string; // Handle kemungkinan snake_case dari url manual
  }>;
}

export default async function GroupKbmDetailPage({ params, searchParams }: PageProps) {
  // 1. Validasi User
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    return <Breadcrumb pageName="Akses Ditolak" />;
  }

  const { year: yearStr, month: monthStr } = await params;
  const awaitedSearchParams = await searchParams;
  
  // Ambil groupId dari searchParams (dukung camelCase 'groupId' atau snake_case 'group_id')
  const groupIdStr = awaitedSearchParams.groupId || awaitedSearchParams.group_id;

  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  
  if (isNaN(year) || isNaN(month)) notFound();

  const isAdminDesa = profile.role === 'admin_desa';
  const isAdminKelompok = profile.role === 'admin_kelompok';
  
  let targetGroupId = 0;
  let availableGroups: GroupModel[] = [];

  // 2. Logika Penentuan Group ID
  if (isAdminKelompok) {
    // Admin Kelompok HANYA boleh melihat grupnya sendiri
    targetGroupId = Number(profile.group_id);
    
    // Validasi: Jika dia coba ganti groupId di URL, kita bisa redirect atau abaikan
    if (groupIdStr && parseInt(groupIdStr) !== targetGroupId) {
        // Opsional: Redirect paksa untuk membersihkan URL agar tidak membingungkan
        // redirect(`/admin/report/detail-group/${year}/${month}`);
    }
  } 
  else if (isAdminDesa && profile.village_id) {
    // Admin Desa: Ambil semua grup
    availableGroups = await getGroupsByVillage(profile.village_id);
    
    if (availableGroups.length === 0) {
        return <div className="p-6">Tidak ada kelompok di desa ini.</div>;
    }

    // Cek apakah ada groupId di URL (dari dropdown)
    const paramGroupId = groupIdStr ? parseInt(groupIdStr) : null;

    if (paramGroupId && availableGroups.some(g => g.id === paramGroupId)) {
        // Jika valid dan ada di daftar, gunakan itu
        targetGroupId = paramGroupId;
    } else {
        // Default: Ambil index ke-0 jika tidak ada param atau param salah
        targetGroupId = Number(availableGroups[0].id);
    }
  } else {
     return <Breadcrumb pageName="Akses Ditolak" />;
  }

  // 3. Ambil Data Lengkap
  const context = await getKbmGroupDetailData(targetGroupId, month, year);
  const monthName = monthOptions.find(m => m.value.toString() == String(month))?.label || month;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
        <Breadcrumb pageName={`Laporan KBM: ${context.groupName}`} />
        
        {isAdminDesa && (
           <Link 
             href={`/kbmreport/detail-village/${year}/${month}`}
             className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 shadow-md"
           >
             <FaBuilding />
             Lihat Rekap Desa (Matrix)
           </Link>
        )}
      </div>
      
      {/* Dropdown Seleksi Grup (Hanya Admin Desa) - Sembunyikan saat Print */}
      <div className="print:hidden">
        {isAdminDesa && availableGroups.length > 0 && (
            <GroupSelector 
            groups={availableGroups} 
            selectedGroupId={targetGroupId} 
            year={year} 
            month={month} 
            />
        )}
      </div>
      
      {/* [MODIFIKASI] Pindahkan rendering konten ke komponen Print View */}
      <GroupKbmReportPrintView 
        context={context}
        monthName={monthName as string}
        year={year}
      />
    </>
  );

  // return (
  //   <>
  //     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  //       <Breadcrumb pageName={`Laporan KBM: ${context.groupName}`} />
        
  //       {isAdminDesa && (
  //          <Link 
  //            href={`/kbmreport/detail-village/${year}/${month}`}
  //            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 shadow-md"
  //          >
  //            <FaBuilding />
  //            Lihat Rekap Desa (Matrix)
  //          </Link>
  //       )}
  //     </div>
      
  //     {isAdminDesa && availableGroups.length > 0 && (
  //       <GroupSelector 
  //         groups={availableGroups} 
  //         selectedGroupId={targetGroupId} 
  //         year={year} 
  //         month={month} 
  //       />
  //     )}
      
  //     <div className="mb-6 rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
  //       <h2 className="text-2xl font-bold text-black dark:text-white">
  //         Laporan Kegiatan Belajar Mengajar
  //       </h2>
  //       <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
  //         Periode: <span className="font-medium text-primary">{monthName} {year}</span>
  //       </p>
  //       <p className="text-sm text-gray-500 mt-2">
  //         Kelompok: <span className="font-semibold text-black dark:text-white">{context.groupName}</span>
  //       </p>
  //     </div>

  //     <div className="flex flex-col gap-10">
  //       {context.data.map((item) => (
  //         <KbmCategorySection 
  //           key={item.category.id} 
  //           data={item} 
  //           context={context}
  //         />
  //       ))}
  //     </div>
  //   </>
  // );
}