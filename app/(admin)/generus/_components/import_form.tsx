"use client";

import { useState, useTransition, useRef } from "react";
import * as XLSX from "xlsx"; // Impor SheetJS
import { importGenerusAction } from "../actions";
import { GroupModel } from "@/lib/types/master.types";

// Tipe data untuk admin yang login (diterima dari server component)
type AdminProfile = {
  role: string;
  village_id: string | null;
  group_id: string | null;
};

type ImportFormProps = {
  admin: AdminProfile;
  groups: GroupModel[];
};

export function ImportForm({ admin, groups }: ImportFormProps) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [failures, setFailures] = useState<any[]>([]);
  
  // Ref untuk mereset input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
      setFailures([]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Silakan pilih file untuk diupload.");
      return;
    }

    // Validasi dropdown kelompok untuk admin_desa
    if (admin.role === "admin_desa" && !selectedGroupId) {
      setError("Admin Desa wajib memilih kelompok penempatan.");
      return;
    }

    setError(null);
    setSuccess(null);
    setFailures([]);

    startTransition(() => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setError("File kosong atau format tidak didukung.");
            return;
          }

          // Panggil server action dengan data JSON
          const result = await importGenerusAction(
            jsonData,
            admin,
            selectedGroupId || null, // Kirim group_id yg dipilih
          );

          if (result.success) {
            setSuccess(result.message || "Impor berhasil.");
            if (result.failures && result.failures.length > 0) {
              setFailures(result.failures);
            }
            // Reset form
            setFile(null);
            if(fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            setSelectedGroupId("");
          } else {
            setError(result.error || "Terjadi kesalahan tidak diketahui.");
          }
        } catch (err: any) {
          setError(`Gagal memproses file: ${err.message}`);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const inputClass =
    "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-boxdark-2 dark:text-white dark:focus:border-primary";

  return (
    <div className="flex flex-col gap-5">
      {/* Input File */}
      <div>
        <label className="mb-2.5 block font-medium text-black dark:text-white">
          Pilih File
        </label>
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="w-full rounded-lg border border-stroke bg-transparent p-3 text-black outline-none file:mr-4 file:rounded file:border-none file:bg-primary file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-opacity-90 dark:border-dark-3 dark:bg-boxdark-2 dark:text-white"
        />
      </div>

      {/* [KONDISIONAL] Pilihan Kelompok untuk Admin Desa */}
      {admin.role === "admin_desa" && (
        <div>
          <label
            htmlFor="group_id"
            className="mb-2.5 block font-medium text-black dark:text-white"
          >
            Pilih Kelompok Penempatan
            <span className="text-meta-1">*</span>
          </label>
          <select
            id="group_id"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className={inputClass}
            disabled={isPending}
          >
            <option value="">-- Wajib Pilih Kelompok --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Semua generus di file ini akan dimasukkan ke kelompok yang Anda
            pilih.
          </p>
        </div>
      )}

      {/* Tombol Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !file}
        className="flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-70"
      >
        {isPending ? "Memproses Data..." : "Impor Generus"}
      </button>

      {/* Notifikasi Hasil */}
      {error && (
        <div className="rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
      {success && (
        <div className="rounded border border-green-500 bg-green-100 p-3 text-sm text-green-700">
          <p>{success}</p>
        </div>
      )}
      {failures.length > 0 && (
        <div className="rounded border border-yellow-500 bg-yellow-100 p-3 text-sm text-yellow-700">
          <p>
            <strong>Data berikut gagal diimpor (mungkin email sudah ada):</strong>
          </p>
          <ul className="list-inside list-disc">
            {failures.map((fail, index) => (
              <li key={index}>
                {fail.email}: {fail.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}