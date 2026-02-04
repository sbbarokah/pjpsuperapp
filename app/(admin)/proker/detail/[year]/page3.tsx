/**
 * Lokasi: app/(admin)/proker/detail/[year]/page.tsx
 * Deskripsi: Halaman wrapper (Server Component) yang memuat data dan merender Print View.
 * Update: Menggunakan service terpusat (getProkersByYear) untuk mengambil data.
 */

import React from "react";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService"; // Import Auth Service
import { getProkersByYear } from "@/lib/services/prokerService"; // Import Proker Service
import { BULAN, TEAMS } from "@/lib/constants";
import { ProkerPrintView2 } from "../../_components/proker_print_view2";

export default async function ProkerDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ year: string }>; 
  searchParams: Promise<{ level?: string }>; 
}) {
  
  // 1. Unwrap Params (Next.js 15)
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const year = parseInt(resolvedParams.year);
  const activeLevel = resolvedSearchParams.level || "desa";

  // 2. Ambil User Profile via Service
  // Service ini biasanya akan throw error atau redirect jika tidak login
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    return <div className="p-8 text-center">Akses ditolak atau sesi berakhir.</div>;
  }

  if (!profile) return <div className="p-8 text-center">Profil pengguna tidak ditemukan.</div>;

  const orgName = profile.village?.name || 'Organisasi & Tim';

  // 3. Ambil Data Program Kerja via Service
  // Service ini sudah menangani logika filter berdasarkan role (admin_desa/kelompok/superadmin)
  const programs = await getProkersByYear(year, profile, activeLevel);
  const safePrograms = programs || [];

  // 4. Olah Data (Grouping) untuk dikirim ke Print View
  // Grouping Data by Team
  const groupedPrograms: Record<string, any[]> = {};
  TEAMS.forEach(team => {
    const prokers = safePrograms.filter((p: any) => p.team === team);
    if (prokers.length > 0) groupedPrograms[team] = prokers;
  });

  // Rekap Bulanan
  const monthlyRecap = BULAN.map(bln => {
    const items = safePrograms.filter((p: any) => {
        // Cek timeline di JSONB, pastikan array ada dan tidak kosong
        const schedule = p.timeline ? p.timeline[bln] : [];
        return schedule && schedule.length > 0;
    });
    const totalRab = items.reduce((acc: number, item: any) => acc + (item.total_budget || 0), 0);
    return { bulan: bln, items, totalRab };
  });

  // 5. Render Komponen Print View
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <ProkerPrintView2
          year={year}
          orgName={orgName}
          activeLevel={activeLevel}
          groupedPrograms={groupedPrograms}
          monthlyRecap={monthlyRecap}
          // Tambahkan props lain yang dibutuhkan ProkerPrintView seperti canMutate & onDelete jika ada
          canMutate={profile.role === 'admin_desa' || profile.role === 'admin_kelompok'} 
          // onDelete handler biasanya hanya bisa dipass ke Client Component jika berbentuk Server Action yang dibind
          // atau ProkerPrintView menangani logika delete internalnya sendiri.
          // onDelete={async (id, name) => {
          //   "use server";
          //   // Placeholder jika ProkerPrintView membutuhkan prop ini, 
          //   // idealnya ProkerPrintView mengimport deleteProkerAction langsung.
          // }}
        />
      </div>
    </div>
  );
}