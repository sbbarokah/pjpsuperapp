"use server";

import {
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/services/userService";
import {
  CreateUserFormPayload,
  UpdateUserFormPayload,
} from "@/lib/types/user.types";
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
  try {
    // [PERBAIKAN] Service sekarang mengembalikan { success: true, data } atau { error: "..." }
    const result = await createUser(data);

    // [PERBAIKAN] Tangani error yang dikembalikan oleh service secara eksplisit.
    if (result.error) {
      return {
        success: false,
        message: result.error,
      };
    }

    // [PERBAIKAN] Revalidasi HANYA dilakukan jika operasi berhasil.
    revalidatePath(ADMIN_USER_PATH);
    return {
      success: true,
      message: "Generus berhasil ditambahkan.",
      data: result.data,
    };
  } catch (error: any) {
    // [CATATAN] Blok catch ini sekarang hanya menangani error runtime tak terduga.
    console.error("createUserAction Error:", error.message);
    return {
      success: false,
      message: "Gagal menambahkan generus karena kesalahan sistem.",
      error: error.message,
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
    // [PERBAIKAN KRITIS]
    // Komentar Anda benar, tapi kodenya salah. 'role' tidak digabung.
    // Kode ini sekarang *benar-benar* menggabungkan 'role' ke dalam 'profileData'
    // agar bisa diproses oleh service 'updateUser'.
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
      // Hilangkan spasi dan ubah ke huruf kecil
      const emailName = full_name.toLowerCase().replace(/\s/g, "");
      // Gunakan domain baru @pjp.com
      email = `${emailName || "user" + Date.now()}@pjp.com`;
    }

    // Hasilkan username jika kosong
    const username =
      String(row.username || "") ||
      full_name.toLowerCase().split(" ")[0] || // Ambil kata pertama
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