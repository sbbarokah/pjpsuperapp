"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";

interface UpdateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { user_id: string; full_name?: string | null; username: string } | null;
  categories: string[];
  onConfirm: (userId: string, newCategoryName: string) => Promise<{ success: boolean; message: string }>;
}

export function UpdateCategoryModal({ isOpen, onClose, user, categories, onConfirm }: UpdateCategoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError("Silakan pilih kategori terlebih dahulu.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await onConfirm(user.user_id, selectedCategory);
      if (res.success) {
        onClose();
        setSelectedCategory("");
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Ubah Kategori Kelas
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Mengubah kategori kelas untuk generus: <strong className="text-black dark:text-white">{user.full_name || user.username}</strong>
          </p>

          <div className="mb-4.5">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Pilih Kategori Baru
            </label>
            <div className="relative bg-transparent dark:bg-form-input">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isPending}
                className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary text-black dark:text-white"
              >
                <option value="" className="dark:bg-boxdark">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="dark:bg-boxdark">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded border border-stroke px-4 py-2 font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}