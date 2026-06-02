"use client";

import { VillageDetailContext } from "@/lib/types/report.types";
import { FaCheckCircle, FaCircle } from "react-icons/fa";

type SectionType = 'MATERIALS' | 'CHALLENGES' | 'SOLUTIONS' | 'SUCCESS' | 'ACHIEVEMENT';

export function VillageDescriptiveSection({ 
  context, 
  type 
}: { 
  context: VillageDetailContext; 
  type: SectionType; 
}) {
  const { categories, groups, materialCategories, matrix } = context;

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat: any) => {
        // --- LOGIKA RENDER MATERI (KOMPLEKS) ---
        if (type === 'MATERIALS') {
          // Kumpulkan semua materi unik yang ada di kategori ini dari semua grup
          // Struktur Map: MaterialCatId -> MaterialId -> List of {GroupName, Note}
          // Karena struktur raw_data agak dinamis, kita simplifikasi:
          // Kelompokkan per 'Material Category' (Aqidah, Fiqih) -> Lalu list per Grup
          
          const hasData = groups.some((g: any) => {
            const cell = matrix.get(cat.id)?.get(g.id);
            return cell?.materials && cell.materials.length > 0;
          });

          if (!hasData) return null;

          return (
            <div key={cat.id} className="rounded-lg border border-stroke bg-white p-5 shadow-1 dark:border-strokedark dark:bg-boxdark">
              <h4 className="text-lg font-bold text-primary mb-4 border-b pb-2">{cat.name}</h4>
              
              {/* Loop Material Categories (Master Data) */}
              {materialCategories.map(matCat => {
                 // Cari grup yang punya catatan di Kategori Materi ini
                 const groupsWithNotes = groups.map((g: any) => {
                    const cell = matrix.get(cat.id)?.get(g.id);
                    // Filter materials yg punya material_category_id sama dengan matCat.id
                    const relevantMats = cell?.materials.filter(m => String(m.material_category_id) === String(matCat.id)) || [];
                    return { group: g, materials: relevantMats };
                 }).filter(item => item.materials.length > 0);

                 if (groupsWithNotes.length === 0) return null;

                 return (
                    <div key={matCat.id} className="mb-6 last:mb-0 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                       <h5 className="font-semibold text-black dark:text-white mb-3 uppercase text-sm tracking-wide">
                          {matCat.name}
                       </h5>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupsWithNotes.map(item => (
                             <div key={item.group.id} className="bg-gray-50 dark:bg-meta-4 p-3 rounded text-sm">
                                <span className="font-bold block mb-1 text-primary">{item.group.name}</span>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                                   {item.materials.map((m, idx) => (
                                      <li key={idx} className="mb-1">
                                         {/* Kita butuh nama materi, tapi di EvaluationEntry cuma ada ID. 
                                             Idealnya service juga me-return map MaterialId->Name. 
                                             Disini kita tampilkan note-nya saja atau ID sementara */}
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

        // --- LOGIKA RENDER ESAI (TANTANGAN/SOLUSI/SUKSES) ---
        // Ambil data field yang sesuai
        const getData = (gId: number) => {
            const cell = matrix.get(cat.id)?.get(gId);
            if (type === 'ACHIEVEMENT') return cell?.achievement;
            if (type === 'CHALLENGES') return cell?.challenges;
            if (type === 'SOLUTIONS') return cell?.solutions;
            if (type === 'SUCCESS') return cell?.success_notes;
            return "";
        };

        // Filter grup yang punya isi
        const activeGroups = groups.filter((g: any) => {
            const txt = getData(g.id);
            return txt && txt.trim().length > 0;
        });

        if (activeGroups.length === 0) return null;

        return (
          <div key={cat.id} className="rounded-lg border border-stroke bg-white p-5 shadow-1 dark:border-strokedark dark:bg-boxdark">
            <h4 className="text-lg font-bold text-primary mb-4 border-b pb-2">{cat.name}</h4>
            <div className="grid grid-cols-1 gap-3">
              {activeGroups.map((g: any) => (
                <div key={g.id} className="flex gap-3 items-start">
                   <div className="min-w-[120px] font-bold text-sm bg-gray-100 dark:bg-meta-4 px-2 py-1 rounded text-center">
                      {g.name}
                   </div>
                   <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-grow pt-1">
                      {getData(g.id)}
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