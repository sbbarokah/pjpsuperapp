"use client";

import { cn } from "@/lib/utils";
import type { JSX, SVGProps } from "react";

// [DIUBAH] Ikon Laki-laki (Heroicons 'UserIcon')
const MaleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" {...props}>
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

// [DIUBAH] Ikon Perempuan (Heroicons 'UserCircleIcon' - sebagai pembeda)
const FemaleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" {...props}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
  </svg>
);

type PropsType = {
  label: string; // Nama Kategori
  data: {
    male: number;
    female: number;
    total: number;
  };
  colorClass?: string; // [BARU] Untuk warna latar belakang
};

export function CategoryStatCard({ label, data, colorClass }: PropsType) {
  return (
    // [DIUBAH] Menerapkan colorClass dinamis, dengan fallback ke abu-abu
    <div className={cn(
      "rounded-[10px] p-6 shadow-1",
      colorClass || "bg-gray dark:bg-gray-dark"
    )}>
      {/* Label Kategori */}
      <dt className="mb-4 text-sm font-medium text-dark-6">{label}</dt>
      
      {/* Data Total Besar */}
      <dl>
        <dt className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
          {data.total}
          <span className="text-sm font-medium text-dark-6 ml-1">Total Generus</span>
        </dt>
      </dl>

      {/* Pembagian Gender */}
      <div className="mt-4 flex items-end justify-start gap-6">
        <dl className="text-sm font-medium text-blue-600 dark:text-blue-400">
          <dt className="flex items-center gap-1.5">
            <MaleIcon aria-hidden />
            {data.male}
          </dt>
          <dd className="sr-only">Laki-laki: {data.male}</dd>
        </dl>
        
        <dl className="text-sm font-medium text-pink-600 dark:text-pink-400">
          <dt className="flex items-center gap-1.5">
            <FemaleIcon aria-hidden />
            {data.female}
          </dt>
          <dd className="sr-only">Perempuan: {data.female}</dd>
        </dl>
      </div>
    </div>
  );
}