"use client";

import { useState, useTransition } from "react";
import InputGroup from "@/components/forms/InputGroup";
import { TextAreaGroup } from "@/components/forms/InputGroup/text-area";
import {
  GroupModel,
  CreateGroupDto,
  VillageModel, // <-- Asumsi VillageModel ada di master.types.ts
} from "@/lib/types/master.types";
import { createGroupAction, updateGroupAction } from "../actions";
import { useRouter } from "next/navigation";

/**
 * Props untuk GroupForm:
 * - 'group': Data kelompok yang ada (untuk mode 'Update').
 * - 'villages': Daftar desa untuk ditampilkan di dropdown.
 * - Jika 'group' null, form akan berada dalam mode 'Create'.
 */
interface GroupFormProps {
  group: GroupModel | null;
  villages: VillageModel[]; // <-- Prop baru untuk daftar desa
}

/**
 * Komponen form ini meniru 'contact-form.tsx' Anda,
 * tetapi menggunakan Server Actions dan state management.
 */
export function GroupForm({ group, villages }: GroupFormProps) { // <-- Terima 'villages'
  const router = useRouter();
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isUpdateMode = group !== null;

  /**
   * Menangani submit form.
   * Dipanggil oleh 'action' pada tag <form>.
   */
  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    // Ambil data dari form
    const groupData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      village_id: formData.get("village_id") as string, // <-- Ambil village_id
    };

    // Validasi
    if (!groupData.name) {
      setError("Nama kelompok wajib diisi.");
      return;
    }
    // --- VALIDASI BARU ---
    if (!groupData.village_id) {
      setError("Desa wajib dipilih.");
      return;
    }
    // --- AKHIR VALIDASI BARU ---

    // Gunakan useTransition untuk 'pending state'
    startTransition(async () => {
      let response;
      if (isUpdateMode) {
        // Mode Update
        response = await updateGroupAction({
          id: String(group.id), // 'id' didapat dari prop
          ...groupData,
        });
      } else {
        // Mode Create
        response = await createGroupAction(groupData as CreateGroupDto);
      }

      // Tampilkan pesan sukses atau error
      if (!response.success) {
        setError(response.error || "Terjadi kesalahan.");
      } else {
        setSuccess(response.message);
        router.push("/group");
      }
    });
  };

  return (
    // Kita gunakan 'action' untuk memanggil handler
    <form id="group-form" action={handleSubmit}>
      <InputGroup
        label="Nama Kelompok"
        type="text"
        name="name" // 'name' penting untuk FormData
        placeholder="Masukkan nama kelompok"
        className="mb-4.5"
        defaultValue={group?.name} // Untuk mode update
        required
      />

      {/* --- DROPDOWN DESA BARU --- */}
      <div className="mb-4.5">
        <label className="mb-2.5 block font-medium text-black dark:text-white">
          Desa
        </label>
        <div className="relative z-20 bg-transparent dark:bg-form-input">
          <select
            name="village_id" // 'name' untuk FormData
            defaultValue={group?.village_id || ""} // Default value
            required
            // Styling meniru InputGroup
            className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          >
            <option value="">Pilih Desa</option>
            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {village.name}
              </option>
            ))}
          </select>
          {/* Ikon panah dropdown */}
          <span className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g opacity="0.8">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                  fill="#637381"
                ></path>
              </g>
            </svg>
          </span>
        </div>
      </div>
      {/* --- AKHIR DROPDOWN DESA --- */}

      <TextAreaGroup
        label="Deskripsi"
        name="description" 
        placeholder="Masukkan deskripsi (opsional)"
        defaultValue={group?.description || ""} // Untuk mode update
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
            ? "Perbarui Kelompok"
            : "Simpan Kelompok Baru"}
      </button>
    </form>
  );
}