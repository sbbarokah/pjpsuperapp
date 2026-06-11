import { getKbmGroupDetailData } from "@/lib/services/reportService";
import { monthOptions } from "@/lib/constants";
import { notFound } from "next/navigation";
import { PresentationClient } from "./_components/presentation_client";

export const metadata = {
  title: "Presentasi Laporan KBM",
};

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
    groupId: string;
  }>;
}

export default async function PresentationPage({ params }: PageProps) {
  // Unwrapping params untuk Next.js 15
  const { year: yearStr, month: monthStr, groupId: groupIdStr } = await params;
  
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const groupId = parseInt(groupIdStr);

  if (isNaN(year) || isNaN(month) || isNaN(groupId)) notFound();

  // Tarik data menggunakan service yang sudah adas
  const context = await getKbmGroupDetailData(groupId, month, year);
  const monthName = monthOptions.find(m => m.value == month)?.label || String(month);

  return (
    // Karena ini halaman terpisah di luar (admin), 
    // ia akan memenuhi seluruh layar (100vh 100vw) tanpa gangguan Sidebar
    <PresentationClient 
      context={context} 
      monthName={monthName} 
      year={year} 
    />
  );
}