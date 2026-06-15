"use client";

import { VillageDetailContext } from "@/lib/types/report.types";
import { cn } from "@/lib/utils";
import React from "react";
import { useMemo } from "react";


export function VillageCensusTable({ 
  context, 
  visibleGroupIds,
  visibleCategoryIds,
  isRingkasCR
}: { 
  context: VillageDetailContext; 
  visibleGroupIds: Set<number>;
  visibleCategoryIds: Set<number>;
  isRingkasCR?: boolean;
}) {
  const { groups, categories, matrix } = context;

  const activeGroups = useMemo(() => {
    return groups.filter(g => visibleGroupIds.has(Number(g.id)));
  }, [groups, visibleGroupIds]);

  const activeCategories = useMemo(() => {
    return categories.filter(c => visibleCategoryIds.has(Number(c.id)));
  }, [categories, visibleCategoryIds]);

  // ID kategori yang masuk dalam kelompok Cabe Rawit
  const cabeRawitIds = [1, 2, 3, 4, 5, 6, 7];

  // Menyiapkan data baris yang akan dirender berdasarkan isRingkasCR
  const displayRows = useMemo(() => {
    const activeCategories = categories.filter(c => visibleCategoryIds.has(Number(c.id)));

    if (!isRingkasCR) {
      // Jika mode ringkas nonaktif, kembalikan kategori aktif seperti biasa
      return activeCategories.map(cat => ({
        id: Number(cat.id),
        name: cat.name,
        isAggregated: false,
        originalIds: [Number(cat.id)]
      }));
    }

    const rows: { id: number | string; name: string; isAggregated: boolean; originalIds: number[] }[] = [];
    const aggregatedCRIds: number[] = [];
    let hasCR = false;

    activeCategories.forEach(cat => {
      const catId = Number(cat.id);
      if (cabeRawitIds.includes(catId)) {
        hasCR = true;
        aggregatedCRIds.push(catId);
      } else {
        rows.push({
          id: catId,
          name: cat.name,
          isAggregated: false,
          originalIds: [catId]
        });
      }
    });

    if (hasCR) {
      // Sisipkan baris gabungan di awal (atau di posisi yang sesuai)
      rows.unshift({
        id: 'cr_aggregated',
        name: 'GABUNGAN CABE RAWIT (0 - 6)',
        isAggregated: true,
        originalIds: aggregatedCRIds
      });
    }

    return rows;


  }, [categories, visibleCategoryIds, isRingkasCR]);

  // Fungsi untuk mengambil/menghitung data sel (per kelompok)
  const getCellData = (categoryIds: number[], groupId: number) => {
    let l = 0, p = 0, t = 0;

    categoryIds.forEach(catId => {
      const cell = matrix.get(catId)?.get(groupId);
      if (cell) {
        l += cell.count_male || 0;
        p += cell.count_female || 0;
        t += cell.count_total || 0;
      }
    });

    return { l, p, t };
  };

  // Fungsi untuk mengambil/menghitung total baris (semua kelompok aktif)
  const getRowTotal = (categoryIds: number[]) => {
    let l = 0, p = 0, t = 0;

    categoryIds.forEach(catId => {
      const groupMap = matrix.get(catId);
      if (groupMap) {
        for (const [groupId, data] of groupMap.entries()) {
          if (visibleGroupIds.has(Number(groupId))) {
            l += data.count_male || 0;
            p += data.count_female || 0;
            t += data.count_total || 0;
          }
        }
      }
    });

    return { l, p, t };
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark overflow-x-auto">
      <table className="w-full min-w-[800px] table-auto border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100 dark:bg-meta-4 text-left font-black">
            <th rowSpan={2} className="p-3 border border-stroke dark:border-strokedark font-black text-slate-800">Kategori</th>
            {activeGroups.map(g => (
              <th key={g.id} colSpan={3} className="p-2 border border-stroke dark:border-strokedark text-center font-black text-slate-800">
                {g.name}
              </th>
            ))}
            <th colSpan={3} className="p-2 border border-stroke dark:border-strokedark text-center font-black bg-gray-200 text-slate-900">Total Aktif</th>
          </tr>
          <tr className="bg-gray-50 dark:bg-meta-4 text-center text-[10px] font-black">
            {activeGroups.map(g => (
              <React.Fragment key={g.id}>
                <th className="p-1.5 border border-stroke w-10 text-blue-600">L</th>
                <th className="p-1.5 border border-stroke w-10 text-pink-600">P</th>
                <th className="p-1.5 border border-stroke w-10 bg-gray-100 font-black text-slate-700">T</th>
              </React.Fragment>
            ))}
            <th className="p-1.5 border border-stroke w-12 bg-gray-200 text-blue-800">L</th>
            <th className="p-1.5 border border-stroke w-12 bg-gray-200 text-pink-800">P</th>
            <th className="p-1.5 border border-stroke w-12 bg-gray-300 font-black text-slate-950">T</th>
          </tr>
        </thead>
        <tbody>
          {/* PERUBAHAN: Sekarang me-loop displayRows, bukan activeCategories */}
          {displayRows.map(row => {
            // PERUBAHAN: Melemparkan array originalIds ke getRowTotal
            const rowTotal = getRowTotal(row.originalIds);
            
            return (
              <tr 
                key={row.id} 
                className={cn(
                  "hover:bg-slate-50 transition-colors", 
                  // Jika ini baris agregasi (Gabungan CR), kita beri sedikit background (opsional) agar menarik
                  row.isAggregated && "bg-amber-50/40 dark:bg-amber-900/10" 
                )}
              >
                <td className="p-3 border border-stroke dark:border-strokedark font-bold text-slate-800">
                  {row.name}
                </td>
                {activeGroups.map(g => {
                  // PERUBAHAN: Memanggil getCellData yang akan men-sum data berdasarkan originalIds
                  const cell = getCellData(row.originalIds, Number(g.id));
                  return (
                    <React.Fragment key={g.id}>
                      <td className="p-2 border border-stroke text-center font-medium">{cell.l || "-"}</td>
                      <td className="p-2 border border-stroke text-center font-medium">{cell.p || "-"}</td>
                      <td className="p-2 border border-stroke text-center font-black bg-gray-50 dark:bg-meta-4">{cell.t || "-"}</td>
                    </React.Fragment>
                  )
                })}
                <td className="p-2 border border-stroke text-center font-black bg-gray-100 text-blue-700">{rowTotal.l || "-"}</td>
                <td className="p-2 border border-stroke text-center font-black bg-gray-100 text-pink-700">{rowTotal.p || "-"}</td>
                <td className="p-2 border border-stroke text-center font-extrabold bg-gray-200 text-primary text-sm">{rowTotal.t || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}