import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Modal untuk menampilkan detail lengkap data Generus
 */
export function UserDetailModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      // Mencegah scroll pada body saat modal terbuka
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !user || !mounted) return null;

  const DetailRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="border-b border-stroke py-3 last:border-0 dark:border-strokedark">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-black dark:text-white">{value || "-"}</p>
    </div>
  );

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-all">
      {/* Overlay untuk menutup saat klik di luar area putih */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-boxdark z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-strokedark">
          <h3 className="text-xl font-bold text-black dark:text-white">Detail Generus</h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            <div className="space-y-1">
              <h4 className="mb-4 text-primary font-bold border-l-4 border-primary pl-3">Informasi Pribadi</h4>
              <DetailRow label="Nama Lengkap" value={user.full_name} />
              <DetailRow label="Username" value={user.username} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Jenis Kelamin" value={user.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
              <DetailRow label="Tempat Lahir" value={user.birth_place} />
              <DetailRow label="Tanggal Lahir" value={user.birth_date} />
            </div>

            <div className="space-y-1 mt-6 md:mt-0">
              <h4 className="mb-4 text-primary font-bold border-l-4 border-primary pl-3">Pendidikan & Keluarga</h4>
              <DetailRow label="Sekolah" value={user.school_name} />
              <DetailRow label="Ayah" value={user.father_name} />
              <DetailRow label="Ibu" value={user.mother_name} />
              <DetailRow label="Kontak Orang Tua" value={user.parent_contact} />
              <DetailRow label="Kelompok" value={user.group?.name} />
              <DetailRow label="Kelas / Kategori" value={user.category?.name} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stroke px-6 py-4 text-right dark:border-strokedark bg-gray-50 dark:bg-meta-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}