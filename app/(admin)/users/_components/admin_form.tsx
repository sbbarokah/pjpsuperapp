"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "@/components/forms/InputGroup";
import { SelectGroup } from "@/components/forms/InputGroup/select-group";
import { VillageModel, GroupModel } from "@/lib/types/master.types";
import { Profile, CreateUserFormPayload, UpdateUserFormPayload } from "@/lib/types/user.types";
// Sesuaikan path import actions Anda jika berbeda
import { createUserAction, updateUserAction } from "../../generus/actions"; 
import { genderOptions } from "@/lib/constants";

// Opsi role khusus untuk form Admin (tanpa role 'user' / 'superadmin')
const adminRoleOptions = [
  { value: "admin_desa", label: "Admin Desa (Bisa Mutasi Data)" },
  { value: "pengurus_desa", label: "Pengurus Desa (Hanya Lihat)" },
  { value: "admin_kelompok", label: "Admin Kelompok (Bisa Mutasi Data)" },
  { value: "pengurus_kelompok", label: "Pengurus Kelompok (Hanya Lihat)" },
];

type UserFormUser = Partial<Profile> & { email?: string; user_id: string };

interface AdminFormProps {
  admin: Profile;
  user: UserFormUser | null;
  villages: VillageModel[];
  groups: GroupModel[];
}

export function AdminForm({ admin, user, villages, groups }: AdminFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State dinamis untuk Role agar bisa menyembunyikan field Kelompok jika tidak perlu
  const [selectedRole, setSelectedRole] = useState(user?.role || "");

  const isUpdateMode = user !== null;
  const isRoleKelompok = selectedRole.includes("kelompok");

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    // Ambil Data dari Form
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    const full_name = formData.get("full_name") as string;
    const role = formData.get("role") as CreateUserFormPayload["role"];
    const gender = formData.get("gender") as "L" | "P";
    const village_id = formData.get("village_id") as string;
    
    // Jika role adalah Admin/Pengurus Desa, group_id dikosongkan (null)
    const group_id = isRoleKelompok ? (formData.get("group_id") as string) : null;

    // Validasi Dasar
    if (!full_name || !email || !username || !role || !gender || !village_id) {
      setError("Mohon lengkapi semua field yang wajib diisi (*).");
      return;
    }
    
    if (!isUpdateMode && !password) {
      setError("Password wajib diisi untuk admin baru.");
      return;
    }

    if (isRoleKelompok && !group_id) {
      setError("Pilih kelompok untuk penugasan role ini.");
      return;
    }

    startTransition(async () => {
      let response;

      if (isUpdateMode) {
        // Mode Update
        const updatePayload: UpdateUserFormPayload = {
          email,
          password: password || undefined,
          profileData: {
            username,
            full_name,
            role,
            gender,
            village_id,
            group_id: group_id || undefined, // Pastikan null jika bukan kelompok
          },
        };
        response = await updateUserAction(user.user_id, updatePayload);
      } else {
        // Mode Create
        const createPayload: CreateUserFormPayload = {
          email,
          password,
          username,
          full_name,
          role,
          gender,
          village_id,
          group_id: group_id || null, // Pastikan null jika bukan kelompok
        };
        response = await createUserAction(createPayload);
      }

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(response.message || "Data admin berhasil disimpan.");
        router.push("/users"); 
        router.refresh(); 
      }
    });
  };

  return (
    <form id="admin-form" action={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        {/* Kolom Kiri: Kredensial Akun */}
        <div className="rounded-md border border-stroke p-5 dark:border-strokedark">
          <h4 className="mb-4 text-lg font-semibold text-primary">Kredensial Akun</h4>
          <InputGroup
            label="Email *"
            type="email"
            name="email"
            placeholder="Masukkan email (untuk login)"
            defaultValue={user?.email}
            required
            className="mb-4.5"
          />
          {!isUpdateMode && (
            <InputGroup
              label="Password *"
              type="password"
              name="password"
              placeholder="Minimal 6 karakter"
              required
              className="mb-4.5"
            />
          )}
          {isUpdateMode && (
             <InputGroup
               label="Password Baru"
               type="password"
               name="password"
               placeholder="Isi jika ingin mereset password"
               className="mb-4.5"
             />
          )}
          <InputGroup
            label="Username *"
            type="text"
            name="username"
            placeholder="Tanpa spasi, unik"
            defaultValue={user?.username}
            required
            className="mb-4.5"
          />
        </div>

        {/* Kolom Kanan: Data Diri & Penempatan */}
        <div className="rounded-md border border-stroke p-5 dark:border-strokedark">
          <h4 className="mb-4 text-lg font-semibold text-primary">Data Diri & Penugasan</h4>
          <InputGroup
            label="Nama Lengkap *"
            type="text"
            name="full_name"
            placeholder="Nama asli pengurus"
            defaultValue={user?.full_name}
            required
            className="mb-4.5"
          />
          <SelectGroup
            label="Jenis Kelamin *"
            name="gender"
            defaultValue={user?.gender}
            required
            options={genderOptions}
          />
          
          <div className="my-4 border-b border-dashed border-stroke dark:border-strokedark"></div>

          <SelectGroup
            label="Role (Hak Akses) *"
            name="role"
            defaultValue={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            required
            options={adminRoleOptions}
          />

          <SelectGroup
            label="Penugasan Desa *"
            name="village_id"
            defaultValue={String(user?.village_id || "")}
            options={villages.map((v) => ({ value: String(v.id), label: v.name }))}
            required
          />

          {/* Kolom ini hanya muncul jika role mengandung kata 'kelompok' */}
          {isRoleKelompok && (
            <SelectGroup
              label="Penugasan Kelompok *"
              name="group_id"
              defaultValue={String(user?.group_id || "")}
              options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
              required
            />
          )}
        </div>
      </div>

      {/* Notifikasi */}
      {error && (
        <div className="my-6 rounded border border-red-500 bg-red-100 p-4 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="my-6 rounded border border-green-500 bg-green-100 p-4 text-sm text-green-700 font-medium">
          ✅ {success}
        </div>
      )}

      {/* Tombol Simpan */}
      <button
        type="submit"
        className="mt-6 flex w-full justify-center rounded-lg bg-indigo-600 p-[13px] font-medium text-white hover:bg-opacity-90 transition-all disabled:opacity-50"
        disabled={isPending}
      >
        {isPending
          ? "Menyimpan Data..."
          : isUpdateMode
          ? "Simpan Perubahan"
          : "Tambahkan Admin Baru"}
      </button>
    </form>
  );
}