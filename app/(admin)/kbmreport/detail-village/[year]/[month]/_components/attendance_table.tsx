"use client";

import { VillageDetailContext } from "@/lib/types/report.types";
import { cn } from "@/lib/utils";
import React from "react";
import { useMemo } from "react";

export function VillageAttendanceTable({ 
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

  // Menyiapkan data baris yang dirender berdasarkan mode isRingkasCR
  const displayRows = useMemo(() => {
    if (!isRingkasCR) {
      return activeCategories.map((cat: any) => ({
        id: Number(cat.id),
        name: cat.name,
        isAggregated: false,
        originalIds: [Number(cat.id)]
      }));
    }

    const rows: { id: number | string; name: string; isAggregated: boolean; originalIds: number[] }[] = [];
    const aggregatedCRIds: number[] = [];
    let hasCR = false;

    activeCategories.forEach((cat: any) => {
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
      // Sisipkan baris gabungan di awal tabel
      rows.unshift({
        id: 'cr_aggregated',
        name: 'CR (0-6)',
        isAggregated: true,
        originalIds: aggregatedCRIds
      });
    }

    return rows;
  }, [activeCategories, isRingkasCR]);

  // Fungsi untuk mengambil/menghitung rata-rata sel presensi
  const getCellData = (categoryIds: number[], groupId: number) => {
    let sumH = 0, sumI = 0, sumA = 0;
    let countValidCells = 0;

    categoryIds.forEach(catId => {
      const cell = matrix.get(catId)?.get(groupId);
      
      if (cell) {
        const h = cell.avg_present || 0;
        const i = cell.avg_permission || 0;
        const a = cell.avg_absent || 0;

        // Validasi: Hanya hitung jika ada data persentase (H + I + A > 0)
        // Normalnya total ini mendekati 100%. Jika 0, berarti kelas kosong/tidak ada rekap.
        if ((h + i + a) > 0) {
          sumH += h;
          sumI += i;
          sumA += a;
          countValidCells++;
        }
      }
    });

    // Jika tidak ada kelas yang valid sama sekali di kelompok tersebut
    if (countValidCells === 0) return { h: null, i: null, a: null };

    // Hitung persentase rata-rata HANYA dari kelas yang memiliki data
    return {
      h: (sumH / countValidCells).toFixed(0),
      i: (sumI / countValidCells).toFixed(0),
      a: (sumA / countValidCells).toFixed(0),
    };
  };

  // Menghitung rata-rata baris (Semua Kelompok Aktif)
  const getRowData = (categoryIds: number[], groupIds: number[]) => {
    let sumH = 0, sumI = 0, sumA = 0;
    let countValidCells = 0;

    categoryIds.forEach(catId => {
      groupIds.forEach(groupId => {
        const cell = matrix.get(catId)?.get(groupId);
        
        if (cell) {
          const h = cell.avg_present || 0;
          const i = cell.avg_permission || 0;
          const a = cell.avg_absent || 0;

          if ((h + i + a) > 0) {
            sumH += h;
            sumI += i;
            sumA += a;
            countValidCells++;
          }
        }
      });
    });

    if (countValidCells === 0) return { h: null, i: null, a: null };

    return {
      h: (sumH / countValidCells).toFixed(0),
      i: (sumI / countValidCells).toFixed(0),
      a: (sumA / countValidCells).toFixed(0),
    };
  };

  // Kumpulkan ID dari kelompok yang sedang aktif untuk kalkulasi baris
  const activeGroupIds = useMemo(() => activeGroups.map(g => Number(g.id)), [activeGroups]);

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
            {/* TAMBAHAN: Kolom Header Rata-Rata Total */}
            <th colSpan={3} className="p-2 border border-stroke dark:border-strokedark text-center font-black bg-gray-200 text-slate-900">Rata-rata Total</th>
          </tr>
          <tr className="bg-gray-50 dark:bg-meta-4 text-center text-[10px] font-black">
            {activeGroups.map((g: any) => (
              <React.Fragment key={g.id}>
                <th className="p-1.5 border border-stroke w-12 text-green-600">Hadir</th>
                <th className="p-1.5 border border-stroke w-12 text-yellow-600">Izin</th>
                <th className="p-1.5 border border-stroke w-12 text-red-600">Alfa</th>
              </React.Fragment>
            ))}
            {/* TAMBAHAN: Sub-Kolom Rata-Rata Total */}
            <th className="p-1.5 border border-stroke w-12 bg-gray-200 text-green-800">Hadir</th>
            <th className="p-1.5 border border-stroke w-12 bg-gray-200 text-yellow-800">Izin</th>
            <th className="p-1.5 border border-stroke w-12 bg-gray-300 text-red-800">Alfa</th>
          </tr>
        </thead>
        <tbody>
          {/* Me-render displayRows yang sudah memproses filter ringkasan */}
          {displayRows.map((row: any) => {
            // Kalkulasi total rata-rata baris ini
            const rowTotal = getRowData(row.originalIds, activeGroupIds);

            return (
              <tr 
                key={row.id} 
                className={cn(
                  "hover:bg-slate-50 transition-colors",
                  row.isAggregated && "bg-amber-50/40 dark:bg-amber-900/10" // Highlight untuk baris gabungan
                )}
              >
                <td className="p-3 border border-stroke dark:border-strokedark font-bold text-slate-800">
                  {row.name}
                </td>
                {activeGroups.map((g: any) => {
                  // Memanggil data agregasi berdasarkan array ID
                  const { h, i, a } = getCellData(row.originalIds, Number(g.id));
                  
                  return (
                    <React.Fragment key={g.id}>
                      <td className="p-2 border border-stroke text-center font-semibold text-green-700">
                        {h !== null ? `${h}%` : "-"}
                      </td>
                      <td className="p-2 border border-stroke text-center font-semibold text-yellow-700">
                        {i !== null ? `${i}%` : "-"}
                      </td>
                      <td className="p-2 border border-stroke text-center font-semibold text-red-700">
                        {a !== null ? `${a}%` : "-"}
                      </td>
                    </React.Fragment>
                  )
                })}
                {/* TAMBAHAN: Tampilan Data Rata-Rata Total */}
                <td className="p-2 border border-stroke text-center font-extrabold bg-gray-100 text-green-700">
                  {rowTotal.h !== null ? `${rowTotal.h}%` : "-"}
                </td>
                <td className="p-2 border border-stroke text-center font-extrabold bg-gray-100 text-yellow-700">
                  {rowTotal.i !== null ? `${rowTotal.i}%` : "-"}
                </td>
                <td className="p-2 border border-stroke text-center font-extrabold bg-gray-200 text-red-700">
                  {rowTotal.a !== null ? `${rowTotal.a}%` : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}