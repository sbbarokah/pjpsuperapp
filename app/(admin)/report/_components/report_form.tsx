"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CategoryModel, GroupModel } from "@/lib/types/master.types";
import { createKbmReportAction } from "../actions";
import { monthOptions } from "@/lib/constants";
import { CreateKbmReportDto } from "@/lib/types/report.types";

type AdminProfile = {
  role: string;
  village_id: string | null;
  group_id: string | null;
};

// --- Tipe Props ---
interface ReportFormProps {
  authorId: string;
  admin: AdminProfile; // <-- [TAMBAH] Terima data admin
  groups: GroupModel[];
  categories: CategoryModel[];
}

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: currentYear, label: String(currentYear) },
  { value: currentYear - 1, label: String(currentYear - 1) },
];

// --- Helper Komponen Form (Konsistensi UI) ---

// 1. InputGroup (untuk Teks dan Angka)
const InputGroup = ({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  required,
  readOnly = false,
  disabled = false,
  step,
  min,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  step?: string;
  min?: string;
}) => (
  <div className="mb-4.5">
    <label className="mb-2.5 block font-medium text-black dark:text-white">
      {label} {required && <span className="text-meta-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
      step={step}
      min={min}
      className={`w-full rounded border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-boxdark-2`}
    />
  </div>
);

// 2. SelectGroup (untuk Dropdown)
const SelectGroup = ({
  label,
  name,
  value,
  onChange,
  required,
  options,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  options: { value: string | number; label: string }[];
}) => (
  <div className="mb-4.5">
    <label className="mb-2.5 block font-medium text-black dark:text-white">
      {label} {required && <span className="text-meta-1">*</span>}
    </label>
    <div className="relative z-20 bg-transparent dark:bg-form-input">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
      >
        <option value="">Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.0001 13.125C9.81258 13.125 9.62508 13.0625 9.46883 12.9062L4.46883 7.90623C4.15633 7.59373 4.15633 7.09373 4.46883 6.78123C4.78133 6.46873 5.28133 6.46873 5.59383 6.78123L10.0001 11.1875L14.4063 6.78123C14.7188 6.46873 15.2188 6.46873 15.5313 6.78123C15.8438 7.09373 15.8438 7.59373 15.5313 7.90623L10.5313 12.9062C10.3751 13.0625 10.1876 13.125 10.0001 13.125Z"
            fill="#637381"
          />
        </svg>
      </span>
    </div>
  </div>
);

// 3. TextAreaGroup (untuk Esai)
const TextAreaGroup = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}) => (
  <div className="mb-4.5">
    <label className="mb-2.5 block font-medium text-black dark:text-white">
      {label}
    </label>
    <textarea
      name={name}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
    />
  </div>
);

// --- State Awal Form ---
const baseInitialState = {
  group_id: "",
  village_id: "",
  period_month: String(new Date().getMonth() + 1), // Default bulan ini
  period_year: String(currentYear), // Default tahun ini
  category_id: "",

  count_male: "0",
  count_female: "0",
  count_total: "0", // Akan dihitung otomatis

  attendance_total_meetings: "0",
  attendance_present_percentage: "0",
  attendance_permission_percentage: "0",
  attendance_absent_percentage: "0",

  achievement_quran_meaning: "",
  achievement_hadith_meaning: "",
  achievement_quran_reading: "",
  achievement_surah_memorization: "",
  achievement_dalil_memorization: "",
  achievement_prayer_memorization: "",
  achievement_tajwid: "",
  achievement_writing: "",
  achievement_asmaul_husna: "",
  achievement_practices: "",
  achievement_character: "",

  program_success_info: "",
  challenges_info: "",
};

