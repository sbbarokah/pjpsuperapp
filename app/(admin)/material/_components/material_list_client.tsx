"use client";

import { MaterialCategoryModel } from "@/lib/types/master.types";
import { Profile } from "@/lib/types/user.types";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaEdit, FaTrashAlt, FaBookOpen } from "react-icons/fa";
import { deleteMaterialAction } from "../actions";
import { MaterialWithRelations } from "@/lib/types/material.types";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";

interface ListProps {
  materials: MaterialWithRelations[];
  categories: MaterialCategoryModel[]; // Untuk filter
  profile: Profile;
}

export function MaterialListClient({ materials, categories, profile }: ListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canMutate = profile.role === 'superadmin' || profile.role === 'admin_desa';

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
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    router.push(`/admin/materi?${params.toString()}`);
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex justify-end mb-4">
        <div className="w-full max-w-xs">
          <SelectGroupV2
            label="Filter Kategori"
            name="category_filter"
            value={searchParams.get("category") || ""}
            onChange={handleFilterChange}
            options={categories.map(c => ({ value: String(c.id), label: c.name }))}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {materials.length === 0 ? (
        <div className="text-center p-10">
          <p>Tidak ada materi ditemukan untuk kategori ini.</p>
        </div>
      ) : (
        // Ini sudah menggunakan layout grid kartu
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((mat) => (
            <div key={mat.id} className="flex flex-col rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="p-4 border-b dark:border-strokedark">
                <span className="text-sm font-medium text-primary flex items-center gap-2">
                  <FaBookOpen />
                  {mat.material_category?.name || "Tanpa Kategori"}
                </span>
                <h3 className="font-semibold text-lg text-black dark:text-white mt-1 truncate">
                  {mat.material_name}
                </h3>
              </div>
              <div className="p-4 flex-grow min-h-[100px]">
                <p className="text-sm line-clamp-3 mb-2">
                  <strong>Deskripsi:</strong> {mat.description || "-"}
                </p>
                <p className="text-sm line-clamp-3">
                  <strong>Evaluasi:</strong> {mat.evaluation || "-"}
                </p>
              </div>
              {canMutate && (
                <div className="p-4 border-t dark:border-strokedark flex justify-end items-center gap-3">
                  <Link href={`/admin/materi/edit/${mat.id}`} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm">
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}