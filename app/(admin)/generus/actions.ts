"use server";

import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import {
  createUser,
  updateUser,
  deleteUser,
  getUsersForAdmin,
} from "@/lib/services/userService";
import {
  CreateUserFormPayload,
  UpdateUserFormPayload,
} from "@/lib/types/user.types";
import { getNameFallback } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// [CATATAN] Konsolidasi path. Gunakan ini di semua action.
const ADMIN_USER_PATH = "/generus";

type AdminProfile = {
  role: string;
  village_id: string | null;
  group_id: string | null;
};

/**
 * Server Action untuk membuat pengguna (siswa/admin) baru.
 */
export async function createUserAction(data: CreateUserFormPayload) {
  let adminProfile;
  try {
    // 1. Dapatkan profil admin yang sedang login
    const authData = await getAuthenticatedUserAndProfile();
    adminProfile = authData.profile;
  } catch (authError: any) {
    return { success: false, error: "Otentikasi admin gagal: " + authError.message };
  }

  // 2. Siapkan payload
  const payload = { ...data };
  const isAdminNonSuper = adminProfile.role === 'admin_desa' || adminProfile.role === 'admin_kelompok';
  
  // 3. Terapkan logika auto-generate jika admin BUKAN superadmin
  if (isAdminNonSuper) {
    const full_name = String(payload.full_name || "");

    // Hasilkan email jika tidak ada (meskipun fieldnya disembunyikan)
    if (!payload.email) {
      const emailName = full_name.toLowerCase().replace(/\s/g, "");
      payload.email = `${emailName || "user" + Date.now()}@pjp.com`;
    }

    // Hasilkan username jika tidak ada
    if (!payload.username) {
      payload.username =
        getNameFallback(full_name) ||
        payload.email.split("@")[0];
    }
    
    // Atur password dan role default
    payload.password = "123456";
    payload.role = "user";
    
    // Paksa penempatan (assignment) berdasarkan role admin
    payload.village_id = String(adminProfile.village_id);
    if (adminProfile.role === 'admin_kelompok') {
      payload.group_id = String(adminProfile.group_id);
    }
  } 
  // 4. Validasi untuk Superadmin (jika data tidak ada)
  else if (adminProfile.role === 'superadmin') {
    if (!payload.email) return { success: false, error: "Email wajib diisi oleh Superadmin." };
    if (!payload.password) return { success: false, error: "Password wajib diisi oleh Superadmin." };
    if (!payload.role) return { success: false, error: "Role wajib diisi oleh Superadmin." };
  }

  // 5. Kirim ke service utama
  try {
    // Service 'createUser' akan menangani logika signup Supabase
    const result = await createUser(payload as Required<CreateUserFormPayload>); 

    if (result.error) {
      return { success: false, error: result.error };
    }

    revalidatePath(ADMIN_USER_PATH);

    return {
      success: true,
      message: "Generus berhasil ditambahkan.",
      data: result.data,
    };
  } catch (error: any) {
    console.error("createUserAction Error:", error.message);
    return {
      success: false,
      error: error.message || "Gagal menambahkan generus karena kesalahan sistem.",
    };
  }
}

/**
 * Server Action untuk memperbarui data pengguna (siswa/admin).
 */
export async function updateUserAction(
  userId: string,
  data: UpdateUserFormPayload,
) {
  try {
    const payloadForService: UpdateUserFormPayload = {
      email: data.email,
      profileData: {
        ...data.profileData,
      },
    };

    // Panggil service 'updateUser'
    const result = await updateUser(userId, payloadForService);

    // [PERBAIKAN] Tangani error yang dikembalikan oleh service
    if (result.error) {
      return {
        success: false,
        message: result.error,
      };
    }

    // [PERBAIKAN] Revalidasi HANYA jika berhasil + gunakan path yang konsisten
    revalidatePath(ADMIN_USER_PATH);
    revalidatePath(`${ADMIN_USER_PATH}/${userId}`); // Halaman detail

    return {
      success: true,
      // [PERBAIKAN] Pesan yang salah, ini adalah update, bukan tambah.
      message: "Generus berhasil diperbarui.",
    };
  } catch (error: any) {
    // [PERBAIKAN] Tambahkan blok try...catch untuk konsistensi
    console.error("updateUserAction Error:", error.message);
    return {
      success: false,
      message: "Gagal memperbarui generus karena kesalahan sistem.",
      error: error.message,
    };
  }
}

