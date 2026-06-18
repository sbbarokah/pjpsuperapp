"use client";

import { CategoryModel, MaterialCategoryModel } from "@/lib/types/master.types";
import { Profile } from "@/lib/types/user.types";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaEdit, FaTrashAlt, FaBookOpen, FaLayerGroup } from "react-icons/fa";
import { deleteMaterialAction } from "../actions";
import { MaterialWithRelations } from "@/lib/types/material.types";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";
import { MaterialAssignmentModal } from "./material_assignment_modal";
import { RotateCcw } from "lucide-react";
import { onlyVillageAdminCanMutateData } from "@/lib/utils/rbac";

interface ListProps {
  materials: MaterialWithRelations[];
  categories: MaterialCategoryModel[];
  allClass: CategoryModel[];
  profile: Profile;
}

export function MaterialListClient({ materials, categories, allClass, profile }: ListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const canMutate = onlyVillageAdminCanMutateData(profile.role);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus materi "${name}"?`)) {
      startTransition(async () => {
        setError(null);
        const response = await deleteMaterialAction(id);
        if (!response.success) {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      // Hanya proses jika string kosong atau >= 3 karakter
      if (searchQuery.length === 0 || searchQuery.length >= 3) {
        const params = new URLSearchParams(searchParams);
        
        if (searchQuery) {
          params.set("q", searchQuery);
        } else {
          params.delete("q");
        }
        
        // Mengganti replace agar tidak menambah history browser berlebihan saat mengetik
        router.push(`/material?${params.toString()}`);
      }
    }, 500); // Delay 500ms

    return () => clearTimeout(handler);
  }, [searchQuery, searchParams, router]);
  
  const handleFilterChange = (value: string, type: 'category' | 'class') => {
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set(type === 'category' ? 'category' : 'class', value);
    } else {
      params.delete(type === 'category' ? 'category' : 'class');
    }
    
    router.push(`/material?${params.toString()}`);
  };

  const handleResetFilter = () => {
    setSearchQuery("");
    router.push("/material");
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      
      <div className="flex flex-wrap items-end gap-4 mb-6 p-4 rounded-lg bg-gray-50 dark:bg-boxdark-2/50 border border-stroke dark:border-strokedark transition-all">
  
        {/* Form Pencarian - Disesuaikan agar tingginya sama dengan SelectGroupV2 */}
        <form className="w-full sm:w-80">
          <label className="mb-2.5 block font-medium text-black dark:text-white">Cari Materi</label>
          <input
            type="text"
            placeholder="Cari (min. 3 karakter)..."
            className="w-full rounded border border-stroke bg-transparent px-5 py-3 mb-4.5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Filter Kategori & Kelas */}
        <div className="w-full sm:w-60">
          <SelectGroupV2
            label="Filter Kategori"
            name="category_filter"
            value={searchParams.get("category") || ""}
            onChange={(e) => handleFilterChange(e.target.value, 'category')}
            options={categories.map(c => ({ value: String(c.id), label: c.name }))}
          />
        </div>
        
        <div className="w-full sm:w-60">
          <SelectGroupV2
            label="Filter Kelas"
            name="class_filter"
            value={searchParams.get("class") || ""}
            onChange={(e) => handleFilterChange(e.target.value, 'class')}
            options={allClass.map(c => ({ value: String(c.id), label: c.name }))}
          />
        </div>

        {/* Tombol Reset */}
        {(searchParams.get("category") || searchParams.get("class") || searchParams.get("q")) && (
          <button
            onClick={handleResetFilter}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 mb-4.5 rounded border border-stroke bg-white hover:bg-gray-100 hover:text-danger dark:bg-boxdark dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition font-medium text-sm"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        )}
      </div>

      {showModal && (
        <MaterialAssignmentModal 
          materialId={showModal}
          allClass={allClass}
          currentAssignments={materials.find(m => m.id === showModal)?.material_category_assignment.map(a => Number(a.category?.id)) || []}
          onClose={() => setShowModal(null)}
          onRefresh={() => router.refresh()}
        />
      )}

      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.map((mat) => (
          <div key={mat.id} className="flex flex-col rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="p-4 border-b dark:border-strokedark">
              <span className="text-sm font-medium text-primary flex items-center gap-2">
                <FaBookOpen />
                {mat.material_category?.name || "Tanpa Kategori"}
              </span>
              <h3 className="font-semibold text-lg text-black dark:text-white mt-1">{mat.material_name}</h3>

              <div className="mt-2 flex flex-wrap gap-1">
                {mat.material_category_assignment?.map((assign: any) => (
                  <span key={assign.category.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                    {assign.category.name}
                  </span>
                ))}
              </div>
            </div>
            
            {canMutate && (
              <div className="p-4 border-t dark:border-strokedark flex justify-between items-center gap-3">
                <button 
                  onClick={() => setShowModal(mat.id)}
                  className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 text-sm"
                >
                  <FaLayerGroup /> Assign Kelas
                </button>
                <div className="flex items-center gap-3">
                  <Link href={`/material/edit/${mat.id}`} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm">
                    <FaEdit /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(mat.id, mat.material_name)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                  >
                    <FaTrashAlt /> Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}