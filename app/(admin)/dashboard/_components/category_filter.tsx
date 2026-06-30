"use client";

import { CategoryModel } from "@/lib/types/master.types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  categories: any[];
}

const DEFAULT_ACTIVE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function CategoryFilter({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoriesParam = searchParams.get("categories");
  const isAll = categoriesParam === "all";
  const selectedIds = isAll
    ? categories.map((c) => c.id)
    : categoriesParam
    ? categoriesParam.split(",").map(Number).filter(Boolean)
    : DEFAULT_ACTIVE_IDS;

  const updateFilter = useCallback(
    (ids: number[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length === categories.length) {
        // Jika semua kategori dipilih, set "all"
        params.set("categories", "all");
      } else if (ids.length === 0) {
        params.delete("categories");
      } else {
        params.set("categories", ids.join(","));
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, categories, router]
  );

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      updateFilter(categories.map((c) => c.id));
    } else {
      updateFilter(DEFAULT_ACTIVE_IDS);
    }
  };

  const handleToggleCategory = (id: string, checked: boolean) => {
    const newIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((sid) => sid !== id);
    updateFilter(newIds);
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h4 className="mb-3 text-sm font-semibold text-black dark:text-white">
        Tampilkan Kategori
      </h4>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isAll || selectedIds.length === categories.length}
            onChange={(e) => handleToggleAll(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          Semua
        </label>
        {categories.map((cat) => (
          <label
            key={cat.id}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(cat.id)}
              onChange={(e) => handleToggleCategory(cat.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            {cat.name}
          </label>
        ))}
      </div>
    </div>
  );
}