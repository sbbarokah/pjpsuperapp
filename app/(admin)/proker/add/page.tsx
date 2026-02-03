/**
 * Lokasi: app/(admin)/proker/add/page.tsx
 * Deskripsi: Halaman wrapper untuk formulir penambahan Program Kerja baru.
 */

import React from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { ProkerForm } from "../_components/proker_form";

export default function AddProkerPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Input Program Kerja Baru" />
      
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">Rencana Kegiatan Tahunan</h2>
          <p className="text-gray-500 mt-1">Lengkapi instrumen perencanaan strategis organisasi di bawah ini.</p>
        </div>
        
        <ProkerForm />
      </div>
    </div>
  );
}