/**
 * Server Action untuk menghapus pengguna (siswa/admin).
 */
export async function deleteUserAction(userId: string) {
  try {
    const result = await deleteUser(userId);

    // [PERBAIKAN] Tangani error yang dikembalikan oleh service
    if (result.error) {
      return {
        success: false,
        message: result.error,
      };
    }

    // [PERBAIKAN] Revalidasi HANYA jika berhasil + gunakan path yang konsisten
    revalidatePath(ADMIN_USER_PATH);

    return {
      success: true,
      message: "Generus berhasil dihapus.",
    };
  } catch (error: any) {
    // [PERBAIKAN] Tambahkan blok try...catch untuk konsistensi
    console.error("deleteUserAction Error:", error.message);
    return {
      success: false,
      message: "Gagal menghapus generus karena kesalahan sistem.",
      error: error.message,
    };
  }
}

// =================================================================
// === [FILE BARU] FUNGSI IMPOR BULK ===
// =================================================================
/**
 * Server Action untuk memproses impor generus secara massal.
 * Ini akan memvalidasi dan memanggil `createUser` untuk setiap baris.
 */
export async function importGenerusAction(
  rows: any[],
  admin: AdminProfile,
  selectedGroupId: string | null,
) {
  if (!admin) {
    return { success: false, error: "Otorisasi admin tidak valid." };
  }

  let successes = 0;
  const failures = [];
  const usersToCreate: CreateUserFormPayload[] = [];

  // --- 1. Validasi dan Transformasi Data (Sesuai Aturan Anda) ---
  for (const row of rows) {
    const full_name = String(row.full_name || ""); // Pastikan string

    // Hasilkan email jika kosong (Logika baru Anda)
    let email = row.email ? String(row.email) : "";
    if (!email) {
      const emailName = full_name.toLowerCase().replace(/\s/g, "");
      const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 angka acak
      email = `${emailName}${randomSuffix}@pjp.app`;
    }

    // Hasilkan username jika kosong
    const username =
      String(row.username || "") ||
      getNameFallback(full_name) || // <-- Logika baru di sini
      email.split("@")[0];

    // Atur password, role, dan village_id
    const password = "123456";
    const role = "user";
    const village_id = admin.village_id;

    // Tentukan group_id berdasarkan logika Anda
    let group_id: string | null = null;
    if (admin.role === "admin_kelompok") {
      group_id = admin.group_id;
    } else if (admin.role === "admin_desa") {
      group_id = selectedGroupId;
    }

    // Atur category_id, set "0" jika kosong (sesuai permintaan)
    // Pastikan "0" adalah ID yang valid di DB Anda, atau ubah jadi `null`
    const category_id = row.category_id ? String(row.category_id) : "0";
    
    // Tangani format tanggal dari Excel
    let birth_date = row.birth_date || undefined;
    if (birth_date instanceof Date) {
      birth_date = birth_date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    } else if (typeof birth_date === 'string') {
      // Coba parsing jika string (misal, DD/MM/YYYY) - bisa lebih kompleks
      // Untuk saat ini, asumsikan formatnya sudah benar atau YYYY-MM-DD
      // Jika tidak, biarkan apa adanya dan biarkan DB menanganinya
    }

    // Buat payload
    const payload: CreateUserFormPayload = {
      email,
      password,
      username,
      full_name: row.full_name || "",
      role: role as CreateUserFormPayload["role"],
      gender: row.gender || undefined,
      birth_place: row.birth_place || null,
      birth_date: birth_date || null,
      village_id: village_id,
      group_id: group_id,
      category_id: category_id,
      school_level: row.school_level || null,
      school_name: row.school_name || null,
      father_name: row.father_name || null,
      father_occupation: row.father_occupation || null,
      mother_name: row.mother_name || null,
      mother_occupation: row.mother_occupation || null,
      parent_contact: row.parent_contact || null,
    };
    usersToCreate.push(payload);
  }

  // --- 2. Proses Pembuatan User (Satu per Satu) ---
  // Kita panggil `createUser` berulang kali karena ia
  // menangani auth + profile + rollback jika gagal.
  // Ini aman, tapi mungkin lambat untuk 1000+ data.
  for (const userPayload of usersToCreate) {
    try {
      const result = await createUser(userPayload);
      if (result.success) {
        successes++;
      } else {
        failures.push({ email: userPayload.email, error: result.error });
      }
    } catch (error: any) {
      failures.push({ email: userPayload.email, error: error.message });
    }
  }

  // --- 3. Revalidasi dan Kembalikan Hasil ---
  if (successes > 0) {
    revalidatePath(ADMIN_USER_PATH); // Update daftar generus
  }

  return {
    success: true,
    message: `Impor Selesai: ${successes} berhasil, ${failures.length} gagal.`,
    failures: failures,
  };
}

