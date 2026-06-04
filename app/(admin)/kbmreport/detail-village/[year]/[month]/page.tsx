import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { monthOptions } from "@/lib/constants";
import { getVillageDetailData } from "@/lib/services/reportService";
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
  
}