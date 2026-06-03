"use client";

import { VillageDetailContext } from "@/lib/types/report.types";
import React from "react";
import { useMemo } from "react";


export function VillageCensusTable({ 
  context, 
  visibleGroupIds,
  visibleCategoryIds
}: { 
  context: VillageDetailContext; 
  visibleGroupIds: Set<number>;
  visibleCategoryIds: Set<number>;
}) {
  const { groups, categories, matrix } = context;

  const activeGroups = useMemo(() => {
    return groups.filter(g => visibleGroupIds.has(Number(g.id)));
  }, [groups, visibleGroupIds]);

  const activeCategories = useMemo(() => {
    return categories.filter(c => visibleCategoryIds.has(Number(c.id)));
  }, [categories, visibleCategoryIds]);

  const getRowTotal = (catId: number) => {
    let l = 0, p = 0, t = 0;
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
          {activeCategories.map(cat => {
            const rowTotal = getRowTotal(Number(cat.id));
            return (
              <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border border-stroke dark:border-strokedark font-bold text-slate-800">{cat.name}</td>
                {activeGroups.map(g => {
                  const cell = matrix.get(Number(cat.id))?.get(Number(g.id));
                  return (
                    <React.Fragment key={g.id}>
                      <td className="p-2 border border-stroke text-center font-medium">{cell?.count_male || "-"}</td>
                      <td className="p-2 border border-stroke text-center font-medium">{cell?.count_female || "-"}</td>
                      <td className="p-2 border border-stroke text-center font-black bg-gray-50 dark:bg-meta-4">{cell?.count_total || "-"}</td>
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