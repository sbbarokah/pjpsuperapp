"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MaterialCategoryModel } from "@/lib/types/master.types";
import { MaterialModel } from "@/lib/types/material.types";
import { createMaterialAction, updateMaterialAction } from "../actions";
import { SelectGroup } from "@/components/forms/InputGroup/select-group";
import InputGroup from "@/components/forms/InputGroup";
import { TextAreaGroup } from "@/components/forms/InputGroup/text-area";

interface MaterialFormProps {
  categories: MaterialCategoryModel[];
  initialData?: MaterialModel | null;
}

export function MaterialForm({ categories, initialData = null }: MaterialFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;

  const handleSubmit = (formData: FormData) => {
    setError(null);
    
    const payload = {
      material_name: formData.get("material_name") as string,
      description: formData.get("description") as string,
      evaluation: formData.get("evaluation") as string,
      material_category_id: Number(formData.get("material_category_id")),
    };

    if (!payload.material_name || !payload.material_category_id) {
      setError("Nama materi dan Kategori wajib diisi.");
      return;
    }

    startTransition(async () => {
      let response;
      if (isEditMode) {
        response = await updateMaterialAction(initialData.id, payload);
      } else {
        response = await createMaterialAction(payload);
      }

      if (!response.success) {
        setError(response.message);
      } else {
        alert(response.message);
        router.push("/admin/materi");
        router.refresh();
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <div className="flex flex-col gap-5.5">
        <SelectGroup
          label="Kategori Materi"
          name="material_category_id"
          defaultValue={String(initialData?.material_category_id || "")}
          options={categories.map(c => ({ value: String(c.id), label: c.name }))}
          required
        />
        <InputGroup
          label="Nama Materi"
          type="text"
          name="material_name"
          defaultValue={initialData?.material_name}
          placeholder="cth: Iman Kepada Allah"
          required
        />
        <TextAreaGroup
          label="Deskripsi Materi (Opsional)"
          name="description"
          defaultValue={initialData?.description || ""}
          placeholder="Penjelasan singkat mengenai materi ini"
          rows={5}
        />
        <TextAreaGroup
          label="Evaluasi / Penilaian (Opsional)"
          name="evaluation"
          defaultValue={initialData?.evaluation || ""}
          placeholder="Cara mengevaluasi capaian materi ini, cth: 'Hafal 6 sifat Allah', 'Bisa mempraktikkan wudhu'"
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
          {isPending ? "Menyimpan..." : (isEditMode ? "Perbarui Materi" : "Simpan Materi Baru")}
        </button>
      </div>
    </form>
  );
}