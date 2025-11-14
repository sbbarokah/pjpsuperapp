"use client";

import { VillageUserStats } from "@/lib/services/dashboardService";
import React, { useMemo } from "react";

interface StatsDisplayTableProps {
  stats: VillageUserStats[];
}

// Tipe untuk data yang sudah di-pivot
type PivotedRow = {
  groupName: string;
  // Key adalah nama kategori, value adalah jumlah L/P
  categories: Map<string, { L: number; P: number }>;
  rowTotal: { L: number; P: number; T: number };
};

// Tipe untuk total kolom
type ColumnTotal = {
  L: number;
  P: number;
};

// Data yang diproses oleh useMemo
type ProcessedData = {
  groups: Map<string, PivotedRow>; // Peta grup
  categories: string[]; // Daftar kategori unik, diurutkan
  grandTotal: PivotedRow; // Baris "Total"
};

export function StatsDisplayTable({ stats }: StatsDisplayTableProps) {
  // Gunakan useMemo untuk memproses data sekali saja
  const processedData = useMemo((): ProcessedData => {
    const groups = new Map<string, PivotedRow>();
    const categorySet = new Set<string>();
    
    // Inisialisasi baris Grand Total
    const grandTotal: PivotedRow = {
      groupName: "Total",
      categories: new Map<string, { L: number; P: number }>(),
      rowTotal: { L: 0, P: 0, T: 0 },
    };

    // 1. Iterasi melalui data mentah
    for (const row of stats) {
      const { group_name, category_name, gender, total_users } = row;

      // Tambahkan kategori ke set untuk header
      categorySet.add(category_name);

      // --- 1. Proses Baris Grup ---
      // Dapatkan atau buat baris untuk grup ini
      if (!groups.has(group_name)) {
        groups.set(group_name, {
          groupName: group_name,
          categories: new Map<string, { L: number; P: number }>(),
          rowTotal: { L: 0, P: 0, T: 0 },
        });
      }
      const groupData = groups.get(group_name)!;

      // Dapatkan atau buat data kategori di dalam grup
      if (!groupData.categories.has(category_name)) {
        groupData.categories.set(category_name, { L: 0, P: 0 });
      }
      const categoryData = groupData.categories.get(category_name)!;
      
      // --- 2. Proses Baris Grand Total ---
      // Dapatkan atau buat data kategori di dalam Grand Total
      if (!grandTotal.categories.has(category_name)) {
        grandTotal.categories.set(category_name, { L: 0, P: 0 });
      }
      const totalCategoryData = grandTotal.categories.get(category_name)!;


      // --- 3. Tambahkan nilai ---
      if (gender.toUpperCase() === 'L') {
        categoryData.L += total_users;
        groupData.rowTotal.L += total_users;
        totalCategoryData.L += total_users;
        grandTotal.rowTotal.L += total_users;
      } else if (gender.toUpperCase() === 'P') {
        categoryData.P += total_users;
        groupData.rowTotal.P += total_users;
        totalCategoryData.P += total_users;
        grandTotal.rowTotal.P += total_users;
      }
      // Tambah ke total (T)
      groupData.rowTotal.T += total_users;
      grandTotal.rowTotal.T += total_users;
    }

    // Urutkan kategori secara alfabetis
    const categories = Array.from(categorySet).sort();
    
    return { groups, categories, grandTotal };
  }, [stats]);

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Rincian Statistik Generus
        </h3>
        <p className="text-gray-600 dark:text-gray-400">Belum ada data statistik generus untuk ditampilkan.</p>
      </div>
    );
  }

  const { groups, categories, grandTotal } = processedData;

  // Helper untuk mendapatkan data sel dengan aman
  const getCell = (data: PivotedRow, category: string) => {
    return data.categories.get(category) || { L: 0, P: 0 };
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Rincian Statistik Generus (per Kelompok & Kategori)
      </h3>
      <div className="max-w-full overflow-x-auto">
        {/*
          Styling kustom untuk pivot table
          - 'border-collapse' agar border rapi
          - 'whitespace-nowrap' agar header tidak terpotong
        */}
        <table className="w-full table-auto border-collapse">
          <thead className="text-center">
            {/* --- Baris Header 1: Kategori --- */}
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th 
                rowSpan={2} 
                className="border-b border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white"
              >
                Kelompok
              </th>
              
              {/* Loop Kategori untuk Header Atas */}
              {categories.map((category) => (
                <th 
                  key={category} 
                  colSpan={2} 
                  className="border-b border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white text-center whitespace-nowrap"
                >
                  {category}
                </th>
              ))}
              
              {/* Header Total */}
              <th 
                colSpan={3} 
                className="border-b border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white text-center whitespace-nowrap"
              >
                Total
              </th>
            </tr>
            
            {/* --- Baris Header 2: L / P --- */}
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              {/* Kolom L/P untuk setiap kategori */}
              {categories.map((category) => (
                <React.Fragment key={`${category}-lp`}>
                  <th className="border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white text-center w-16">L</th>
                  <th className="border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white text-center w-16">P</th>
                </React.Fragment>
              ))}
              
              {/* Kolom L/P/T untuk Total */}
              <th className="border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white text-center w-16">L</th>
              <th className="border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white text-center w-16">P</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white text-center w-20">T (L+P)</th>
            </tr>
          </thead>
          
          <tbody className="text-center">
            {/* --- Baris Data Grup --- */}
            {Array.from(groups.values()).map((row) => (
              <tr key={row.groupName}>
                <td className="border-b border-r border-stroke px-4 py-5 dark:border-strokedark text-left">
                  <p className="font-medium">{row.groupName}</p>
                </td>
                
                {/* Loop Kategori untuk Sel Data */}
                {categories.map((category) => {
                  const cell = getCell(row, category);
                  return (
                    <React.Fragment key={`${row.groupName}-${category}`}>
                      <td className="border-b border-r border-stroke px-4 py-5 dark:border-strokedark">{cell.L}</td>
                      <td className="border-b border-r border-stroke px-4 py-5 dark:border-strokedark">{cell.P}</td>
                    </React.Fragment>
                  );
                })}
                
                {/* Sel Total Baris */}
                <td className="border-b border-r border-stroke px-4 py-5 dark:border-strokedark font-medium">{row.rowTotal.L}</td>
                <td className="border-b border-r border-stroke px-4 py-5 dark:border-strokedark font-medium">{row.rowTotal.P}</td>
                <td className="border-b border-stroke px-4 py-5 dark:border-strokedark font-bold">{row.rowTotal.T}</td>
              </tr>
            ))}
          </tbody>
          
          <tfoot className="text-center font-bold bg-gray-2 dark:bg-meta-4">
            {/* --- Baris Grand Total --- */}
            <tr>
              <td className="border-r border-stroke px-4 py-5 dark:border-strokedark text-left">
                Total
              </td>
              
              {/* Loop Kategori untuk Sel Total */}
              {categories.map((category) => {
                const cell = getCell(grandTotal, category);
                return (
                  <React.Fragment key={`total-${category}`}>
                    <td className="border-r border-stroke px-4 py-5 dark:border-strokedark">{cell.L}</td>
                    <td className="border-r border-stroke px-4 py-5 dark:border-strokedark">{cell.P}</td>
                  </React.Fragment>
                );
              })}
              
              {/* Sel Grand Total Keseluruhan */}
              <td className="border-r border-stroke px-4 py-5 dark:border-strokedark">{grandTotal.rowTotal.L}</td>
              <td className="border-r border-stroke px-4 py-5 dark:border-strokedark">{grandTotal.rowTotal.P}</td>
              <td className="px-4 py-5">{grandTotal.rowTotal.T}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}