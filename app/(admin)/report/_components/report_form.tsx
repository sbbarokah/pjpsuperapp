"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CategoryModel, GroupModel } from "@/lib/types/master.types";
import { createKbmReportAction, updateKbmReportAction } from "../actions";
import { monthOptions } from "@/lib/constants";
import { CreateKbmReportDto, KbmReportModel, UpdateKbmReportDto } from "@/lib/types/report.types";
import { SelectGroup } from "@/components/forms/select_group";
import { InputGroupV2 } from "@/components/forms/input_group_v2";
import { TextAreaGroupV2 } from "@/components/forms/text_area_v2";

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
  initialData?: KbmReportModel | null; 
}

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: currentYear, label: String(currentYear) },
  { value: currentYear - 1, label: String(currentYear - 1) },
];

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

const mapModelToState = (data: KbmReportModel) => {
  const state = { ...baseInitialState };
  // Loop untuk konversi null/undefined ke string kosong dan number ke string
  for (const key in state) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = (data as any)[key];
      if (value !== null && value !== undefined) {
        state[key as keyof typeof state] = String(value);
      }
    }
  }
  return state;
};

// --- Komponen Form Utama ---
export function ReportForm({ authorId, admin, groups, categories, initialData = null }: ReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!initialData;

  // Gunakan state untuk semua input
  const [formData, setFormData] = useState(() => {
    if (isEditMode) {
      // Mode EDIT: Isi form dari initialData
      return mapModelToState(initialData);
    }
    // Mode CREATE: Isi form dari base state + info admin
    return {
      ...baseInitialState,
      village_id: admin.village_id || "",
      group_id: admin.role === "admin_kelompok" ? admin.group_id || "" : "",
    };
  });


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
    let basePayload;
    try {
      const male = parseInt(formData.count_male, 10);
      const female = parseInt(formData.count_female, 10);

      // Ini adalah data umum
      basePayload = {
        group_id: formData.group_id,
        category_id: formData.category_id,
        village_id: formData.village_id,
        period_month: parseInt(formData.period_month, 10),
        period_year: parseInt(formData.period_year, 10),
        count_male: male,
        count_female: female,
        count_total: male + female,
        attendance_total_meetings:
          parseInt(formData.attendance_total_meetings, 10) || 0,
        attendance_present_percentage:
          parseFloat(formData.attendance_present_percentage) || 0,
        attendance_permission_percentage:
          parseFloat(formData.attendance_permission_percentage) || 0,
        attendance_absent_percentage:
          parseFloat(formData.attendance_absent_percentage) || 0,
        achievement_quran_meaning: formData.achievement_quran_meaning,
        achievement_hadith_meaning: formData.achievement_hadith_meaning,
        achievement_quran_reading: formData.achievement_quran_reading,
        achievement_writing: formData.achievement_writing,
        achievement_surah_memorization: formData.achievement_surah_memorization,
        achievement_dalil_memorization: formData.achievement_dalil_memorization,
        achievement_prayer_memorization:
          formData.achievement_prayer_memorization,
        achievement_asmaul_husna: formData.achievement_asmaul_husna,
        achievement_tajwid: formData.achievement_tajwid,
        achievement_practices: formData.achievement_practices,
        achievement_character: formData.achievement_character,
        program_success_info: formData.program_success_info,
        challenges_info: formData.challenges_info,
      };

      // Validasi
      if (!basePayload.group_id) throw new Error("Kelompok wajib diisi.");
      if (!basePayload.category_id)
        throw new Error("Jenjang (Kategori) wajib diisi.");
    } catch (parseError: any) {
      setError(`Data tidak valid: ${parseError.message}`);
      return;
    }

    // 2. Kirim ke Server Action
    startTransition(async () => {
      let response;
      if (isEditMode && initialData) {
        // --- MODE EDIT ---
        const updatePayload: UpdateKbmReportDto = {
          ...basePayload,
          id: initialData.id, // <-- Tambahkan ID untuk update
          // author_user_id tidak di-update, biarkan penulis asli
        };
        response = await updateKbmReportAction(updatePayload);
      } else {
        // --- MODE CREATE ---
        const createPayload: CreateKbmReportDto = {
          ...basePayload,
          author_user_id: authorId, // <-- Tambahkan authorId untuk create
        };
        response = await createKbmReportAction(createPayload);
      }

      // 3. Handle response
      if (!response.success) {
        setError(response.message || "Terjadi kesalahan.");
      } else {
        setSuccess(
          response.message ||
            `Laporan berhasil ${isEditMode ? "diperbarui" : "disimpan"}.`,
        );
        // Arahkan kembali ke halaman daftar laporan
        router.push("/report");
        router.refresh(); // Refresh data di server
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
        <InputGroupV2
          label="Laki-laki"
          name="count_male"
          type="number"
          placeholder="Jumlah Laki-laki"
          value={formData.count_male}
          onChange={handleChange}
          required
          min="0"
        />
        <InputGroupV2
          label="Perempuan"
          name="count_female"
          type="number"
          placeholder="Jumlah Perempuan"
          value={formData.count_female}
          onChange={handleChange}
          required
          min="0"
        />
        <InputGroupV2
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
        <InputGroupV2
          label="Total Pertemuan"
          name="attendance_total_meetings"
          type="number"
          placeholder="Total Pertemuan"
          value={formData.attendance_total_meetings}
          onChange={handleChange}
          min="0"
        />
        <InputGroupV2
          label="Hadir (%)"
          name="attendance_present_percentage"
          type="number"
          placeholder="cth: 80.5"
          value={formData.attendance_present_percentage}
          onChange={handleChange}
          step="0.1"
          min="0"
        />
        <InputGroupV2
          label="Izin (%)"
          name="attendance_permission_percentage"
          type="number"
          placeholder="cth: 10.5"
          value={formData.attendance_permission_percentage}
          onChange={handleChange}
          step="0.1"
          min="0"
        />
        <InputGroupV2
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
        <InputGroupV2
          label="Makna Al-Qur'an"
          name="achievement_quran_meaning"
          type="text"
          placeholder="Capaian makna Al-Qur'an"
          value={formData.achievement_quran_meaning}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Makna Al-Hadist"
          name="achievement_hadith_meaning"
          type="text"
          placeholder="Capaian makna Al-Hadist"
          value={formData.achievement_hadith_meaning}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Bacaan Al-Qur'an / Tilawaty / Iqro"
          name="achievement_quran_reading"
          type="text"
          placeholder="Capaian bacaan Al-Qur'an"
          value={formData.achievement_quran_reading}
          onChange={handleChange}
        />
         <InputGroupV2
          label="Menulis"
          name="achievement_writing"
          type="text"
          placeholder="Capaian menulis (pegon atau huruf Arab)"
          value={formData.achievement_writing}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Hafalan Surat"
          name="achievement_surah_memorization"
          type="text"
          placeholder="Capaian hafalan surat"
          value={formData.achievement_surah_memorization}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Hafalan Dalil"
          name="achievement_dalil_memorization"
          type="text"
          placeholder="Capaian hafalan dalil"
          value={formData.achievement_dalil_memorization}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Hafalan Do'a"
          name="achievement_prayer_memorization"
          type="text"
          placeholder="Capaian hafalan do'a"
          value={formData.achievement_prayer_memorization}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Asmaul Husna"
          name="achievement_asmaul_husna"
          type="text"
          placeholder="Capaian Asmaul Husna"
          value={formData.achievement_asmaul_husna}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Tajwid"
          name="achievement_tajwid"
          type="text"
          placeholder="Capaian tajwid"
          value={formData.achievement_tajwid}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Praktik Ibadah"
          name="achievement_practices"
          type="text"
          placeholder="Praktik Ibadah"
          value={formData.achievement_practices}
          onChange={handleChange}
        />
        <InputGroupV2
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
      <TextAreaGroupV2
        label="Keberhasilan Program"
        name="program_success_info"
        placeholder="Isi dalam bentuk esai atau poin-poin kuantitatif..."
        value={formData.program_success_info}
        onChange={handleChange}
      />
      
      <h4 className="mb-3 mt-6 text-lg font-semibold">5. Info Tantangan/Kendala dan Solusi</h4>
      <TextAreaGroupV2
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