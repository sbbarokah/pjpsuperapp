"use client";

import { useState, useTransition, useRef } from "react";
import * as XLSX from "xlsx";
import { importGenerusAction } from "../actions";
import { GroupModel } from "@/lib/types/master.types";
import { cn } from "@/lib/utils";

type AdminProfile = {
  role: string;
  village_id: string | null;
  group_id: string | null;
};

type ImportFormProps = {
  admin: AdminProfile;
  groups: GroupModel[];
};

type ImportMode = "file" | "text";

export function ImportForm({ admin, groups }: ImportFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [failures, setFailures] = useState<any[]>([]);

  // State untuk Tab
  const [importMode, setImportMode] = useState<ImportMode>("file");

  // State untuk Tab 1: File
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk Tab 2: Teks
  const [textInput, setTextInput] = useState("");

  // State untuk Dropdown
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // State untuk accordion template
  const [templateOpen, setTemplateOpen] = useState<boolean>(false);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
    setFailures([]);
  };

  // --- Logika Tab 1: File ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      resetMessages();
    }
  };

  const handleFileSubmit = async () => {
    if (!file) {
      setError("Silakan pilih file untuk diupload.");
      return;
    }
    if (admin.role === "admin_desa" && !selectedGroupId) {
      setError("Admin Desa wajib memilih kelompok penempatan.");
      return;
    }
    resetMessages();

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

          const result = await importGenerusAction(
            jsonData,
            admin,
            selectedGroupId || null,
          );

          if (result.success) {
            setSuccess(result.message || "Impor berhasil.");
            if (result.failures && result.failures.length > 0) {
              setFailures(result.failures);
            }
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
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

  // --- Logika Tab 2: Teks (multi‑data) ---
  const handleTextSubmit = async () => {
    if (!textInput) {
      setError("Silakan masukkan teks data generus.");
      return;
    }
    if (admin.role === "admin_desa" && !selectedGroupId) {
      setError("Admin Desa wajib memilih kelompok penempatan.");
      return;
    }
    resetMessages();

    // Pisahkan berdasarkan baris kosong
    const blocks = textInput.split(/\n\s*\n/).filter(block => block.trim() !== "");
    const parsedArray: any[] = [];

    for (const block of blocks) {
      const parsedData: any = {};
      const lines = block.split("\n");
      for (const line of lines) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim().toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          const knownKeys = [
            'email', 'username', 'full_name', 'gender', 'birth_place',
            'birth_date', 'category_id', 'school_level', 'school_name',
            'father_name', 'father_occupation', 'mother_name',
            'mother_occupation', 'parent_contact'
          ];
          if (knownKeys.includes(key)) {
            parsedData[key] = value;
          }
        }
      }
      if (Object.keys(parsedData).length > 0) {
        parsedArray.push(parsedData);
      }
    }

    if (parsedArray.length === 0) {
      setError("Tidak ada data yang valid. Pastikan format 'key: value' dan pisahkan setiap orang dengan baris kosong.");
      return;
    }

    startTransition(async () => {
      const result = await importGenerusAction(
        parsedArray,
        admin,
        selectedGroupId || null,
      );

      if (result.success) {
        setSuccess(result.message || "Impor berhasil.");
        if (result.failures && result.failures.length > 0) {
          setFailures(result.failures);
        }
        setTextInput("");
        setSelectedGroupId("");
      } else {
        setError(result.error || "Terjadi kesalahan tidak diketahui.");
      }
    });
  };

  const inputClass =
    "w-full rounded-lg border border-stroke bg-transparent py-3 px-5 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-boxdark-2 dark:text-white dark:focus:border-primary";

  const tabButtonClass = (mode: ImportMode) =>
    cn(
      "w-1/2 rounded-lg px-4 py-2 text-sm font-medium",
      importMode === mode
        ? "bg-primary text-white"
        : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-boxdark-2 dark:text-white dark:hover:bg-dark-3",
    );

  return (
    <div className="flex flex-col gap-5">
      {/* --- UI TAB SWITCHER --- */}
      <div className="flex rounded-lg border border-stroke bg-gray-100 p-1 dark:border-dark-3 dark:bg-boxdark">
        <button
          onClick={() => { setImportMode("file"); resetMessages(); }}
          className={tabButtonClass("file")}
        >
          Impor via File
        </button>
        <button
          onClick={() => { setImportMode("text"); resetMessages(); }}
          className={tabButtonClass("text")}
        >
          Impor via Teks
        </button>
      </div>

      {/* --- Pilihan Kelompok (Admin Desa) --- */}
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
            Semua generus yang diimpor akan dimasukkan ke kelompok ini.
          </p>
        </div>
      )}

      {/* --- KONTEN TAB FILE --- */}
      {importMode === "file" && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Pilih File (.xlsx, .xls, .csv)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="w-full rounded-lg border border-stroke bg-transparent p-3 text-black outline-none file:mr-4 file:rounded file:border-none file:bg-primary file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-opacity-90 dark:border-dark-3 dark:bg-boxdark-2 dark:text-white"
            />
          </div>
          <button
            onClick={handleFileSubmit}
            disabled={isPending || !file}
            className="flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-70"
          >
            {isPending ? "Memproses File..." : "Impor dari File"}
          </button>
        </div>
      )}

      {/* --- KONTEN TAB TEKS (dengan ACCORDION TEMPLATE) --- */}
      {importMode === "text" && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Tempel Teks (Salin dari WA/SMS)
            </label>
            <textarea
              rows={15}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Contoh:
full_name: Budi Santoso
email: budi@email.com
username: budi
birth_date: 2005-10-20
...
(untuk banyak data, pisahkan dengan baris kosong)"
              className={inputClass}
              disabled={isPending}
            />
          </div>

          {/* Tombol toggle accordion */}
          <button
            type="button"
            onClick={() => setTemplateOpen(!templateOpen)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("transition-transform", templateOpen ? "rotate-180" : "")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {templateOpen ? "Sembunyikan Template" : "Lihat Template Format"}
          </button>

          {/* Accordion content */}
          {templateOpen && (
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-boxdark-2">
              <h4 className="mb-2 font-semibold text-black dark:text-white">
                Template Format Teks
              </h4>
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                Tulis setiap baris dengan format <code>key: value</code>. Gunakan key yang valid berikut. Untuk mengimpor banyak data, pisahkan setiap orang dengan <strong>baris kosong</strong>.
              </p>
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm">
                <li><code>email</code> – Alamat email</li>
                <li><code>username</code> – Username</li>
                <li><code>full_name</code> – Nama lengkap</li>
                <li><code>gender</code> – Jenis kelamin (L/P)</li>
                <li><code>birth_place</code> – Tempat lahir</li>
                <li><code>birth_date</code> – Tanggal lahir (YYYY-MM-DD)</li>
                <li><code>category_id</code> – ID Kategori (opsional)</li>
                <li><code>school_level</code> – Tingkat sekolah</li>
                <li><code>school_name</code> – Nama sekolah</li>
                <li><code>father_name</code> – Nama ayah</li>
                <li><code>father_occupation</code> – Pekerjaan ayah</li>
                <li><code>mother_name</code> – Nama ibu</li>
                <li><code>mother_occupation</code> – Pekerjaan ibu</li>
                <li><code>parent_contact</code> – Kontak orang tua</li>
              </ul>
              <div className="rounded-lg bg-white p-3 text-sm dark:bg-boxdark">
                <p className="font-medium text-black dark:text-white">Contoh (satu orang):</p>
                <pre className="mt-1 whitespace-pre-wrap text-black dark:text-white">
{`full_name: Budi Santoso
email: budi@email.com
username: budi
birth_date: 2005-10-20
gender: L
birth_place: Jakarta
school_level: SMA
school_name: SMA Negeri 1`}
                </pre>
                <p className="mt-3 font-medium text-black dark:text-white">Contoh (banyak orang, pisahkan dengan baris kosong):</p>
                <pre className="mt-1 whitespace-pre-wrap text-black dark:text-white">
{`full_name: Budi Santoso
email: budi@email.com
username: budi
birth_date: 2005-10-20
gender: L

full_name: Siti Rahayu
email: siti@email.com
username: siti
birth_date: 2006-05-15
gender: P`}
                </pre>
              </div>
            </div>
          )}

          <button
            onClick={handleTextSubmit}
            disabled={isPending || !textInput}
            className="flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-70"
          >
            {isPending ? "Memproses Teks..." : "Impor dari Teks"}
          </button>
        </div>
      )}

      {/* --- Notifikasi Hasil --- */}
      {error && (
        <div className="rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p><strong>Error:</strong> {error}</p>
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
              <li key={index}>{fail.email}: {fail.error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}