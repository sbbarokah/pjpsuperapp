"use client";

import { VillageDetailContext } from "@/lib/types/report.types";
import { useMemo } from "react";
import { FaCheckCircle, FaCircle } from "react-icons/fa";

type SectionType = 'MATERIALS' | 'CHALLENGES' | 'SOLUTIONS' | 'SUCCESS' | 'ACHIEVEMENT';

export function VillageDescriptiveSection({ 
  context, 
  type,
  visibleGroupIds,
  visibleCategoryIds
}: { 
  context: VillageDetailContext; 
  type: SectionType; 
  visibleGroupIds: Set<number>;
  visibleCategoryIds: Set<number>;
}) {
  const { categories, groups, materialCategories, matrix } = context;

  const activeGroupsAll = useMemo(() => {
    return groups.filter(g => visibleGroupIds.has(Number(g.id)));
  }, [groups, visibleGroupIds]);

  const activeCategories = useMemo(() => {
    return categories.filter(c => visibleCategoryIds.has(Number(c.id)));
  }, [categories, visibleCategoryIds]);

  return (
    <div className="flex flex-col gap-6">
      {activeCategories.map((cat) => {
        
        // --- 1. RENDER KATEGORI MATERI SPESIFIK ---
        if (type === 'MATERIALS') {
          const hasData = activeGroupsAll.some(g => {
            const cell = matrix.get(Number(cat.id))?.get(Number(g.id));
            return cell?.materials && cell.materials.length > 0;
          });

          if (!hasData) return null;

          return (
            <div key={cat.id} className="rounded-2xl border border-stroke bg-white p-5 shadow-1 dark:border-strokedark dark:bg-boxdark">
              <h4 className="text-base font-black text-primary border-b pb-2 mb-4 uppercase tracking-tight">{cat.name}</h4>
              
              {materialCategories.map(matCat => {
                 const groupsWithNotes = activeGroupsAll.map(g => {
                    const cell = matrix.get(Number(cat.id))?.get(Number(g.id));
                    const relevantMats = cell?.materials.filter(m => String(m.material_category_id) === String(matCat.id)) || [];
                    return { group: g, materials: relevantMats };
                 }).filter(item => item.materials.length > 0);

                 if (groupsWithNotes.length === 0) return null;

                 return (
                    <div key={matCat.id} className="mb-6 last:mb-0 pl-4 border-l-4 border-primary/20">
                       <h5 className="font-extrabold text-black dark:text-white mb-3 uppercase text-xs tracking-wider">
                          {matCat.name}
                       </h5>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {groupsWithNotes.map(item => (
                             <div key={item.group.id} className="bg-gray-50 dark:bg-meta-4 p-3.5 rounded-xl border border-stroke dark:border-strokedark text-xs">
                                <span className="font-black block mb-2 text-primary">{item.group.name}</span>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                                   {item.materials.map((m, idx) => (
                                      <li key={idx} className="leading-relaxed">
                                         {m.evaluation_note || "-"}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                          ))}
                       </div>
                    </div>
                 )
              })}
            </div>
          );
        }

        // --- 2. RENDER ESAI DESKRIPTIF (KENDALA, SOLUSI, DAN SUKSES) ---
        const getData = (gId: number) => {
            const cell = matrix.get(Number(cat.id))?.get(Number(gId));
            if (type === 'CHALLENGES') return cell?.challenges;
            if (type === 'SOLUTIONS') return cell?.solutions;
            if (type === 'SUCCESS') return cell?.success_notes;
            if (type === 'ACHIEVEMENT') return (cell as any)?.achievement_notes || cell?.success_notes || "";
            return "";
        };

        const activeGroups = activeGroupsAll.filter(g => {
            const txt = getData(Number(g.id));
            return txt && txt.trim().length > 0;
        });

        if (activeGroups.length === 0) return null;

        return (
          <div key={cat.id} className="rounded-2xl border border-stroke bg-white p-5 shadow-1 dark:border-strokedark dark:bg-boxdark">
            <h4 className="text-base font-black text-primary border-b pb-2 mb-4 uppercase tracking-tight">{cat.name}</h4>
            <div className="grid grid-cols-1 gap-3">
              {activeGroups.map(g => (
                <div key={g.id} className="flex gap-4 items-start border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                   <div className="min-w-[130px] font-black text-[10px] bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-350 px-2.5 py-1.5 rounded-xl text-center uppercase tracking-wider">
                      {g.name}
                   </div>
                   <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-grow pt-1 font-medium leading-relaxed">
                      {getData(Number(g.id))}
                   </p>
                </div>
              ))}
            </div>
          </div>
        );

      })}
    </div>
  );
}