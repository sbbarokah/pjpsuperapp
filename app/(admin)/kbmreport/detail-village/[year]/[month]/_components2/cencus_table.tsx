"use client";

import { VillageDetailContext } from "@/lib/types/report.types";


export function VillageCensusTable({ context }: { context: VillageDetailContext }) {
  const { groups, categories, matrix } = context;

  // Helper Hitung Total Baris (Per Kategori)
  const getRowTotal = (catId: number) => {
    let l = 0, p = 0, t = 0;
    const groupMap = matrix.get(catId);
    if (groupMap) {
      for (const data of groupMap.values()) {
        l += data.count_male || 0;
        p += data.count_female || 0;
        t += data.count_total || 0;
      }
    }
    return { l, p, t };
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark overflow-x-auto">
      <table className="w-full min-w-[800px] table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-meta-4 text-left">
            <th rowSpan={2} className="p-3 border border-stroke dark:border-strokedark font-bold">Kategori</th>
            {groups.map(g => (
              <th key={g.id} colSpan={3} className="p-2 border border-stroke dark:border-strokedark text-center font-bold">
                {g.name}
              </th>
            ))}
            <th colSpan={3} className="p-2 border border-stroke dark:border-strokedark text-center font-bold bg-gray-200 dark:bg-gray-700">Total Desa</th>
          </tr>
          <tr className="bg-gray-50 dark:bg-meta-4 text-center text-xs">
            {groups.map(g => (
              <>
                <th key={`L-${g.id}`} className="p-1 border border-stroke w-10">L</th>
                <th key={`P-${g.id}`} className="p-1 border border-stroke w-10">P</th>
                <th key={`T-${g.id}`} className="p-1 border border-stroke w-10 bg-gray-100 font-bold">T</th>
              </>
            ))}
            {/* Header Total */}
            <th className="p-1 border border-stroke w-12 bg-gray-200">L</th>
            <th className="p-1 border border-stroke w-12 bg-gray-200">P</th>
            <th className="p-1 border border-stroke w-12 bg-gray-300 font-bold">T</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const rowTotal = getRowTotal(Number(cat.id));
            return (
              <tr key={cat.id}>
                <td className="p-3 border border-stroke dark:border-strokedark font-medium">{cat.name}</td>
                {groups.map(g => {
                  const cell = matrix.get(Number(cat.id))?.get(Number(g.id));
                  return (
                    <>
                      <td className="p-2 border border-stroke text-center">{cell?.count_male || "-"}</td>
                      <td className="p-2 border border-stroke text-center">{cell?.count_female || "-"}</td>
                      <td className="p-2 border border-stroke text-center font-bold bg-gray-50 dark:bg-meta-4">{cell?.count_total || "-"}</td>
                    </>
                  )
                })}
                {/* Kolom Total */}
                <td className="p-2 border border-stroke text-center font-bold bg-gray-100 dark:bg-gray-700">{rowTotal.l}</td>
                <td className="p-2 border border-stroke text-center font-bold bg-gray-100 dark:bg-gray-700">{rowTotal.p}</td>
                <td className="p-2 border border-stroke text-center font-extrabold bg-gray-200 dark:bg-gray-600 text-primary">{rowTotal.t}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}