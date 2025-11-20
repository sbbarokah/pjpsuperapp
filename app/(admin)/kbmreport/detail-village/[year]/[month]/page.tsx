import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { notFound } from "next/navigation";
import { monthOptions } from "@/lib/constants";
import { getVillageDetailData } from "@/lib/services/reportService";
import { VillageCensusTable } from "./_components/cencus_table";
import { VillageAttendanceTable } from "./_components/attendance_table";
import { VillageDescriptiveSection } from "./_components/descriptive_section";
import { VillageKBMPrintView } from "./_components/village_kbm_print_view";

export const metadata = {
  title: "Laporan Desa Lengkap | Admin",
};

interface PageProps {
  params: Promise<{ year: string; month: string }>;
}

export default async function VillageKBMReportsPage({ params }: PageProps) {
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) { return <Breadcrumb pageName="Akses Ditolak" />; }

  const { year, month } = await params;
  const yearInt = parseInt(year);
  const monthInt = parseInt(month);
  
  if (profile.role !== 'admin_desa' || !profile.village_id) {
    return <div className="p-6 text-red-500">Hanya Admin Desa yang dapat mengakses halaman ini.</div>;
  }

  const context = await getVillageDetailData(Number(profile.village_id), monthInt, yearInt);
  const monthName = monthOptions.find(m => m.value.toString() == String(month))?.label || month;

  return (
    <VillageKBMPrintView 
      context={context}
      monthName={monthName}
      year={yearInt}
    />
  );
  
  // return (
  //   <>
  //     <Breadcrumb pageName={`Laporan Lengkap Desa ${context.villageName}`} />
      
  //     <div className="mb-8 text-center">
  //       <h2 className="text-3xl font-bold text-black dark:text-white uppercase mb-2">
  //         Laporan KBM Desa {context.villageName}
  //       </h2>
  //       <p className="text-lg text-gray-600 dark:text-gray-300">
  //         Bulan {monthName} Tahun {year}
  //       </p>
  //     </div>

  //     <div className="flex flex-col gap-12">
  //       {/* 1. Sensus */}
  //       <section>
  //         <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3">
  //           1. Sensus Generus
  //         </h3>
  //         <VillageCensusTable context={context} />
  //       </section>

  //       {/* 2. Kehadiran */}
  //       <section>
  //         <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3">
  //           2. Rata-Rata Kehadiran (%)
  //         </h3>
  //         <VillageAttendanceTable context={context} />
  //       </section>

  //       {/* 3. Materi */}
  //       <section>
  //         <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3">
  //           3. Evaluasi Materi Kurikulum
  //         </h3>
  //         <VillageDescriptiveSection context={context} type="MATERIALS" />
  //       </section>
        
  //       {/* 4. Tantangan */}
  //       <section>
  //         <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3">
  //           4. Tantangan / Kendala
  //         </h3>
  //         <VillageDescriptiveSection context={context} type="CHALLENGES" />
  //       </section>

  //       {/* 5. Solusi */}
  //       <section>
  //         <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3">
  //           5. Solusi / Usulan
  //         </h3>
  //         <VillageDescriptiveSection context={context} type="SOLUTIONS" />
  //       </section>
        
  //       {/* 6. Keberhasilan */}
  //       <section>
  //         <h3 className="text-xl font-bold mb-4 text-black dark:text-white border-l-4 border-primary pl-3">
  //           6. Catatan / Keberhasilan
  //         </h3>
  //         <VillageDescriptiveSection context={context} type="SUCCESS" />
  //       </section>
  //     </div>
  //   </>
  // );
}