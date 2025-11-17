"use client";

import { DocumentWithRelations } from "@/lib/types/document.types";
import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import { deleteDocumentAction } from "../actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types/user.types";
import { 
  FaLink, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFileAlt, 
  FaEdit, 
  FaTrashAlt,
  FaCalendarAlt,
  FaUser,
  FaUsers
} from "react-icons/fa";
import { IoSearch } from "react-icons/io5";

interface DocumentCardListProps {
  documents: DocumentWithRelations[];
  profile: Profile;
}

/**
 * [BARU] Helper untuk memilih ikon file yang tepat
 */
const GetFileIcon = ({ type, mime }: { type: string, mime?: string | null }) => {
  if (type === 'LINK') {
    return <FaLink className="h-5 w-5 text-blue-500" />;
  }
  if (mime === 'application/pdf') {
    return <FaFilePdf className="h-5 w-5 text-red-500" />;
  }
  if (mime?.includes('word')) {
    return <FaFileWord className="h-5 w-5 text-blue-700" />;
  }
  if (mime?.includes('excel') || mime?.includes('spreadsheet')) {
    return <FaFileExcel className="h-5 w-5 text-green-700" />;
  }
  return <FaFileAlt className="h-5 w-5 text-gray-500" />;
};

/**
 * [BARU] Komponen Kartu Berkas
 */
const DocumentCard = ({
  doc,
  href,
  target,
  download,
  canEdit,
  canDelete,
  onDelete,
}: {
  doc: DocumentWithRelations;
  href: string;
  target: string;
  download?: string;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) => (
  <div className="flex flex-col justify-between rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
    {/* Bagian Header Kartu */}
    <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
      <div className="flex items-center gap-2">
        <GetFileIcon type={doc.document_type} mime={doc.file_type} />
        <span className="text-sm font-medium uppercase text-gray-600 dark:text-gray-400">
          {doc.document_type}
        </span>
      </div>
      
      {/* Tombol Aksi (Edit/Hapus) */}
      <div className="flex items-center gap-3">
        {canEdit && (
          <Link 
            href={`/admin/berkas/edit/${doc.id}`} 
            className="text-blue-500 hover:text-blue-700" 
            title="Edit Berkas"
          >
            <FaEdit />
          </Link>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
            title="Hapus Berkas"
          >
            <FaTrashAlt />
          </button>
        )}
      </div>
    </div>

    {/* Bagian Konten Utama (Klik-able) */}
    <a
      href={href}
      target={target}
      rel="noopener noreferrer"
      download={download} // Atribut download akan ditambahkan jika bukan PDF/Link
      className="flex-grow p-4 hover:bg-gray-100 dark:hover:bg-gray-dark-2 transition-colors"
      title={href === "#" ? "Memuat..." : (download ? "Download File" : "Buka Tautan")}
    >
      <h3 className="font-semibold text-lg text-black dark:text-white mb-2 truncate">
        {doc.title}
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
        {doc.description || "Tidak ada deskripsi."}
      </p>
    </a>

    {/* Bagian Footer (Metadata) */}
    <div className="p-4 border-t border-stroke dark:border-strokedark text-xs text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-2 mb-2">
        <FaUser />
        <span>Dibuat oleh: {doc.author?.full_name || "N/A"}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <FaCalendarAlt />
        <span>{format(new Date(doc.created_at), "d MMMM yyyy", { locale: id })}</span>
      </div>
      <div className="flex items-center gap-2">
        <FaUsers />
        <span>Scope: {doc.group?.name || doc.village?.name || "Global"}</span>
      </div>
    </div>
  </div>
);


export function DocumentCardList({ documents, profile }: DocumentCardListProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const isSuperAdmin = profile.role === 'superadmin';
  const isDesaAdmin = profile.role === 'admin_desa';

  // Buat signed URLS untuk file
  useEffect(() => {
    const getSignedUrls = async () => {
      const urls: Record<string, string> = {};
      const fileDocs = documents.filter(d => d.document_type === 'FILE' && d.file_path);
      
      if (fileDocs.length === 0) return;

      const paths = fileDocs.map(doc => doc.file_path!);
      
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrls(paths, 60 * 5); // 5 menit expiry

      if (error) {
        console.error("Gagal membuat signed URL:", error);
        return;
      }

      for (const item of data) {
        const doc = fileDocs.find(d => d.file_path === item.path);
        if (doc && item.signedUrl) {
          urls[doc.id] = item.signedUrl;
        }
      }
      setDownloadUrls(urls);
    };

    getSignedUrls();
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

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) {
      return documents;
    }
    const query = searchQuery.toLowerCase();
    return documents.filter(doc => {
      return (
        doc.title.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        (doc.author?.full_name && doc.author.full_name.toLowerCase().includes(query)) ||
        (doc.group?.name && doc.group.name.toLowerCase().includes(query)) ||
        (doc.village?.name && doc.village.name.toLowerCase().includes(query))
      );
    });
  }, [documents, searchQuery]);

  const searchBar = (
    <div className="relative w-full mb-6">
      <input
        type="search"
        placeholder="Cari judul, deskripsi, pembuat, kelompok..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex w-full items-center gap-3.5 rounded-full border border-stroke bg-white py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
      />
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">
        <IoSearch className="w-5 h-5" />
      </span>
    </div>
  );

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
    <div>
      {searchBar}

      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {filteredDocuments.length === 0 && searchQuery ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <h3 className="text-lg font-medium text-black dark:text-white">
            Tidak Ditemukan
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tidak ada berkas yang cocok dengan pencarian "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocuments.map((doc) => {
            const canEdit = isSuperAdmin || (isDesaAdmin && profile.village_id === doc.village_id);
            const canDelete = canEdit || profile.user_id === doc.author_user_id;

            // Logika Klik/Download
            const isLink = doc.document_type === 'LINK';
            const isPdf = doc.file_type === 'application/pdf';
            const url = downloadUrls[doc.id];

            let href = "#";
            let target = "_self";
            let download: string | undefined = undefined;

            if (isLink) {
              href = doc.external_url || "#";
              target = "_blank";
            } else if (doc.document_type === 'FILE' && url) {
              href = url;
              if (isPdf) {
                target = "_blank";
              } else {
                target = "_self"; 
                download = doc.title.replace(/[^a-z0-9.]/gi, '_') || "download";
              }
            }

            return (
              <DocumentCard
                key={doc.id}
                doc={doc}
                href={href}
                target={target}
                download={download}
                canEdit={canEdit}
                canDelete={canDelete}
                onDelete={() => handleDelete(doc)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}