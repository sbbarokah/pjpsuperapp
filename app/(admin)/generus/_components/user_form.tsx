"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "@/components/forms/InputGroup";
import {
  VillageModel,
  GroupModel,
  CategoryModel,
} from "@/lib/types/master.types";
import {
  Profile,
  CreateUserFormPayload,
  UpdateUserFormPayload,
} from "@/lib/types/user.types";
import { createUserAction, updateUserAction } from "../actions";
import { genderOptions, roleOptions } from "@/lib/constants";

// Tipe data untuk prop 'user' (untuk mode update)
type UserFormUser = Partial<Profile> & { email?: string; user_id: string };

interface UserFormProps {
  admin: Profile;
  user: UserFormUser | null;
  villages: VillageModel[];
  groups: GroupModel[];
  categories: CategoryModel[];
}

export function UserForm({
  admin,
  user,
  villages,
  groups,
  categories,
}: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isUpdateMode = user !== null;

  const isSuperAdmin = admin.role === 'superadmin' || admin.role === 'super_admin';
  const isKelompokAdmin = admin.role === 'admin_kelompok';
  const isDesaAdmin = admin.role === 'admin_desa';

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    // Membaca semua data dari form
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      username: formData.get("username") as string,
      full_name: formData.get("full_name") as string,
      role: formData.get("role") as CreateUserFormPayload["role"],
      gender: formData.get("gender") as "L" | "P",
      birth_place: formData.get("birth_place") as string,
      birth_date: formData.get("birth_date") as string,
      village_id: formData.get("village_id") as string,
      group_id: formData.get("group_id") as string,
      category_id: formData.get("category_id") as string,
      school_level: formData.get("school_level") as string,
      school_name: formData.get("school_name") as string,
      father_name: formData.get("father_name") as string,
      father_occupation: formData.get("father_occupation") as string,
      mother_name: formData.get("mother_name") as string,
      mother_occupation: formData.get("mother_occupation") as string,
      parent_contact: formData.get("parent_contact") as string,
    };

    // Validasi Sederhana
    if (!data.full_name) {
      setError("Nama wajib diisi.");
      return;
    }
    
    // Validasi superadmin
    if (isSuperAdmin) {
       if (!data.email || !data.username) {
        setError("Email dan Username wajib diisi oleh Superadmin.");
        return;
      }
      if (!isUpdateMode && !data.password) {
        setError("Password wajib diisi untuk pengguna baru.");
        return;
      }
      if (!data.role) {
        setError("Role wajib dipilih.");
        return;
      }
    }

    startTransition(async () => {
      let response;
      
      if (isUpdateMode) {
        // Mode Update
        const updatePayload: UpdateUserFormPayload = {
          email: isSuperAdmin ? data.email : undefined, // Hanya superadmin bisa ubah email
          password: (isSuperAdmin && data.password) ? data.password : undefined,
          profileData: {
            username: isSuperAdmin ? data.username : undefined, // Hanya superadmin bisa ubah username
            role: isSuperAdmin ? data.role : undefined, 
            full_name: data.full_name,
            gender: data.gender || null,
            birth_place: data.birth_place || null,
            birth_date: data.birth_date || null,
            village_id: data.village_id || "",
            group_id: data.group_id || "",
            category_id: data.category_id || null,
            school_level: data.school_level || null,
            school_name: data.school_name || null,
            father_name: data.father_name || null,
            father_occupation: data.father_occupation || null,
            mother_name: data.mother_name || null,
            mother_occupation: data.mother_occupation || null,
            parent_contact: data.parent_contact || null,
          },
        };
        response = await updateUserAction(user.user_id, updatePayload);
      } else {
        // Mode Create
        const createPayload: CreateUserFormPayload = {
          // Kirim data akun HANYA jika diisi (oleh superadmin)
          email: data.email || undefined,
          password: data.password || undefined,
          username: data.username || undefined,
          role: data.role || undefined, 
          
          // Kirim data profil
          full_name: data.full_name,
          gender: data.gender || undefined,
          birth_place: data.birth_place || undefined,
          birth_date: data.birth_date || undefined,
          village_id: data.village_id || null,
          group_id: data.group_id || null,
          category_id: data.category_id || null,
          school_level: data.school_level || null,
          school_name: data.school_name || null,
          father_name: data.father_name || null,
          father_occupation: data.father_occupation || null,
          mother_name: data.mother_name || null,
          mother_occupation: data.mother_occupation || null,
          parent_contact: data.parent_contact || null,
        };
        response = await createUserAction(createPayload);
      }

      if (response.error) { // [FIX] Ganti 'success' check ke 'error' check
        setError(response.error || "Terjadi kesalahan.");
      } else {
        setSuccess(response.message || "Data berhasil disimpan.");
        router.push("/generus"); // <-- Arahkan ke halaman daftar user
        router.refresh(); // [FIX] Tambahkan refresh
      }
    });
  };

  /**
   * Helper component untuk Dropdown/Select
   */
  const SelectGroup = ({
    label,
    name,
    defaultValue,
    required,
    options,
  }: {
    label: string;
    name: string;
    defaultValue?: string;
    required?: boolean;
    options: { value: string; label: string }[];
  }) => (
    <div className="mb-4.5">
      <label className="mb-2.5 block font-medium text-black dark:text-white">
        {label} {required && <span className="text-meta-1 text-red">*</span>}
      </label>
      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          name={name}
          defaultValue={defaultValue || ""}
          required={required}
          className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
          <option value="">Pilih {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Ikon panah dropdown */}
        <span className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
          {/* ... (SVG panah dari group_form Anda) ... */}
        </span>
      </div>
    </div>
  );

  return (
    <form id="user-form" action={handleSubmit}>
      {/* Grid untuk layout form yang lebih baik */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Kolom 1 */}
        <div>
          {isSuperAdmin && (
            <>
              <h4 className="mb-3 text-lg font-semibold">Data Akun</h4>
              <InputGroup
                label="Email"
                type="email"
                name="email"
                placeholder="Masukkan email"
                defaultValue={user?.email}
                required
                className="mb-4.5"
              />
              {!isUpdateMode && (
                <InputGroup
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Masukkan password"
                  required
                  className="mb-4.5"
                />
              )}
              <InputGroup
                label="Username"
                type="text"
                name="username"
                placeholder="Masukkan username"
                defaultValue={user?.username}
                required
                className="mb-4.5"
              />
              <SelectGroup
                label="Role"
                name="role"
                defaultValue={user?.role}
                required
                options={roleOptions}
              />
            </>
          )}
          <h4 className="mb-3 text-lg font-semibold">Data Diri</h4>
          <InputGroup
            label="Nama Lengkap"
            type="text"
            name="full_name"
            placeholder="Masukkan nama lengkap"
            defaultValue={user?.full_name}
            required
            className="mb-4.5"
          />
          {/* <InputGroup
            label="Nama Belakang"
            type="text"
            name="last_name"
            placeholder="Masukkan nama belakang (opsional)"
            defaultValue={user?.last_name || ""}
            className="mb-4.5"
          /> */}
          <SelectGroup
            label="Jenis Kelamin"
            name="gender"
            defaultValue={user?.gender}
            required
            options={genderOptions}
          />
          <InputGroup
            label="Tempat Lahir"
            type="text"
            name="birth_place"
            placeholder="Tempat lahir (opsional)"
            defaultValue={user?.birth_place || ""}
            className="mb-4.5"
          />
          <InputGroup
            label="Tanggal Lahir"
            type="date"
            name="birth_date"
            placeholder="Tanggal Lahir"
            defaultValue={user?.birth_date ? user.birth_date.split('T')[0] : ""}
            className="mb-4.5"
          />
        </div>

        {/* Kolom 2 */}
        <div>
          <h4 className="mb-3 text-lg font-semibold">Penempatan & Sekolah</h4>
          <SelectGroup
            label="Desa"
            name="village_id"
            defaultValue={String(user?.village_id || "")}
            options={villages.map((v) => ({ value: String(v.id), label: v.name }))}
          />
          <SelectGroup
            label="Kelompok"
            name="group_id"
            defaultValue={String(user?.group_id || "")}
            options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
          />
          <SelectGroup
            label="Kelas (Kategori)"
            name="category_id"
            defaultValue={user?.category_id || ""}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <InputGroup
            label="Jenjang Sekolah"
            type="text"
            name="school_level"
            placeholder="cth: SD, SMP, SMA (opsional)"
            defaultValue={user?.school_level || ""}
            className="mb-4.5"
          />
          <InputGroup
            label="Nama Sekolah"
            type="text"
            name="school_name"
            placeholder="Nama sekolah (opsional)"
            defaultValue={user?.school_name || ""}
            className="mb-4.5"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 mt-6 text-lg font-semibold">Data Orang Tua</h4>
          <InputGroup
          label="Nama Ayah"
          type="text"
          name="father_name"
          placeholder="Nama ayah (opsional)"
          defaultValue={user?.father_name || ""}
          className="mb-4.5"
        />
          <InputGroup
          label="Pekerjaan Ayah"
          type="text"
          name="father_occupation"
          placeholder="Pekerjaan ayah (opsional)"
          defaultValue={user?.father_occupation || ""}
          className="mb-4.5"
        />
          <InputGroup
          label="Nama Ibu"
          type="text"
          name="mother_name"
          placeholder="Nama ibu (opsional)"
          defaultValue={user?.mother_name || ""}
          className="mb-4.5"
        />
          <InputGroup
          label="Pekerjaan Ibu"
          type="text"
          name="mother_occupation"
          placeholder="Pekerjaan ibu (opsional)"
          defaultValue={user?.mother_occupation || ""}
          className="mb-4.5"
        />
        <InputGroup
          label="Kontak Orang Tua"
          type="text"
          name="parent_contact"
          placeholder="No. HP orang tua (opsional)"
          defaultValue={user?.parent_contact || ""}
          className="mb-4.5"
        />
      </div>

      {/* Pesan Error/Sukses */}
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

      {/* Tombol Submit */}
      <button
        type="submit"
        className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90"
        disabled={isPending}
      >
        {isPending
          ? "Menyimpan..."
          : isUpdateMode
          ? "Perbarui Pengguna"
          : "Simpan Pengguna Baru"}
      </button>
    </form>
  );
}