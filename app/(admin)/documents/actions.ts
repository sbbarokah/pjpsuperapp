"use server";

import { createClient } from "@/lib/supabase/server_user";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { DocumentModel, DocumentType } from "@/lib/types/document.types";
import { revalidatePath } from "next/cache";

const BUCKET_NAME = "documents";
const FILE_PATH = "public/uploads";
const ADMIN_DOCUMENT_PATH = "/documents";

type ActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

// Helper untuk membuat path file yang unik
const createUniqueFilePath = (filename: string) => {
  const fileExt = filename.split('.').pop();
  const uniqueName = `${crypto.randomUUID()}.${fileExt}`;
  return `${FILE_PATH}/${uniqueName}`;
};

/**
 * Membuat Berkas baru (File atau Link)
 */
export async function createDocumentAction(
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (authError: any) {
    return { success: false, message: "Akses ditolak.", error: authError.message };
  }

  // [MODIFIKASI] Pemeriksaan Keamanan di Sisi Server
  const canCreate = profile.role === 'superadmin' || profile.role === 'admin_desa';
  if (!canCreate) {
    return { 
      success: false, 
      message: "Akses ditolak: Anda tidak memiliki izin untuk membuat berkas.", 
      error: "Unauthorized role" 
    };
  }

  const docType = formData.get("document_type") as DocumentType;
  const file = formData.get("file_upload") as File | null;

  const dataToInsert: Omit<DocumentModel, "id" | "created_at"> = {
    author_user_id: profile.user_id,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    document_type: docType,
    // [MODIFIKASI] Admin Desa akan otomatis mengisi village_id
    village_id: Number(formData.get("village_id")) || (profile.role === 'admin_desa' ? profile.village_id : null),
    group_id: Number(formData.get("group_id")) || null,
  };

  // Validasi dasar
  if (!dataToInsert.title) {
    return { success: false, message: "Judul berkas wajib diisi." };
  }
  if (!docType) {
    return { success: false, message: "Tipe berkas wajib dipilih." };
  }
  
  if (docType === 'LINK') {
    // --- Logika untuk LINK ---
    dataToInsert.external_url = formData.get("external_url") as string;
    if (!dataToInsert.external_url) {
      return { success: false, message: "URL wajib diisi untuk tipe Link." };
    }
    
  } else if (docType === 'FILE') {
    // --- Logika untuk FILE ---
    if (!file || file.size === 0) {
      return { success: false, message: "File wajib diunggah untuk tipe File." };
    }
    
    const filePath = createUniqueFilePath(file.name);
    
    // 1. Upload ke Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (storageError) {
      console.error("Storage Error:", storageError);
      return { success: false, message: "Gagal mengunggah file.", error: storageError.message };
    }
    
    // 2. Isi data file
    dataToInsert.file_path = filePath;
    dataToInsert.file_type = file.type;
    dataToInsert.file_size = file.size;
  }

  // 3. Masukkan metadata ke Database
  const { error: dbError } = await supabase
    .from("documents")
    .insert(dataToInsert);

  if (dbError) {
    console.error("Database Error:", dbError);
    // TODO: Hapus file dari storage jika DB insert gagal (rollback)
    return { success: false, message: "Gagal menyimpan data berkas.", error: dbError.message };
  }

  revalidatePath(ADMIN_DOCUMENT_PATH);
  return { success: true, message: "Berkas berhasil disimpan." };
}

/**
 * [BARU] Memperbarui Berkas (File atau Link)
 */
