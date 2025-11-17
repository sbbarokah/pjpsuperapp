"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MaterialCategoryModel } from "@/lib/types/master.types";
import InputGroup from "@/components/forms/InputGroup";
import { TextAreaGroup } from "@/components/forms/InputGroup/text-area";
import { createCategoryAction, updateCategoryAction } from "../actions";

interface CategoryFormProps {
  initialData?: MaterialCategoryModel | null;
}

export function MaterialCategoryForm({ initialData = null }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    
    const payload = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };

    if (!payload.name) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    startTransition(async () => {
      let response;
      if (isEditMode) {
        response = await updateCategoryAction(initialData.id, payload);
      } else {
        response = await createCategoryAction(payload);
      }

      if (!response.success) {
        setError(response.message);
      } else {
        alert(response.message);
        router.push("/admin/master/kategori-materi");
        router.refresh();
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <div className="flex flex-col gap-5.5">
        <InputGroup
          label="Nama Kategori"
          type="text"
          name="name"
          defaultValue={initialData?.name}
          placeholder="cth: Aqidah & Akhlak"
          required
        />
        <TextAreaGroup
          label="Deskripsi (Opsional)"
          name="description"
          defaultValue={initialData?.description || ""}
          placeholder="Penjelasan singkat mengenai kategori ini"
          rows={3}
        />
        
        {error && (
          <div className="rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="flex w-full justify-center rounded-lg bg-primary p-3 font-medium text-white hover:bg-opacity-90"
          disabled={isPending}
        >
          {isPending ? "Menyimpan..." : (isEditMode ? "Perbarui Kategori" : "Simpan Kategori Baru")}
        </button>
      </div>
    </form>
  );
}