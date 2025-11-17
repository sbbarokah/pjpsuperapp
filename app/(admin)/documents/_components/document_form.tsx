"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentModel, DocumentType } from "@/lib/types/document.types";
import { Profile } from "@/lib/types/user.types";
import { GroupModel } from "@/lib/types/master.types";
import { createDocumentAction, updateDocumentAction } from "../actions";
// Asumsi Anda punya komponen form ini
import InputGroup from "@/components/forms/InputGroup";
import { TextAreaGroup } from "@/components/forms/InputGroup/text-area";
import { SelectGroup } from "@/components/forms/InputGroup/select-group";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";

interface DocumentFormProps {
  admin: Profile;
  groups: GroupModel[];
  initialData?: DocumentModel | null;
}

export function DocumentForm({
  admin,
  groups,
  initialData = null,
}: DocumentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!initialData;
  const [docType, setDocType] = useState<DocumentType | "">(
    initialData?.document_type || ""
  );

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    // [PENTING] Validasi sisi klien sederhana
    const title = formData.get("title") as string;
    if (!title) {
      setError("Judul wajib diisi.");
      return;
    }
    if (!docType) {
      setError("Tipe berkas wajib dipilih.");
      return;
    }
    if (docType === 'LINK' && !formData.get("external_url")) {
      setError("URL wajib diisi untuk Tipe Link.");
      return;
    }
    if (docType === 'FILE' && !isEditMode && !(formData.get("file_upload") as File)?.size) {
      setError("File wajib diunggah untuk Tipe File.");
      return;
    }

    startTransition(async () => {
      let response;
      if (isEditMode && initialData) {
        // Panggil update action
        response = await updateDocumentAction(
          initialData.id,
          initialData.file_path, // Kirim path file lama
          formData
        );
      } else {
        // Panggil create action
        response = await createDocumentAction(formData);
      }

      if (response && !response.success) {
        setError(response.message || "Terjadi kesalahan.");
      } else if (response) {
        setSuccess(response.message || "Berkas berhasil disimpan.");
        router.push("/documents");
        router.refresh();
      }
    });
  };
  
  // Hanya superadmin yang bisa melihat/mengubah scope
  const isSuperAdmin = admin.role === 'superadmin';

  return (
    <form action={handleSubmit}>
      <div className="flex flex-col gap-5.5 p-6.5">
        <InputGroup
          label="Judul Berkas"
          type="text"
          name="title"
          defaultValue={initialData?.title || ""}
          placeholder="cth: Panduan KBM 2025"
          required
        />
        
        <TextAreaGroup
          label="Deskripsi (Opsional)"
          name="description"
          defaultValue={initialData?.description || ""}
          placeholder="Deskripsi singkat mengenai isi berkas..."
          rows={3}
        />
        
        {/* Scoping (Penempatan) - Hanya Superadmin yang bisa atur */}
        {isSuperAdmin && (
          <>
            <SelectGroup
              label="Desa (Opsional)"
              name="village_id"
              // Asumsi 'villages' perlu di-pass ke form ini jika superadmin
              // Untuk saat ini, kita tampilkan group saja
              defaultValue={String(initialData?.village_id || "")}
              options={[]} // Ganti dengan daftar desa
            />
            <SelectGroup
              label="Kelompok (Opsional)"
              name="group_id"
              defaultValue={String(initialData?.group_id || "")}
              options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
            />
          </>
        )}
        
        <hr className="my-4"/>

        <SelectGroupV2
          label="Tipe Berkas"
          name="document_type"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocumentType)}
          required
          options={[
            { value: "FILE", label: "Unggah File (PDF, Word, Excel, dll)" },
            { value: "LINK", label: "Tautan Eksternal (Google Drive, dll)" },
          ]}
        />
        
        {/* Input Kondisional */}
        {docType === 'LINK' && (
          <InputGroup
            label="Tautan Eksternal (URL)"
            name="external_url"
            type="url"
            defaultValue={initialData?.external_url || ""}
            placeholder="https://docs.google.com/..."
            required
          />
        )}
        
        {docType === 'FILE' && (
          <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Unggah File
              {isEditMode && " (Kosongkan jika tidak ingin mengubah file)"}
            </label>
            <input
              type="file"
              name="file_upload"
              required={!isEditMode}
              className="w-full rounded border border-stroke bg-transparent px-5 py-3 text-black outline-none transition file:mr-4 file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:rounded file:font-medium file:text-black focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:file:bg-gray-dark dark:file:text-white"
            />
            {isEditMode && initialData?.file_path && (
              <p className="mt-2 text-sm text-gray-600">
                File saat ini: {initialData.file_path.split('/').pop()}
              </p>
            )}
          </div>
        )}

        {/* --- Pesan Error/Sukses --- */}
        {error && (
          <div className="rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700"><p>{error}</p></div>
        )}
        {success && (
          <div className="rounded border border-green-500 bg-green-100 p-3 text-sm text-green-700"><p>{success}</p></div>
        )}

        {/* --- Tombol Submit --- */}
        <button
          type="submit"
          className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90"
          disabled={isPending}
        >
          {isPending
            ? "Menyimpan..."
            : isEditMode
            ? "Perbarui Berkas"
            : "Simpan Berkas Baru"}
        </button>
      </div>
    </form>
  );
}