/**
 * Action untuk mengambil data sensus lengkap
 * Diurutkan berdasarkan: Kelompok > Kategori (Kelas) > Nama
 */
export async function getExportDataAction() {
  try {
    // 1. Validasi Admin
    const { profile: adminProfile } = await getAuthenticatedUserAndProfile();
    if (!adminProfile) throw new Error("Profil tidak ditemukan");

    // 2. Ambil data menggunakan service yang sudah ada (menghandle filter by role)
    const users = await getUsersForAdmin(adminProfile);

    // 3. Sorting Data (Kelompok ASC -> Kategori ASC -> Nama ASC)
    const sortedUsers = users.sort((a, b) => {
      // Sort by Group Name
      const groupA = a.group?.name?.toLowerCase() || "zzz"; // "zzz" agar null ditaruh di akhir
      const groupB = b.group?.name?.toLowerCase() || "zzz";
      if (groupA < groupB) return -1;
      if (groupA > groupB) return 1;

      // If Group same, Sort by Category Name
      const catA = a.category?.name?.toLowerCase() || "zzz";
      const catB = b.category?.name?.toLowerCase() || "zzz";
      if (catA < catB) return -1;
      if (catA > catB) return 1;

      // If Category same, Sort by Full Name
      const nameA = a.full_name?.toLowerCase() || "";
      const nameB = b.full_name?.toLowerCase() || "";
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;

      return 0;
    });

    // 4. Flatten data untuk CSV
    const csvData = sortedUsers.map(user => ({
      Nama_Lengkap: user.full_name,
      // Username: user.username,
      // Email: user.email,
      Jenis_Kelamin: user.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      Desa: user.village?.name || "-",
      Kelompok: user.group?.name || "-",
      Kelas: user.category?.name || "-",
      Tempat_Lahir: user.birth_place || "-",
      Tanggal_Lahir: user.birth_date || "-",
      Nama_Ayah: user.father_name || "-",
      // Pekerjaan_Ayah: user.father_occupation || "-",
      Nama_Ibu: user.mother_name || "-",
      // Pekerjaan_Ibu: user.mother_occupation || "-",
      Kontak_Ortu: user.parent_contact ? `'${user.parent_contact}` : "-", // Tambah kutip agar excel membaca sbg string
      Status: user.is_active !== false ? "Aktif" : "Nonaktif"
    }));

    return { success: true, data: csvData };

  } catch (error: any) {
    console.error("Export Error:", error.message);
    return { success: false, message: error.message };
  }
}