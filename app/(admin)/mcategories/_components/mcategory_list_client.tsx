"use client";

import { MaterialCategoryModel } from "@/lib/types/master.types";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEdit, FaTrashAlt, FaLayerGroup } from "react-icons/fa"; // Menambah ikon kategori
import { deleteCategoryAction } from "../actions";

interface ListProps {
  categories: MaterialCategoryModel[];
}

export function MaterialCategoryListClient({ categories }: ListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) {
      startTransition(async () => {
        setError(null);
        const response = await deleteCategoryAction(id);
        if (!response.success) {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    }
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {categories.length === 0 ? (
        <div className="text-center p-10">
          <p>Belum ada kategori materi yang dibuat.</p>
        </div>
      ) : (
        // [MODIFIKASI] Menggunakan layout grid, bukan tabel
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              
              {/* Header Kartu */}
              <div className="p-4 border-b dark:border-strokedark">
                <span className="text-sm font-medium text-primary flex items-center gap-2">
                  <FaLayerGroup />
                  Kategori
                </span>
                <h3 className="font-semibold text-lg text-black dark:text-white mt-1 truncate">
                  {cat.name}
                </h3>
              </div>

              {/* Body Kartu */}
              <div className="p-4 flex-grow min-h-[80px]">
                <p className="text-sm line-clamp-4">
                  {cat.description || "Tidak ada deskripsi."}
                </p>
              </div>

              {/* Footer Kartu (Aksi) */}
              <div className="p-4 border-t dark:border-strokedark flex justify-end items-center gap-3">
                <Link 
                  href={`/mcategories/edit/${cat.id}`} 
                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                  title="Edit"
                >
                  <FaEdit /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                  title="Hapus"
                >
                  <FaTrashAlt /> Hapus
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}