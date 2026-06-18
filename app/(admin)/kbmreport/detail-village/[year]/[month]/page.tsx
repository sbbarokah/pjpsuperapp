import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { monthOptions } from "@/lib/constants";
import { getVillageDetailData } from "@/lib/services/reportService";
import { VillageKBMPrintView } from "./_components/village_kbm_print_view";
import { isVillageLevel } from "@/lib/utils/rbac";

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

  const canAccess = isVillageLevel(profile.role);
  
  if (!canAccess || !profile.village_id) {
    return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <p>Hanya Admin Desa atau Pengurus Desa yang dapat mengakses halaman ini.</p>
       </>
    );
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
  
}