export async function updateDocumentAction(
  docId: string,
  existingFilePath: string | null | undefined, // Path file lama
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (authError: any) {
    return { success: false, message: "Akses ditolak.", error: authError.message };
  }

  // 1. Validasi Keamanan
  const canUpdate = profile.role === 'superadmin' || profile.role === 'admin_desa';
  if (!canUpdate) {
    return { 
      success: false, 
      message: "Akses ditolak: Anda tidak memiliki izin untuk memperbarui berkas.", 
      error: "Unauthorized role" 
    };
  }

  const docType = formData.get("document_type") as DocumentType;
  const file = formData.get("file_upload") as File | null;

  const dataToUpdate: Partial<DocumentModel> = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    document_type: docType,
    village_id: Number(formData.get("village_id")) || (profile.role === 'admin_desa' ? profile.village_id : null),
    group_id: Number(formData.get("group_id")) || null,
  };

  // 2. Validasi Form
  if (!dataToUpdate.title) {
    return { success: false, message: "Judul wajib diisi." };
  }
  if (!docType) {
    return { success: false, message: "Tipe berkas wajib dipilih." };
  }
  
  if (docType === 'LINK') {
    // --- Logika untuk LINK ---
    dataToUpdate.external_url = formData.get("external_url") as string;
    if (!dataToUpdate.external_url) {
      return { success: false, message: "URL wajib diisi untuk tipe Link." };
    }
    // Hapus info file lama jika beralih dari File ke Link
    dataToUpdate.file_path = null;
    dataToUpdate.file_type = null;
    dataToUpdate.file_size = null;

  } else if (docType === 'FILE') {
    // --- Logika untuk FILE ---
    dataToUpdate.external_url = null; // Hapus info link lama
    
    // Cek jika file baru diunggah
    if (file && file.size > 0) {
      const newFilePath = createUniqueFilePath(file.name);
      
      // 2a. Upload file baru
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(newFilePath, file);

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        return { success: false, message: "Gagal mengunggah file baru.", error: uploadError.message };
      }
      
      // 2b. Set data file baru
      dataToUpdate.file_path = newFilePath;
      dataToUpdate.file_type = file.type;
      dataToUpdate.file_size = file.size;
    }
    // Jika tidak ada file baru, kita biarkan file_path lama (tidak mengubah dataToUpdate)
  }

  // 3. Update metadata di Database
  const { error: dbError } = await supabase
    .from("documents")
    .update(dataToUpdate)
    .eq("id", docId);

  if (dbError) {
    console.error("Database Error:", dbError);
    return { success: false, message: "Gagal memperbarui data berkas.", error: dbError.message };
  }

  // 4. [PENTING] Hapus file LAMA jika:
  //    - Berubah dari Tipe File -> Link
  //    - Mengunggah file baru (menggantikan yang lama)
  const oldFilePath = existingFilePath;
  const newFilePath = dataToUpdate.file_path; // 'undefined' jika file tidak diubah

  if (oldFilePath && (docType === 'LINK' || (docType === 'FILE' && newFilePath && newFilePath !== oldFilePath))) {
    const { error: deleteOldError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([oldFilePath]);
    
    if (deleteOldError) {
      // Jangan gagalkan seluruh operasi, tapi catat errornya
      console.error("Gagal menghapus file lama:", deleteOldError.message);
    }
  }

  revalidatePath(ADMIN_DOCUMENT_PATH);
  revalidatePath(`${ADMIN_DOCUMENT_PATH}/edit/${docId}`);
  return { success: true, message: "Berkas berhasil diperbarui." };
}

/**
 * Menghapus Berkas (File atau Link)
 * Membutuhkan 'doc' lengkap untuk mendapatkan file_path
 */
export async function deleteDocumentAction(
  doc: DocumentModel
): Promise<ActionResponse> {
  const supabase = await createClient();
  
  // [MODIFIKASI] Tambahkan pemeriksaan keamanan sebelum menghapus
  let profile;
  try {
    profile = (await getAuthenticatedUserAndProfile()).profile;
  } catch (authError: any) {
    return { success: false, message: "Akses ditolak.", error: authError.message };
  }

  const canDelete =
    profile.role === 'superadmin' ||
    (profile.role === 'admin_desa' && profile.village_id === doc.village_id) ||
    profile.user_id === doc.author_user_id;
    
  if (!canDelete) {
    return { 
      success: false, 
      message: "Akses ditolak: Anda tidak memiliki izin untuk menghapus berkas ini.", 
      error: "Unauthorized" 
    };
  }
  // --- Akhir pemeriksaan keamanan ---

  // 1. Hapus file dari Storage (jika ada)
  if (doc.document_type === 'FILE' && doc.file_path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([doc.file_path]);
      
    if (storageError) {
      console.error("Storage Delete Error:", storageError);
      return { success: false, message: "Gagal menghapus file dari storage.", error: storageError.message };
    }
  }

  // 2. Hapus data dari Database
  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", doc.id);

  if (dbError) {
    console.error("Database Delete Error:", dbError);
    return { success: false, message: "Gagal menghapus data berkas.", error: dbError.message };
  }

  revalidatePath(ADMIN_DOCUMENT_PATH);
  return { success: true, message: "Berkas berhasil dihapus." };
}