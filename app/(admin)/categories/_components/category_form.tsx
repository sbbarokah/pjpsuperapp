"use client";

import { useState, useTransition } from "react";
import InputGroup from "@/components/forms/InputGroup";
import { TextAreaGroup } from "@/components/forms/InputGroup/text-area";
import {
  CategoryModel,
  CreateCategoryDto,
} from "@/lib/types/master.types";
import { createCategoryAction, updateCategoryAction } from "../actions";
import { useRouter } from "next/navigation";

/**
 * Props untuk CategoryForm:
 * - 'category': Data kategori yang ada (untuk mode 'Update').
 * - Jika 'category' null, form akan berada dalam mode 'Create'.
 */
interface CategoryFormProps {
  category: CategoryModel | null;
}

/**
 * Komponen form ini meniru 'contact-form.tsx' Anda,
 * tetapi menggunakan Server Actions dan state management.
 */
export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isUpdateMode = category !== null;

  /**
   * Menangani submit form.
   * Dipanggil oleh 'action' pada tag <form>.
   */
  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    // Ambil data dari form
    const categoryData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };

    // Validasi sederhana
    if (!categoryData.name) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    // Gunakan useTransition untuk 'pending state'
    startTransition(async () => {
      let response;
      if (isUpdateMode) {
        // Mode Update
        response = await updateCategoryAction({
          id: category.id, // 'id' didapat dari prop
          ...categoryData,
        });
      } else {
        // Mode Create
        response = await createCategoryAction(categoryData as CreateCategoryDto);
      }

      // Tampilkan pesan sukses atau error
      if (!response.success) {
        // 'response.error' akan berisi pesan dari 'validateSuperAdmin'
        // cth: "Akses ditolak: Memerlukan hak superadmin."
        setError(response.error || "Terjadi kesalahan.");
      } else {
        setSuccess(response.message);
        router.push("/categories");
        
        // Jika mode 'Create' berhasil, reset form
        // if (!isUpdateMode) {
        //   (document.getElementById("category-form") as HTMLFormElement)?.reset();
        // }
      }
    });
  };

  return (
    // Kita gunakan 'action' untuk memanggil handler
    <form id="category-form" action={handleSubmit}>
      {/* Struktur ini meniru 'contact-form.tsx'
      */}
      <InputGroup
        label="Nama Kategori"
        type="text"
        name="name" // 'name' penting untuk FormData
        placeholder="Masukkan nama kategori"
        className="mb-4.5"
        defaultValue={category?.name} // Untuk mode update
        required
      />

      <TextAreaGroup
        label="Deskripsi"
        name="description" 
        placeholder="Masukkan deskripsi (opsional)"
        defaultValue={category?.description || ""} // Untuk mode update
        className="mb-4.5"
      />

      {/* Tampilkan Pesan Error/Sukses */}
      {error && (
        <div className="my-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="my-4 rounded border border-green-500 bg-green-100 p-3 text-sm text-green-700">
          <p>{success}</p>
        </div>
      )}

      {/* Tombol ini mengambil styling dari 'contact-form.tsx' */}
      <button
        type="submit"
        className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90"
        disabled={isPending}
      >
        {isPending
          ? "Menyimpan..."
          : isUpdateMode
            ? "Perbarui Kategori"
            : "Simpan Kategori Baru"}
      </button>
    </form>
  );
}
