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
    const categoryMap = new Map<number, PivotedRow>();
    const groupSet = new Set<string>();
    const cabeRawitIds = [1, 2, 3, 4, 5, 6, 7, 12];
    
    const grandTotal: PivotedRow = {
      categoryId: -1,
      categoryName: "Total",
      groups: new Map<string, { L: number; P: number }>(),
      rowTotal: { L: 0, P: 0, T: 0 },
    };

    // 1. Iterasi dan Pengelompokan
    for (const row of stats) {
      const { group_name, category_name, gender, total_users } = row;
      const originalCatId = Number((row as any).category_id || 0);

      let targetId = originalCatId;
      let targetName = category_name;

      // Logika Ringkas: Kelompokkan ID Cabe Rawit ke ID khusus 0
      if (viewMode === "ringkas" && cabeRawitIds.includes(originalCatId)) {
        targetId = 0;
        targetName = "Cabe Rawit";
      }

      groupSet.add(group_name);

      // Inisialisasi Kategori di Map
      if (!categoryMap.has(targetId)) {
        categoryMap.set(targetId, {
          categoryId: targetId,
          categoryName: targetName,
          groups: new Map<string, { L: number; P: number }>(),
          rowTotal: { L: 0, P: 0, T: 0 },
        });
      }
      
      const categoryData = categoryMap.get(targetId)!;

      // Update data sel per Kelompok
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
    
    // Urutkan kategori berdasarkan ID
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => a.categoryId - b.categoryId);
    
    return { categories: sortedCategories, groups, grandTotal };
  }, [stats, viewMode]);

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
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
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Tabel Rincian Sensus (per Kategori & Kelompok)
        </h3>
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary uppercase tracking-wider">
          Mode: {viewMode === 'ringkas' ? 'Ringkas (Cabe Rawit)' : 'Semua Kategori'}
        </span>
      </div>

      <div className="max-w-full overflow-x-auto">
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
              <tr key={row.categoryId} className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
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
    </div>
  );
}