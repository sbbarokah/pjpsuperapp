/**
 * Lokasi: app/(admin)/proker/page.tsx
 * Deskripsi: Halaman utama Proker yang menampilkan daftar tahun yang tersedia.
 */

"use client";

import React from "react";
import { 
  Calendar, 
  Plus, 
  ChevronRight, 
  LayoutDashboard, 
  FileText 
} from "lucide-react";

// Mock Data Tahun (Nantinya diambil dari database: select distinct tahun from proker)
const AVAILABLE_YEARS = [2026, 2027, 2028];

export default function ProkerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-black dark:text-white flex items-center gap-3">
              <LayoutDashboard className="text-primary" size={32}/>
              Program Kerja
            </h1>
            <p className="text-gray-500 mt-1">Pilih tahun pelaksanaan untuk melihat rincian program kerja.</p>
          </div>

          <a 
            href="/proker/add" 
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 text-sm"
          >
            <Plus size={20}/> Input Proker Baru
          </a>
        </div>

        {/* List Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AVAILABLE_YEARS.map((year) => (
            <a 
              key={year}
              href={`/proker/detail/${year}`}
              className="group bg-white dark:bg-boxdark p-6 rounded-2xl border border-stroke dark:border-strokedark shadow-sm hover:border-primary transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black dark:text-white">Tahun {year}</h3>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Program Kerja Tahunan</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
            </a>
          ))}
          
          {AVAILABLE_YEARS.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white dark:bg-boxdark rounded-3xl border border-dashed border-stroke">
               <FileText className="mx-auto mb-4 text-gray-300" size={48} />
               <p className="text-gray-500 font-medium">Belum ada data program kerja.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}