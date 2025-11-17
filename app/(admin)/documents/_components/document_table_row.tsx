"use client";

import { DocumentWithRelations } from "@/lib/types/document.types";
import { useState, useTransition, useEffect } from "react"; // Ditambah useEffect
import Link from "next/link";
import { deleteDocumentAction } from "../actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client"; // Impor Supabase client
import { Profile } from "@/lib/types/user.types"; // Impor tipe Profile

// Ikon sederhana (ganti dengan ikon SVG Anda)
const IconLink = () => <span>&#128279;</span>; // Ikon Link
const IconFile = () => <span>&#128196;</span>; // Ikon File
const IconTrash = () => <span>&#128465;</span>; // Ikon Hapus
const IconEdit = () => <span>&#9998;</span>; // Ikon Edit

interface DocumentTableRowProps {
  documents: DocumentWithRelations[];
  profile: Profile; // [BARU] Menerima profil admin
}

export function DocumentTableRow({ documents, profile }: DocumentTableRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // [BARU] State untuk menyimpan URL download
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const supabase = createClient();

  // [BARU] Tentukan hak akses
  const isSuperAdmin = profile.role === 'superadmin';
  const isDesaAdmin = profile.role === 'admin_desa';

  // [BARU] Buat signed URLS untuk file saat komponen dimuat
  useEffect(() => {
    const getSignedUrls = async () => {
      const urls: Record<string, string> = {};
      const fileDocs = documents.filter(d => d.document_type === 'FILE' && d.file_path);
      
      if (fileDocs.length === 0) return;

      // Ambil path file
      const paths = fileDocs.map(doc => doc.file_path!);
      
      // Buat signed URL sekaligus (lebih efisien)
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrls(paths, 60 * 5); // 5 menit expiry

      if (error) {
        console.error("Gagal membuat signed URL:", error);
        return;
      }

      // Map kembali ke ID dokumen
      for (const item of data) {
        const doc = fileDocs.find(d => d.file_path === item.path);
        if (doc && item.signedUrl) {
          urls[doc.id] = item.signedUrl;
        }
      }
      setDownloadUrls(urls);
    };

    getSignedUrls();
    // Jalankan ulang jika dokumen berubah
  }, [documents, supabase.storage]);


  const handleDelete = (doc: DocumentWithRelations) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus berkas "${doc.title}"?`)) {
      startTransition(async () => {
        setError(null);
        const response = await deleteDocumentAction(doc);
        if (!response.success) {
          setError(response.message);
        }
      });
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Berkas
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Belum ada berkas atau tautan yang ditambahkan.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="px-4 py-4 font-medium text-black dark:text-white">Judul Berkas</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Tipe</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Kelompok/Desa</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Pembuat</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              // Tentukan hak akses per baris
              const canEdit = isSuperAdmin || (isDesaAdmin && profile.village_id === doc.village_id);
              const canDelete = canEdit || profile.user_id === doc.author_user_id;

              // Tentukan target link
              let href = "#";
              let target = "_self";
              if (doc.document_type === 'LINK') {
                href = doc.external_url || "#";
                target = "_blank";
              } else if (doc.document_type === 'FILE' && downloadUrls[doc.id]) {
                href = downloadUrls[doc.id];
                target = "_blank"; // Download/buka di tab baru
              } else if (doc.document_type === 'FILE') {
                href = "#"; // Masih loading URL
              }

              return (
                <tr key={doc.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {/* Admin bisa klik untuk edit, user biasa klik untuk download/view */}
                    {canEdit ? (
                      <Link href={`/documents/edit/${doc.id}`} className="hover:text-primary font-medium">
                        {doc.title}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        target={target}
                        rel="noopener noreferrer"
                        className="font-medium"
                        title={doc.document_type === 'FILE' ? "Download/Buka File" : "Buka Tautan Eksternal"}
                      >
                        {doc.title}
                      </a>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ doc.description? doc.description?.substring(0, 50) + "..." : ""}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <span className="flex items-center gap-2">
                      {doc.document_type === 'LINK' ? <IconLink /> : <IconFile />}
                      {doc.document_type}
                    </span>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {doc.group?.name || doc.village?.name || "Global"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {doc.author?.full_name || "N/A"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {format(new Date(doc.created_at), "d MMM yyyy", { locale: id })}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {/* [MODIFIKASI] Tampilkan aksi berdasarkan hak akses */}
                    <div className="flex items-center gap-3">
                      <a
                        href={href}
                        target={target}
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title={href === "#" ? "Memuat..." : "Lihat/Download"}
                      >
                        Lihat
                      </a>
                      
                      {canEdit && (
                        <Link href={`/documents/edit/${doc.id}`} className="text-blue-500 hover:text-blue-700" title="Edit">
                          <IconEdit />
                        </Link>
                      )}
                      
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Hapus"
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}