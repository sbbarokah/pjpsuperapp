// app/generus/edit/[userId]/_components/edit-user-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserAction } from "../actions";
import {
  UpdateUserFormPayload,
  UserAdminView,
} from "@/lib/types/user.types";
import { UserFormMasterData } from "../page";

// Tipe 'user' adalah gabungan dari UserAdminView + email
// Kita bisa gunakan 'any' untuk sementara jika tipe detailnya rumit
// Idealnya, ini adalah tipe yang dikembalikan oleh 'getUserDetails'
type UserDetail = UserAdminView & {
  email: string;
  // tambahkan properti lain dari profile jika ada
};

type EditUserFormProps = {
  user: UserDetail;
  masterData: UserFormMasterData;
};

// Definisikan role, atau ini bisa juga datang dari masterData
const ROLES = [
  { id: "user", name: "Generus (User)" },
  { id: "admin_kelompok", name: "Admin Kelompok" },
  { id: "admin_desa", name: "Admin Desa" },
  { id: "superadmin", name: "Superadmin" },
];

export function EditUserForm({ user, masterData }: EditUserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 1. Inisialisasi state form dengan data 'user' dari props
  const [formData, setFormData] = useState({
    email: user.email || "",
    role: user.role || "user",
    front_name: user.front_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    village_id: user.village_id || "",
    group_id: user.group_id || "",
    category_id: user.category_id || "",
    // Tambahkan field profile lainnya di sini...
    // misal: birth_date, gender, school_name, dll.
  });

  // 2. Handler untuk mengubah state
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. Handler untuk submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Membangun payload sesuai definisi UpdateUserFormPayload
    const payload: UpdateUserFormPayload = {
      email: formData.email,
      profileData: {
        front_name: formData.front_name,
        last_name: formData.last_name,
        username: formData.username,
        role: formData.role, // Pastikan role juga di-update di profile
        village_id: formData.village_id || null,
        group_id: formData.group_id || null,
        category_id: formData.category_id || null,
      },
    };

    startTransition(async () => {
      const result = await updateUserAction(user.user_id, payload);

      if (result.success) {
        alert("Data generus berhasil diperbarui!"); // Ganti dengan toast/notifikasi
        router.push("/generus"); // Kembali ke halaman daftar
      } else {
        setError(result.message || "Terjadi kesalahan saat memperbarui data.");
      }
    });
  };

  // Helper untuk styling input (sesuaikan dengan UI kit Anda)
  const inputClass =
    "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-boxdark-2 dark:text-white dark:focus:border-primary";

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-boxdark-2 dark:bg-boxdark">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Kolom Kiri */}
          <div>
            <label
              htmlFor="email"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label
              htmlFor="front_name"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Nama Depan
            </label>
            <input
              type="text"
              id="front_name"
              name="front_name"
              value={formData.front_name}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Nama Belakang
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Kolom Kanan */}
          <div>
            <label
              htmlFor="role"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Role / Peran
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={inputClass}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="village_id"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Desa
            </label>
            <select
              id="village_id"
              name="village_id"
              value={formData.village_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">-- Pilih Desa --</option>
              {masterData.villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="group_id"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Kelompok
            </label>
            <select
              id="group_id"
              name="group_id"
              value={formData.group_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">-- Pilih Kelompok --</option>
              {masterData.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category_id"
              className="mb-2.5 block font-medium text-black dark:text-white"
            >
              Kategori
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">-- Pilih Kategori --</option>
              {masterData.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Tombol Submit --- */}
        <div className="mt-6">
          {error && <p className="mb-4 text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}