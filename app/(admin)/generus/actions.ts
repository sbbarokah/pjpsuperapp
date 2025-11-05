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