"use client";

import { VillageDetailContext } from "@/lib/types/report.types";


export function VillageAttendanceTable({ context }: { context: VillageDetailContext }) {
  const { groups, categories, matrix } = context;

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
          </tr>
          <tr className="bg-gray-50 dark:bg-meta-4 text-center text-xs">
            {groups.map(g => (
              <>
                <th key={`H-${g.id}`} className="p-1 border border-stroke w-12 text-green-600">Hadir</th>
                <th key={`I-${g.id}`} className="p-1 border border-stroke w-12 text-yellow-600">Izin</th>
                <th key={`A-${g.id}`} className="p-1 border border-stroke w-12 text-red-600">Alfa</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat: any) => {
            return (
              <tr key={cat.id}>
                <td className="p-3 border border-stroke dark:border-strokedark font-medium">{cat.name}</td>
                {groups.map((g: any) => {
                  const cell = matrix.get(cat.id)?.get(g.id);
                  const h = cell?.avg_present?.toFixed(0);
                  const i = cell?.avg_permission?.toFixed(0);
                  const a = cell?.avg_absent?.toFixed(0);
                  
                  return (
                    <>
                      <td className="p-2 border border-stroke text-center">{h ? `${h}%` : "-"}</td>
                      <td className="p-2 border border-stroke text-center">{i ? `${i}%` : "-"}</td>
                      <td className="p-2 border border-stroke text-center">{a ? `${a}%` : "-"}</td>
                    </>
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