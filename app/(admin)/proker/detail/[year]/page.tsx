/**
 * Lokasi: app/(admin)/proker/detail/[year]/page.tsx
 * Deskripsi: Halaman wrapper (Server Component) dengan logika RBAC level.
 * Perbaikan: Adaptasi logika rekapitulasi bulanan untuk membaca struktur Timeline baru (Object) & Filter Fiskal.
 */

import React from "react";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getProkersByYear } from "@/lib/services/prokerService";
import { BULAN, TEAMS } from "@/lib/constants"; 
import { ProkerPrintView } from "../../_components/proker_print_view";

export default async function ProkerDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ year: string }>; 
  searchParams: Promise<{ level?: string }>; 
}) {
  
  // 1. Ambil Profil User
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    return <div className="p-8 text-center text-red-500">Akses ditolak atau sesi berakhir.</div>;
  }

  if (!profile) return <div className="p-8 text-center">Profil pengguna tidak ditemukan.</div>;

  // 2. Unwrap Params (Next.js 15)
  const { year: yearStr } = await params;
  const { level: paramLevel } = await searchParams;
  const year = parseInt(yearStr);

  // 3. Logika Penentuan Level Aktif
  let defaultLevel = "desa";
  if (profile.role === "admin_kelompok") defaultLevel = "kelompok";
  
  const activeLevel = paramLevel || defaultLevel;

  // 4. Logika Hak Akses Edit/Hapus (canMutate)
  let canMutate = false;
  if (profile.role === 'admin_desa' && activeLevel === 'desa') canMutate = true;
  if (profile.role === 'admin_kelompok' && activeLevel === 'kelompok') canMutate = true;

  // 5. Ambil Data
  const programs = await getProkersByYear(year, profile, activeLevel);
  const safePrograms = programs || [];

  const orgName = profile.village?.name || 'Organisasi';

  // 6. Pengolahan Data untuk View (Grouping & Recap)
  const TEAMS_LIST = TEAMS;
  const BULAN_LIST = BULAN;

  const groupedPrograms: Record<string, any[]> = {};
  TEAMS_LIST.forEach(team => {
    const prokers = safePrograms.filter((p: any) => p.team === team);
    if (prokers.length > 0) groupedPrograms[team] = prokers;
  });

  // [PERBAIKAN UTAMA DI SINI]
  const monthlyRecap = BULAN_LIST.map(bln => {
    const items = safePrograms.filter((p: any) => {
        const schedule = p.timeline ? p.timeline[bln] : null;
        if (!schedule) return false;

        // A. Cek struktur baru (Object) -> Cari status 2 (Fiskal/Hijau)
        // Kita hanya memasukkan ke rekap arus kas jika ada pengeluaran biaya (Fiskal)
        if (typeof schedule === 'object' && !Array.isArray(schedule)) {
             return Object.values(schedule).some((status: any) => status === 2);
        }

        // B. Fallback struktur lama (Array) -> Anggap semua aktif sebagai fiskal
        if (Array.isArray(schedule)) {
            return schedule.length > 0;
        }

        return false;
    });

    // Menghitung total RAB bulan ini
    // Note: Jika proker berjalan fiskal di beberapa bulan, total budget akan muncul di setiap bulan tersebut.
    const totalRab = items.reduce((acc: number, item: any) => acc + (item.total_budget || 0), 0);
    
    return { bulan: bln, items, totalRab };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <ProkerPrintView 
          year={year}
          orgName={orgName}
          activeLevel={activeLevel}
          groupedPrograms={groupedPrograms}
          monthlyRecap={monthlyRecap}
          canMutate={canMutate} 
          userRole={profile.role}
        />
      </div>
    </div>
  );
}