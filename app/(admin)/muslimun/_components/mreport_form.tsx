"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GroupModel } from "@/lib/types/master.types";
import { monthOptions } from "@/lib/constants";
import {
  CreateMeetingReportDto,
  MeetingReportModel,
  UpdateMeetingReportDto,
} from "@/lib/types/mreport.types";
import {
  createMeetingReportAction,
  updateMeetingReportAction,
  deleteMeetingReportAction,
} from "../actions";
import { SelectGroup } from "@/components/forms/select_group";
import { InputGroupV2 } from "@/components/forms/input_group_v2";
import { Profile } from "@/lib/types/user.types";
import { TextAreaGroupV2 } from "@/components/forms/text_area_v2";

type AdminProfile = {
  role: string;
  village_id: number | null;
  group_id: number | null;
};

interface ReportFormProps {
  authorId: string;
  admin: Profile;
  groups: GroupModel[];
  initialData?: MeetingReportModel | null;
}

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: currentYear, label: String(currentYear) },
  { value: currentYear - 1, label: String(currentYear - 1) },
];

const baseFormState = {
  id: "",
  group_id: "",
  village_id: "",
  period_month: String(new Date().getMonth() + 1),
  period_year: String(currentYear),
  muroh_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
  muroh_place: "",
  element_ki: "",
  element_management: "",
  element_expert: "",
  element_mubaligh: "",
  element_parent: "",
  muroh_notes: "",
};

// --- Fungsi untuk mengubah data Model ke State Form (string) ---
const mapModelToState = (data: MeetingReportModel) => {
  const state = { ...baseFormState };
  for (const key in data) {
    const value = (data as any)[key];
    if (value !== null && value !== undefined) {
      (state as any)[key] = String(value);
    } else {
      (state as any)[key] = "";
    }
  }
  // Pastikan ID tetap ada
  (state as any).id = data.id;
  return state;
};

export function MeetingReportForm({
  authorId,
  admin,
  groups,
  initialData = null,
}: ReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!initialData;

  // --- State Awal Form ---
  const [formData, setFormData] = useState(() => {
    if (isEditMode) {
      return mapModelToState(initialData);
    }
    return {
      ...baseFormState,
      group_id: admin.role === "admin_kelompok" ? String(admin.group_id) : "",
      village_id: String(admin.village_id) || "",
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

  // Handler untuk submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let basePayload;
    try {
      // 1. Konversi state (string) ke payload (number/string)
      basePayload = {
        group_id: parseInt(formData.group_id, 10),
        village_id: parseInt(formData.village_id, 10),
        period_month: parseInt(formData.period_month, 10),
        period_year: parseInt(formData.period_year, 10),
        muroh_date: formData.muroh_date,
        muroh_place: formData.muroh_place,
        element_ki: formData.element_ki,
        element_management: formData.element_management,
        element_expert: formData.element_expert,
        element_mubaligh: formData.element_mubaligh,
        element_parent: formData.element_parent,
        muroh_notes: formData.muroh_notes,
      };

      // Validasi
      if (!basePayload.group_id) throw new Error("Kelompok wajib diisi.");
      if (!basePayload.muroh_date) throw new Error("Tanggal Musyawarah wajib diisi.");

    } catch (parseError: any) {
      setError(`Data tidak valid: ${parseError.message}`);
      return;
    }

    // 2. Kirim ke Server Action
    startTransition(async () => {
      let response;
      if (isEditMode) {
        const updatePayload: UpdateMeetingReportDto = {
          ...basePayload,
          id: formData.id,
        };
        response = await updateMeetingReportAction(updatePayload);
      } else {
        const createPayload: CreateMeetingReportDto = {
          ...basePayload,
          author_user_id: authorId,
        };
        response = await createMeetingReportAction(createPayload);
      }

      // 3. Handle response
      if (!response.success) {
        setError(response.message || "Terjadi kesalahan.");
      } else {
        setSuccess(response.message || "Laporan berhasil disimpan.");
        router.push("/muslimun");
        router.refresh();
      }
    });
  };
  
  // Handler untuk Hapus
  const handleDelete = async () => {
    if (!isEditMode || !formData.id) return;
    
    // Gunakan konfirmasi kustom jika ada, jika tidak, 'confirm' biasa
    const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.");

    if (isConfirmed) {
      setError(null);
      setSuccess(null);
      startTransition(async () => {
        const response = await deleteMeetingReportAction(formData.id);
        if (!response.success) {
          setError(response.message);
        } else {
          alert(response.message);
          router.push("/admin/muslimun");
          router.refresh();
        }
      });
    }
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
          disabled={admin.role === "admin_kelompok"}
        />
        <InputGroupV2
          label="Tanggal Musyawarah"
          name="muroh_date"
          type="date"
          placeholder="YYYY-MM-DD"
          value={formData.muroh_date}
          onChange={handleChange}
          required
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
      <InputGroupV2
        label="Tempat Musyawarah"
        name="muroh_place"
        type="text"
        placeholder="cth: Masjid Baitul A'la, Kediaman Bpk. Kusnadi"
        value={formData.muroh_place || ""}
        onChange={handleChange}
      />
      
      {/* --- Bagian 2: 5 Unsur --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">Kehadiran 5 Unsur</h4>
      <p className="mb-4 text-sm text-gray-600">
        Isi dengan nama-nama yang hadir, pisahkan dengan koma jika lebih dari satu.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InputGroupV2
          label="Unsur Keimaman (KI)"
          name="element_ki"
          type="text"
          placeholder="cth: Bpk. Kusnadi, Bpk. Atang"
          value={formData.element_ki || ""}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Unsur Pengurus (Manajemen)"
          name="element_management"
          type="text"
          placeholder="cth: Bpk. H. Adimin"
          value={formData.element_management || ""}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Unsur Pakar Pendidik"
          name="element_expert"
          type="text"
          placeholder="cth: Bpk. Kusnadi"
          value={formData.element_expert || ""}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Unsur Mubaligh/Mubalighot"
          name="element_mubaligh"
          type="text"
          placeholder="cth: Mas Mario, Teh Nanda"
          value={formData.element_mubaligh || ""}
          onChange={handleChange}
        />
        <InputGroupV2
          label="Unsur Orang Tua"
          name="element_parent"
          type="text"
          placeholder="cth: Orangtua Generus"
          value={formData.element_parent || ""}
          onChange={handleChange}
        />
      </div>

      {/* --- Bagian 3: Catatan --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">Catatan Musyawarah</h4>
      <TextAreaGroupV2
        label="Catatan / Notulensi"
        name="muroh_notes"
        placeholder="Isi catatan penting, masukan, atau info lain dari musyawarah..."
        value={formData.muroh_notes || ""}
        onChange={handleChange}
        rows={5}
      />

      {/* --- Pesan Error/Sukses --- */}
      {error && (
        <div className="my-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700"><p>{error}</p></div>
      )}
      {success && (
        <div className="my-4 rounded border border-green-500 bg-green-100 p-3 text-sm text-green-700"><p>{success}</p></div>
      )}

      {/* --- Tombol Submit --- */}
      <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
        <div>
          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full justify-center rounded-lg border border-red-500 bg-transparent p-[13px] font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-opacity-50"
              disabled={isPending}
            >
              Hapus Laporan
            </button>
          )}
        </div>
        <button
          type="submit"
          className="flex w-full sm:w-1/2 justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
          disabled={isPending}
        >
          {isPending ? "Menyimpan..." : isEditMode ? "Update Laporan" : "Simpan Laporan"}
        </button>
      </div>
    </form>
  );
}