"use client";

import { VillageUserStats } from "@/lib/services/dashboardService";
import React, { useMemo } from "react";

interface StatsDisplayTableProps {
  stats: VillageUserStats[];
}

// [DIUBAH] Tipe data pivot sekarang berbasis Kategori
type PivotedRow = {
  categoryName: string;
  // Key adalah nama KELOMPOK, value adalah jumlah L/P
  groups: Map<string, { L: number; P: number }>;
  rowTotal: { L: number; P: number; T: number };
};

// Data yang diproses oleh useMemo
type ProcessedData = {
  categories: Map<string, PivotedRow>; // Peta Kategori
  groups: string[]; // Daftar KELOMPOK unik (untuk header kolom)
  grandTotal: PivotedRow; // Baris "Total"
};

export function StatsDisplayTable({ stats }: StatsDisplayTableProps) {
  // [LOGIKA DIUBAH TOTAL] Gunakan useMemo untuk mem-pivot data sekali saja
  const processedData = useMemo((): ProcessedData => {
    const categories = new Map<string, PivotedRow>();
    const groupSet = new Set<string>(); // Untuk header kolom
    
    // Inisialisasi baris Grand Total
    const grandTotal: PivotedRow = {
      categoryName: "Total",
      groups: new Map<string, { L: number; P: number }>(),
      rowTotal: { L: 0, P: 0, T: 0 },
    };

    // 1. Iterasi melalui data mentah
    for (const row of stats) {
      const { group_name, category_name, gender, total_users } = row;

      // Tambahkan nama grup ke set untuk header kolom
      groupSet.add(group_name);

      // --- 1. Proses Baris Kategori ---
      if (!categories.has(category_name)) {
        categories.set(category_name, {
          categoryName: category_name,
          groups: new Map<string, { L: number; P: number }>(),
          rowTotal: { L: 0, P: 0, T: 0 },
        });
      }
      const categoryData = categories.get(category_name)!;

      // Dapatkan atau buat data grup di dalam kategori
      if (!categoryData.groups.has(group_name)) {
        categoryData.groups.set(group_name, { L: 0, P: 0 });
      }
      const groupCellData = categoryData.groups.get(group_name)!;
      
      // --- 2. Proses Baris Grand Total ---
      if (!grandTotal.groups.has(group_name)) {
        grandTotal.groups.set(group_name, { L: 0, P: 0 });
      }
      const totalGroupCellData = grandTotal.groups.get(group_name)!;

      // --- 3. Tambahkan nilai ---
      if (gender.toUpperCase() === 'L') {
        groupCellData.L += total_users;
        categoryData.rowTotal.L += total_users;
        totalGroupCellData.L += total_users;
        grandTotal.rowTotal.L += total_users;
      } else if (gender.toUpperCase() === 'P') {
        groupCellData.P += total_users;
        categoryData.rowTotal.P += total_users;
        totalGroupCellData.P += total_users;
        grandTotal.rowTotal.P += total_users;
      }
      // Tambah ke total (T)
      categoryData.rowTotal.T += total_users;
      grandTotal.rowTotal.T += total_users;
    }

    // Urutkan nama grup (header kolom) secara alfabetis
    const groups = Array.from(groupSet).sort();
    
    return { categories, groups, grandTotal };
  }, [stats]);

  if (stats.length === 0) {
    // ... (fallback 'empty state' tetap sama)
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Rincian Statistik Generus
        </h3>
        <p className="text-gray-600 dark:text-gray-400">Belum ada data statistik generus untuk ditampilkan.</p>
      </div>
    );
  }

  const { categories, groups, grandTotal } = processedData;

  // Helper untuk mendapatkan data sel dengan aman
  const getCell = (data: PivotedRow, groupName: string) => {
    return data.groups.get(groupName) || { L: 0, P: 0 };
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Rincian Statistik Generus (per Kategori & Kelompok)
      </h3>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="text-center">
            {/* --- [DIUBAH] Baris Header 1: Nama Grup --- */}
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th 
                rowSpan={2} 
                className="border-b border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white"
              >
                Kategori
              </th>
              
              {/* Loop KELOMPOK untuk Header Atas */}
              {groups.map((groupName) => (
                <th 
                  key={groupName} 
                  colSpan={2} 
                  className="border-b border-r border-stroke px-4 py-4 font-medium text-black dark:border-strokedark dark:text-white text-center whitespace-nowrap"
                >
                  {groupName}
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
            
            {/* --- [DIUBAH] Baris Header 2: L / P --- */}
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              {/* Kolom L/P untuk setiap KELOMPOK */}
              {groups.map((groupName) => (
                <React.Fragment key={`${groupName}-lp`}>
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
            {/* --- [DIUBAH] Baris Data Kategori --- */}
            {Array.from(categories.values()).map((row) => (
              <tr key={row.categoryName}>
                <td className="border-b border-r border-stroke px-4 py-5 dark:border-strokedark text-left">
                  <p className="font-medium">{row.categoryName}</p>
                </td>
                
                {/* Loop KELOMPOK untuk Sel Data */}
                {groups.map((groupName) => {
                  const cell = getCell(row, groupName);
                  return (
                    <React.Fragment key={`${row.categoryName}-${groupName}`}>
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
            {/* --- [DIUBAH] Baris Grand Total --- */}
            <tr>
              <td className="border-r border-stroke px-4 py-5 dark:border-strokedark text-left">
                Total
              </td>
              
              {/* Loop KELOMPOK untuk Sel Total */}
              {groups.map((groupName) => {
                const cell = getCell(grandTotal, groupName);
                return (
                  <React.Fragment key={`total-${groupName}`}>
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