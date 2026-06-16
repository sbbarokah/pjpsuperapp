"use client";

import { VillageUserStats } from "@/lib/services/dashboardService";
import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";

interface StatsDisplayTableProps {
  stats: VillageUserStats[];
}

/**
 * Tipe data pivot per baris (Kategori atau Kelompok Cabe Rawit)
 */
type PivotedRow = {
  categoryId: number;
  categoryName: string;
  // Key adalah nama KELOMPOK, value adalah jumlah L/P
  groups: Map<string, { L: number; P: number }>;
  rowTotal: { L: number; P: number; T: number };
};

type ProcessedData = {
  categories: PivotedRow[]; 
  groups: string[]; 
  grandTotal: PivotedRow; 
};

export function StatsDisplayTable({ stats }: StatsDisplayTableProps) {
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view") || "all";

  // Memproses data berdasarkan mode tampilan
  const processedData = useMemo((): ProcessedData => {
    // [PERBAIKAN] Gunakan string (categoryName) sebagai key map agar data Superadmin tidak tercampur
    const categoryMap = new Map<string, PivotedRow>();
    const groupSet = new Set<string>();
    
    // [PERBAIKAN] Sesuaikan ID dan Nama untuk bucket Cabe Rawit (Mode Ringkas)
    const cabeRawitIds = [1, 2, 3, 4, 5, 6, 7, 12];
    const cabeRawitNames = ["Balita", "Kelas 0 (PAUD)", "Kelas 1 (A)", "Kelas 2 (A)", "Kelas 3 (A)", "Kelas 4 (A)", "Kelas 5 (A)", "Kelas 6 (A)"];
    
    const grandTotal: PivotedRow = {
      categoryId: -1,
      categoryName: "Total",
      groups: new Map<string, { L: number; P: number }>(),
      rowTotal: { L: 0, P: 0, T: 0 },
    };

    // 1. Iterasi dan Pengelompokan
    for (const row of stats) {
      // [PERBAIKAN] Fallback untuk Superadmin yang tidak punya group_name
      const group_name = row.group_name || "Data Global"; 
      const category_name = row.category_name || "Tanpa Kategori";
      const gender = row.gender || "";
      const total_users = row.total_users || 0;
      const originalCatId = Number(row.category_id || 0);

      let targetId = originalCatId;
      let targetName = category_name;
      let mapKey = targetName;

      // Logika Ringkas: Kelompokkan Cabe Rawit ke ID khusus 0 / Nama "Cabe Rawit"
      if (
        viewMode === "ringkas" && 
        (cabeRawitIds.includes(originalCatId) || (originalCatId === 0 && cabeRawitNames.includes(category_name)))
      ) {
        targetId = 0;
        targetName = "Cabe Rawit";
        mapKey = "Cabe Rawit"; // Key Map khusus untuk mode ringkas
      }

      groupSet.add(group_name);

      // Inisialisasi Kategori di Map
      if (!categoryMap.has(mapKey)) {
        categoryMap.set(mapKey, {
          categoryId: targetId,
          categoryName: targetName,
          groups: new Map<string, { L: number; P: number }>(),
          rowTotal: { L: 0, P: 0, T: 0 },
        });
      }
      
      const categoryData = categoryMap.get(mapKey)!;

      // [PERBAIKAN] Jika pada baris selanjutnya ditemukan ID kategori asli, perbarui ID-nya
      if (categoryData.categoryId === 0 && targetId !== 0) {
        categoryData.categoryId = targetId;
      }

      // Fungsi helper update data sel
      const updateCell = (target: PivotedRow) => {
        if (!target.groups.has(group_name)) {
          target.groups.set(group_name, { L: 0, P: 0 });
        }
        const cell = target.groups.get(group_name)!;
        if (gender.toUpperCase() === 'L') {
          cell.L += total_users;
          target.rowTotal.L += total_users;
        } else if (gender.toUpperCase() === 'P') {
          cell.P += total_users;
          target.rowTotal.P += total_users;
        }
        target.rowTotal.T += total_users;
      };

      updateCell(categoryData);
      updateCell(grandTotal);
    }

    // Urutkan grup secara alfabetis
    const groups = Array.from(groupSet).sort();
    
    // [PERBAIKAN] Urutkan kategori berdasarkan ID, jika tidak ada ID, urutkan berdasarkan Nama
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
      if (a.categoryId !== 0 && b.categoryId !== 0) return a.categoryId - b.categoryId;
      return a.categoryName.localeCompare(b.categoryName);
    });
    
    return { categories: sortedCategories, groups, grandTotal };
  }, [stats, viewMode]);

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Rincian Statistik Generus
        </h3>
        <p className="text-gray-600 dark:text-gray-400 italic">Belum ada data untuk ditampilkan.</p>
      </div>
    );
  }

  const { categories, groups, grandTotal } = processedData;

  const getCell = (data: PivotedRow, groupName: string) => {
    return data.groups.get(groupName) || { L: 0, P: 0 };
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark mt-6">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Tabel Rincian Sensus (per Kategori & Kelompok)
        </h3>
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wider">
          Mode: {viewMode === 'ringkas' ? 'Ringkas' : 'Semua Kategori'}
        </span>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-2 text-center dark:bg-meta-4">
              <th rowSpan={2} className="border-b border-r border-stroke px-4 py-4 font-bold text-black dark:border-strokedark dark:text-white text-left min-w-[150px]">
                Kategori
              </th>
              {groups.map((groupName) => (
                <th key={groupName} colSpan={2} className="border-b border-r border-stroke px-2 py-4 font-bold text-black dark:border-strokedark dark:text-white whitespace-nowrap">
                  {groupName}
                </th>
              ))}
              <th colSpan={3} className="border-b border-stroke px-4 py-4 font-bold text-black dark:border-strokedark dark:text-white whitespace-nowrap">
                Total Baris
              </th>
            </tr>
            <tr className="bg-gray-2 text-center dark:bg-meta-4 text-xs">
              {groups.map((groupName) => (
                <React.Fragment key={`${groupName}-lp`}>
                  <th className="border-r border-stroke px-2 py-2 font-medium text-black dark:border-strokedark dark:text-white w-10">L</th>
                  <th className="border-r border-stroke px-2 py-2 font-medium text-black dark:border-strokedark dark:text-white w-10">P</th>
                </React.Fragment>
              ))}
              <th className="border-r border-stroke px-2 py-2 font-bold text-blue-600 dark:text-blue-400 w-10">L</th>
              <th className="border-r border-stroke px-2 py-2 font-bold text-pink-600 dark:text-pink-400 w-10">P</th>
              <th className="px-2 py-2 font-bold text-black dark:text-white w-12">T</th>
            </tr>
          </thead>
          
          <tbody className="text-center text-sm">
            {categories.map((row) => (
              <tr key={row.categoryId + row.categoryName} className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                <td className="border-b border-r border-stroke px-4 py-3 dark:border-strokedark text-left font-medium text-black dark:text-white">
                  {row.categoryName}
                </td>
                {groups.map((groupName) => {
                  const cell = getCell(row, groupName);
                  return (
                    <React.Fragment key={`${row.categoryId}-${groupName}`}>
                      <td className="border-b border-r border-stroke px-2 py-3 dark:border-strokedark text-gray-600 dark:text-gray-400">
                        {cell.L || "-"}
                      </td>
                      <td className="border-b border-r border-stroke px-2 py-3 dark:border-strokedark text-gray-600 dark:text-gray-400">
                        {cell.P || "-"}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="border-b border-r border-stroke px-2 py-3 dark:border-strokedark font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                  {row.rowTotal.L}
                </td>
                <td className="border-b border-r border-stroke px-2 py-3 dark:border-strokedark font-semibold text-pink-600 dark:text-pink-400 bg-pink-50/30 dark:bg-pink-900/10">
                  {row.rowTotal.P}
                </td>
                <td className="border-b border-stroke px-2 py-3 dark:border-strokedark font-black text-black dark:text-white bg-gray-50 dark:bg-meta-4">
                  {row.rowTotal.T}
                </td>
              </tr>
            ))}
          </tbody>
          
          <tfoot className="text-center font-bold bg-gray-100 dark:bg-meta-4">
            <tr>
              <td className="border-r border-stroke px-4 py-4 dark:border-strokedark text-left text-black dark:text-white">
                GRAND TOTAL
              </td>
              {groups.map((groupName) => {
                const cell = getCell(grandTotal, groupName);
                return (
                  <React.Fragment key={`total-${groupName}`}>
                    <td className="border-r border-stroke px-2 py-4 dark:border-strokedark text-blue-600 dark:text-blue-400">
                      {cell.L}
                    </td>
                    <td className="border-r border-stroke px-2 py-4 dark:border-strokedark text-pink-600 dark:text-pink-400">
                      {cell.P}
                    </td>
                  </React.Fragment>
                );
              })}
              <td className="border-r border-stroke px-2 py-4 dark:border-strokedark text-blue-700 dark:text-blue-300">
                {grandTotal.rowTotal.L}
              </td>
              <td className="border-r border-stroke px-2 py-4 dark:border-strokedark text-pink-700 dark:text-pink-300">
                {grandTotal.rowTotal.P}
              </td>
              <td className="px-2 py-4 text-black dark:text-white text-lg">
                {grandTotal.rowTotal.T}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Global CSS for scrollbar if not already defined */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.8); }
      `}</style>
    </div>
  );
}