"use client";

import { VillageDetailContext } from "@/lib/types/report.types";


export function VillageAttendanceTable({ 
  context, 
  visibleGroupIds 
}: { 
  context: VillageDetailContext; 
  visibleGroupIds: Set<number>;
}) {
  const { groups, categories, matrix } = context;

  const activeGroups = useMemo(() => {
    return groups.filter(g => visibleGroupIds.has(Number(g.id)));
  }, [groups, visibleGroupIds]);

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
          </tr>
          <tr className="bg-gray-50 dark:bg-meta-4 text-center text-[10px] font-black">
            {activeGroups.map(g => (
              <React.Fragment key={g.id}>
                <th className="p-1.5 border border-stroke w-12 text-green-600">Hadir</th>
                <th className="p-1.5 border border-stroke w-12 text-yellow-600">Izin</th>
                <th className="p-1.5 border border-stroke w-12 text-red-600">Alfa</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat: any) => {
            return (
              <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border border-stroke dark:border-strokedark font-bold text-slate-800">{cat.name}</td>
                {activeGroups.map((g: any) => {
                  const cell = matrix.get(cat.id)?.get(g.id);
                  const h = cell?.avg_present?.toFixed(0);
                  const i = cell?.avg_permission?.toFixed(0);
                  const a = cell?.avg_absent?.toFixed(0);
                  
                  return (
                    <React.Fragment key={g.id}>
                      <td className="p-2 border border-stroke text-center font-semibold text-green-700">{h ? `${h}%` : "-"}</td>
                      <td className="p-2 border border-stroke text-center font-semibold text-yellow-700">{i ? `${i}%` : "-"}</td>
                      <td className="p-2 border border-stroke text-center font-semibold text-red-700">{a ? `${a}%` : "-"}</td>
                    </React.Fragment>
                  )
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}