/**
 * Lokasi: app/(admin)/proker/page.tsx
 * Deskripsi: Dashboard Program Kerja dengan filter Level (Cross-View RBAC).
 */

import React from "react";
import Link from "next/link";
import { 
  Calendar, 
  Plus, 
  ChevronRight, 
  LayoutDashboard, 
  FileText,
  ShieldCheck,
  Info,
  Building2,
  Users
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getAvailableProkerYears } from "@/lib/services/prokerService";

export default async function ProkerPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  // 1. Ambil profil user
  const { profile } = await getAuthenticatedUserAndProfile();
  if (!profile) return null;

  const { level: paramLevel } = await searchParams;

  // 2. Tentukan Level Aktif
  // Default: Sesuai role user. Jika ada param di URL, gunakan itu.
  let defaultLevel = "desa";
  if (profile.role === "admin_kelompok") defaultLevel = "kelompok";
  
  const activeLevel = paramLevel || defaultLevel;

  // 3. Tentukan Hak Akses Input (Create)
  // Admin Desa -> Input di level 'desa'
  // Admin Kelompok -> Input di level 'kelompok'
  // Superadmin -> Read only
  let canCreate = false;
  if (profile.role === 'admin_desa' && activeLevel === 'desa') canCreate = true;
  if (profile.role === 'admin_kelompok' && activeLevel === 'kelompok') canCreate = true;

  // 4. Ambil Data Tahun
  const availableYears = await getAvailableProkerYears(profile, activeLevel);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <Breadcrumb pageName="Program Kerja" showNav={false} />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-6">
          <div>
            <h1 className="text-3xl font-black text-black dark:text-white flex items-center gap-3">
              <LayoutDashboard className="text-primary" size={32}/>
              Program Kerja
            </h1>
            <div className="flex items-center gap-2 mt-2">
               <ShieldCheck size={14} className="text-green-500" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Login: {profile.role.replace('_', ' ')}
               </p>
            </div>
          </div>

          {/* Tombol Input: Hanya muncul di Level Wewenang User */}
          {canCreate && (
            <Link 
              href="/proker/add" 
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95 text-sm"
            >
              <Plus size={20}/> Input Proker Baru
            </Link>
          )}
        </div>

        {/* Tab Tingkatan (Sekarang muncul untuk Semua Admin) */}
        <div className="flex p-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-2xl w-full sm:w-fit mb-8 shadow-sm">
            <Link
              href="/proker?level=desa"
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                activeLevel === 'desa'
                  ? "bg-primary text-white shadow-md" 
                  : "text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <Building2 size={14} /> Tingkat Desa
            </Link>
            <Link
              href="/proker?level=kelompok"
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                activeLevel === 'kelompok' 
                  ? "bg-primary text-white shadow-md" 
                  : "text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <Users size={14} /> Tingkat Kelompok
            </Link>
        </div>

        {/* Grid List Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableYears.map((year) => (
            <Link 
              key={year}
              href={`/proker/detail/${year}?level=${activeLevel}`}
              className="group bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-sm hover:border-primary hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black dark:text-white">Tahun {year}</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                    Proker {activeLevel === 'desa' ? 'Desa' : 'Kelompok'}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
          ))}
          
          {availableYears.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white dark:bg-boxdark rounded-3xl border border-dashed border-stroke dark:border-strokedark">
               <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-meta-4 text-gray-300">
                  <FileText size={32} />
               </div>
               <h3 className="text-lg font-bold text-black dark:text-white uppercase tracking-tight">Belum Ada Data</h3>
               <p className="text-sm text-gray-500">
                 Tidak ada arsip program kerja tingkat <strong>{activeLevel}</strong> di tahun manapun.
               </p>
            </div>
          )}
        </div>

        {/* Info Box Contextual */}
        <div className="mt-12 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex gap-3 items-start">
           <Info className="text-blue-500 shrink-0" size={18} />
           <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
             <p className="font-bold mb-1">Anda sedang melihat data Tingkat {activeLevel === 'desa' ? 'Desa' : 'Kelompok'}.</p>
             {profile.role === 'admin_kelompok' && activeLevel === 'desa' && (
               <p>Sebagai Admin Kelompok, Anda dapat melihat program kerja desa (Read Only) sebagai acuan kegiatan.</p>
             )}
             {profile.role === 'admin_desa' && activeLevel === 'kelompok' && (
               <p>Sebagai Admin Desa, Anda dapat memantau program kerja seluruh kelompok di bawah naungan desa (Read Only).</p>
             )}
             {canCreate && (
               <p>Anda memiliki akses penuh untuk mengelola (tambah/edit/hapus) data pada tingkatan ini.</p>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