// --- Komponen Form Utama ---
export function ReportForm({ authorId, admin, groups, categories }: ReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Gunakan state untuk semua input
  const [formData, setFormData] = useState(() => ({
    ...baseInitialState,
    // Isi village_id berdasarkan admin
    village_id: admin.village_id || "",
    // Isi group_id jika dia admin_kelompok
    group_id: admin.role === "admin_kelompok" ? admin.group_id || "" : "",
  }));


  // Handler untuk semua input
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Efek untuk auto-kalkulasi total
  useEffect(() => {
    const male = parseInt(formData.count_male, 10) || 0;
    const female = parseInt(formData.count_female, 10) || 0;
    setFormData((prev) => ({
      ...prev,
      count_total: String(male + female),
    }));
  }, [formData.count_male, formData.count_female]);

  // Handler untuk submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Konversi state (string) ke payload (number)
    let payload: CreateKbmReportDto;
    try {
      const male = parseInt(formData.count_male, 10);
      const female = parseInt(formData.count_female, 10);
      
      payload = {
        author_user_id: authorId,
        group_id: formData.group_id,
        category_id: formData.category_id,
        village_id: formData.village_id,

        period_month: parseInt(formData.period_month, 10),
        period_year: parseInt(formData.period_year, 10),

        count_male: male,
        count_female: female,
        count_total: male + female, // Hitung ulang di sini untuk keamanan

        attendance_total_meetings: parseInt(formData.attendance_total_meetings, 10) || 0,
        attendance_present_percentage: parseFloat(formData.attendance_present_percentage) || 0,
        attendance_permission_percentage: parseFloat(formData.attendance_permission_percentage) || 0,
        attendance_absent_percentage: parseFloat(formData.attendance_absent_percentage) || 0,

        achievement_quran_meaning: formData.achievement_quran_meaning,
        achievement_hadith_meaning: formData.achievement_hadith_meaning,
        achievement_quran_reading: formData.achievement_quran_reading,
        achievement_writing: formData.achievement_writing,
        achievement_surah_memorization: formData.achievement_surah_memorization,
        achievement_dalil_memorization: formData.achievement_dalil_memorization,
        achievement_prayer_memorization: formData.achievement_prayer_memorization,
        achievement_asmaul_husna: formData.achievement_asmaul_husna,
        achievement_tajwid: formData.achievement_tajwid,
        achievement_practices: formData.achievement_practices,
        achievement_character: formData.achievement_character,

        program_success_info: formData.program_success_info,
        challenges_info: formData.challenges_info,
      };
      
      // Validasi
      if (!payload.group_id) throw new Error("Kelompok wajib diisi.");
      if (!payload.category_id) throw new Error("Jenjang (Kategori) wajib diisi.");

    } catch (parseError: any) {
      setError(`Data tidak valid: ${parseError.message}`);
      return;
    }

    // 2. Kirim ke Server Action
    startTransition(async () => {
      const response = await createKbmReportAction(payload);
      if (!response.success) {
        setError(response.message || "Terjadi kesalahan.");
      } else {
        setSuccess(response.message || "Laporan berhasil disimpan.");
        // Reset form
        setFormData(() => ({
          ...baseInitialState,
          village_id: admin.village_id || "",
          group_id:
            admin.role === "admin_kelompok" ? admin.group_id || "" : "",
        }));
        // Arahkan ke halaman daftar laporan (buat jika perlu)
        router.push("/report"); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* --- Bagian 1: Info Utama Laporan --- */}
      <h4 className="mb-3 text-lg font-semibold">Info Utama Laporan</h4>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SelectGroup
          label="Kelompok"
          name="group_id"
          value={formData.group_id}
          onChange={handleChange}
          required
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
        />
        <SelectGroup
          label="Jenjang (Kategori)"
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectGroup
          label="Periode Bulan"
          name="period_month"
          value={formData.period_month}
          onChange={handleChange}
          required
          options={monthOptions}
        />
        <SelectGroup
          label="Periode Tahun"
          name="period_year"
          value={formData.period_year}
          onChange={handleChange}
          required
          options={yearOptions}
        />
      </div>

      {/* --- Bagian 2: Info Jumlah Generus --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">1. Info Jumlah Generus</h4>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <InputGroup
          label="Laki-laki"
          name="count_male"
          type="number"
          placeholder="Jumlah Laki-laki"
          value={formData.count_male}
          onChange={handleChange}
          required
          min="0"
        />
        <InputGroup
          label="Perempuan"
          name="count_female"
          type="number"
          placeholder="Jumlah Perempuan"
          value={formData.count_female}
          onChange={handleChange}
          required
          min="0"
        />
        <InputGroup
          label="Total"
          name="count_total"
          type="number"
          placeholder="Total"
          value={formData.count_total}
          onChange={() => {}} // Kosongkan onChange
          readOnly
          disabled
        />
      </div>

      {/* --- Bagian 3: Info Presentase Kehadiran --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">2. Info Presentase Kehadiran</h4>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InputGroup
          label="Total Pertemuan"
          name="attendance_total_meetings"
          type="number"
          placeholder="Total Pertemuan"
          value={formData.attendance_total_meetings}
          onChange={handleChange}
          min="0"
        />
        <InputGroup
          label="Hadir (%)"
          name="attendance_present_percentage"
          type="number"
          placeholder="cth: 80.5"
          value={formData.attendance_present_percentage}
          onChange={handleChange}
          step="0.1"
          min="0"
        />
        <InputGroup
          label="Izin (%)"
          name="attendance_permission_percentage"
          type="number"
          placeholder="cth: 10.5"
          value={formData.attendance_permission_percentage}
          onChange={handleChange}
          step="0.1"
          min="0"
        />
        <InputGroup
          label="Alpa (%)"
          name="attendance_absent_percentage"
          type="number"
          placeholder="cth: 9"
          value={formData.attendance_absent_percentage}
          onChange={handleChange}
          step="0.1"
          min="0"
        />
      </div>

      {/* --- Bagian 4: Info Capaian Materi --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">3. Info Capaian Materi</h4>
      <p className="mb-4 text-sm text-gray-600">
        Isi dengan deskripsi
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InputGroup
          label="Makna Al-Qur'an"
          name="achievement_quran_meaning"
          type="text"
          placeholder="Capaian makna Al-Qur'an"
          value={formData.achievement_quran_meaning}
          onChange={handleChange}
        />
        <InputGroup
          label="Makna Al-Hadist"
          name="achievement_hadith_meaning"
          type="text"
          placeholder="Capaian makna Al-Hadist"
          value={formData.achievement_hadith_meaning}
          onChange={handleChange}
        />
        <InputGroup
          label="Bacaan Al-Qur'an / Tilawaty / Iqro"
          name="achievement_quran_reading"
          type="text"
          placeholder="Capaian bacaan Al-Qur'an"
          value={formData.achievement_quran_reading}
          onChange={handleChange}
        />
         <InputGroup
          label="Menulis"
          name="achievement_writing"
          type="text"
          placeholder="Capaian menulis (pegon atau huruf Arab)"
          value={formData.achievement_writing}
          onChange={handleChange}
        />
        <InputGroup
          label="Hafalan Surat"
          name="achievement_surah_memorization"
          type="text"
          placeholder="Capaian hafalan surat"
          value={formData.achievement_surah_memorization}
          onChange={handleChange}
        />
        <InputGroup
          label="Hafalan Dalil"
          name="achievement_dalil_memorization"
          type="text"
          placeholder="Capaian hafalan dalil"
          value={formData.achievement_dalil_memorization}
          onChange={handleChange}
        />
        <InputGroup
          label="Hafalan Do'a"
          name="achievement_prayer_memorization"
          type="text"
          placeholder="Capaian hafalan do'a"
          value={formData.achievement_prayer_memorization}
          onChange={handleChange}
        />
        <InputGroup
          label="Asmaul Husna"
          name="achievement_asmaul_husna"
          type="text"
          placeholder="Capaian Asmaul Husna"
          value={formData.achievement_asmaul_husna}
          onChange={handleChange}
        />
        <InputGroup
          label="Tajwid"
          name="achievement_tajwid"
          type="text"
          placeholder="Capaian tajwid"
          value={formData.achievement_tajwid}
          onChange={handleChange}
        />
        <InputGroup
          label="Praktik Ibadah"
          name="achievement_practices"
          type="text"
          placeholder="Praktik Ibadah"
          value={formData.achievement_practices}
          onChange={handleChange}
        />
        <InputGroup
          label="Akhlaqul Karimah (29 Karakter Luhur)"
          name="achievement_character"
          type="text"
          placeholder="Pembiasaan Akhlaqul Karimah"
          value={formData.achievement_character}
          onChange={handleChange}
        />
      </div>

      {/* --- Bagian 5 & 6: Esai --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">4. Info Keberhasilan Program Generus</h4>
      <TextAreaGroup
        label="Keberhasilan Program"
        name="program_success_info"
        placeholder="Isi dalam bentuk esai atau poin-poin kuantitatif..."
        value={formData.program_success_info}
        onChange={handleChange}
      />
      
      <h4 className="mb-3 mt-6 text-lg font-semibold">5. Info Tantangan/Kendala dan Solusi</h4>
      <TextAreaGroup
        label="Tantangan & Solusi"
        name="challenges_info"
        placeholder="Isi tantangan, kendala, dan solusi yang telah diupayakan..."
        value={formData.challenges_info}
        onChange={handleChange}
      />

      {/* --- Pesan Error/Sukses --- */}
      {error && (
        <div className="my-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="my-4 rounded border border-green-500 bg-green-100 p-3 text-sm text-green-700">
          <p>{success}</p>
        </div>
      )}

      {/* --- Tombol Submit --- */}
      <button
        type="submit"
        className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
        disabled={isPending}
      >
        {isPending ? "Menyimpan Laporan..." : "Simpan Laporan KBM"}
      </button>
    </form>
  );
}