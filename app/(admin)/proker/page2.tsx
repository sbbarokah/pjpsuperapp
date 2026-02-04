/**
 * Lokasi: app/(admin)/proker/page.tsx
 * Deskripsi: Halaman utama Proker (Server Component) dengan filter Level dan Tahun.
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
  Info
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getAvailableProkerYears } from "@/lib/services/prokerService";

export default async function ProkerPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  // 1. Ambil profil user yang sedang login
  const { profile } = await getAuthenticatedUserAndProfile();
  if (!profile) return null;

  const isSuper = profile.role === "superadmin";
  const { level: paramLevel } = await searchParams;

  // 2. Tentukan Level Aktif
  // Admin Desa otomatis 'desa', Admin Kelompok otomatis 'kelompok'
  // Superadmin bisa memilih via tab (default 'desa')
  const activeLevel = isSuper 
    ? (paramLevel || "desa") 
    : (profile.role === "admin_kelompok" ? "kelompok" : "desa");

  // 3. Ambil daftar tahun dari database berdasarkan filter
  const availableYears = await getAvailableProkerYears(profile, activeLevel);

  return (
      <div>

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
                  Akses: {profile.role.replace('_', ' ')} • Tingkat {activeLevel}
               </p>
            </div>
          </div>

          {/* Tombol Input: Sembunyikan untuk Superadmin */}
          {!isSuper && (
            <Link 
              href="/proker/add" 
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all active:scale-95 text-sm"
            >
              <Plus size={20}/> Input Proker Baru
            </Link>
          )}
        </div>

        {/* Tab Tingkatan (Hanya muncul untuk Superadmin) */}
        {isSuper && (
          <div className="flex p-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-2xl w-fit mb-8 shadow-sm">
            {["desa", "kelompok"].map((lvl) => (
              <Link
                key={lvl}
                href={`/proker?level=${lvl}`}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  activeLevel === lvl 
                    ? "bg-primary text-white shadow-md" 
                    : "text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Tingkat {lvl}
              </Link>
            ))}
          </div>
        )}

        {/* Grid List Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableYears.map((year) => (
            <Link 
              key={year}
              href={`/proker/detail/${year}?level=${activeLevel}`}
              className="group bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-sm hover:border-primary transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black dark:text-white">Tahun {year}</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Lihat Laporan</p>
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
               <p className="text-sm text-gray-500">Program kerja tahunan tingkat {activeLevel} akan muncul di sini.</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-12 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex gap-3 items-start">
           <Info className="text-blue-500 shrink-0" size={18} />
           <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
             Daftar tahun di atas ditarik secara otomatis berdasarkan data yang tersimpan. Admin Desa hanya mengelola program kerja tingkat Desa, sedangkan Admin Kelompok mengelola tingkat Kelompok.
           </p>
        </div>

      </div>
  );
}