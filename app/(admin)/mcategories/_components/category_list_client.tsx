"use client";

import { MaterialCategoryModel } from "@/lib/types/master.types";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { deleteCategoryAction } from "../actions";

interface ListProps {
  categories: MaterialCategoryModel[];
}

export function CategoryListClient({ categories }: ListProps) {
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
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white">Nama Kategori</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Deskripsi</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="font-medium">{cat.name}</p>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p>{cat.description?.substring(0, 100) || "-"}</p>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <div className="flex items-center space-x-3.5">
                    <Link href={`/admin/master/kategori-materi/edit/${cat.id}`} className="text-blue-500 hover:text-blue-700">
                      <FaEdit />
                    </Link>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}