"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategoryModel } from "@/lib/types/master.types";

interface AssignmentProps {
  materialId: string;
  allClass: CategoryModel[];
  currentAssignments: number[];
  onClose: () => void;
  onRefresh: () => void;
}

export function MaterialAssignmentModal({ materialId, allClass, currentAssignments, onClose, onRefresh }: AssignmentProps) {
  const supabase = createClient();
  const [selected, setSelected] = useState<number[]>(currentAssignments);
  const [isPending, startTransition] = useTransition();

  const toggleCategory = (catId: number) => {
    setSelected(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
  };

  const handleSave = async () => {
    startTransition(async () => {
      // 1. Hapus semua assignment lama
      await supabase.from("material_category_assignment").delete().eq("material_id", materialId);

      // 2. Insert assignment baru
      if (selected.length > 0) {
        const toInsert = selected.map(catId => ({ material_id: materialId, category_id: catId }));
        await supabase.from("material_category_assignment").insert(toInsert);
      }

      onRefresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
        <h3 className="mb-4 text-lg font-bold">Pilih Kelas untuk Materi</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {allClass.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(Number(cat.id))}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selected.includes(Number(cat.id)) ? "bg-primary text-white" : "bg-gray-200 dark:bg-strokedark"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm hover:underline">Batal</button>
          <button 
            disabled={isPending}
            onClick={handleSave}
            className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}