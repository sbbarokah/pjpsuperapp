"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CategoryModel, GroupModel, MaterialCategoryModel } from "@/lib/types/master.types";
import { 
  createKbmReportAction, 
  updateKbmReportAction, 
} from "../actions";
import { monthOptions } from "@/lib/constants";
import { KbmReportModel, ReportRowState } from "@/lib/types/report.types";
import { InputGroupV2 } from "@/components/forms/input_group_v2";
import { TextAreaGroupV2 } from "@/components/forms/text_area_v2";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";
import { FaPlus, FaTrash } from "react-icons/fa";
import { EvaluationEntry } from "@/lib/types/evaluation.types";
import { getAllMaterialsForFormAction, getMaterialCategoriesForFormAction } from "../../kbmevaluation/actions";
import { MaterialWithRelations } from "@/lib/types/material.types";

type AdminProfile = {
  role: string;
  village_id: string | null;
  group_id: string | null;
};

interface ReportFormProps {
  authorId: string;
  admin: AdminProfile;
  groups: GroupModel[];
  categories: CategoryModel[];
  initialData?: KbmReportModel | null; 
}

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: currentYear, label: String(currentYear) },
  { value: currentYear - 1, label: String(currentYear - 1) },
];

// State awal form statis
const baseInitialState = {
  group_id: "",
  village_id: "",
  period_month: String(new Date().getMonth() + 1),
  period_year: String(currentYear),
  category_id: "",
  count_male: "0",
  count_female: "0",
  count_total: "0",
  attendance_total_meetings: "0",
  attendance_present_percentage: "0",
  attendance_permission_percentage: "0",
  attendance_absent_percentage: "0",
  program_success_info: "",
  challenges_info: "",
};

export function ReportForm({ authorId, admin, groups, categories, initialData = null }: ReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);

  const isEditMode = !!initialData;

  // --- State Data Utama ---
  const [formData, setFormData] = useState(() => {
    if (isEditMode && initialData) {
      const state: any = { ...baseInitialState };
      state.group_id = String(initialData.group_id);
      state.village_id = String(initialData.village_id);
      state.period_month = String(initialData.period_month);
      state.period_year = String(initialData.period_year);
      state.category_id = String(initialData.category_id);
      state.count_male = String(initialData.count_male);
      state.count_female = String(initialData.count_female);
      state.count_total = String(initialData.count_total);
      state.attendance_total_meetings = String(initialData.attendance_total_meetings);
      state.attendance_present_percentage = String(initialData.attendance_present_percentage);
      state.attendance_permission_percentage = String(initialData.attendance_permission_percentage);
      state.attendance_absent_percentage = String(initialData.attendance_absent_percentage);
      state.program_success_info = initialData.program_success_info || "";
      state.challenges_info = initialData.challenges_info || "";
      return state;
    }
    return {
      ...baseInitialState,
      village_id: admin.village_id || "",
      group_id: admin.role === "admin_kelompok" ? admin.group_id || "" : "",
    };
  });

  // --- State Master Data (Materi & Kategori Materi) ---
  const [allMaterials, setAllMaterials] = useState<MaterialWithRelations[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategoryModel[]>([]);
  
  // --- State Baris Dinamis ---
  const [reportRows, setReportRows] = useState<ReportRowState[]>([]);

  // --- Fetch Master Data & Populate Edit ---
  useEffect(() => {
    const fetchMaster = async () => {
      setIsLoadingMaster(true);
      const [matRes, catRes] = await Promise.all([
        getAllMaterialsForFormAction(),
        getMaterialCategoriesForFormAction()
      ]);

      if (matRes.success) setAllMaterials(matRes.data || []);
      if (catRes.success) setMaterialCategories(catRes.data || []);
      
      // Jika mode edit, populate rows dari raw_data JSON (Array)
      if (isEditMode && initialData?.raw_data) {
        // Asumsi raw_data adalah Array<EvaluationEntry>
        const rawDataArray = initialData.raw_data as unknown as EvaluationEntry[];
        
        const rows = rawDataArray.map((item) => {
          return {
            temp_id: crypto.randomUUID(),
            material_id: item.material_id,
            // Gunakan ID kategori dari JSON jika ada, atau fallback cari dari list materi
            material_category_id: item.material_category_id,
            notes: item.evaluation_note
          };
        });
        setReportRows(rows);
      }
      setIsLoadingMaster(false);
    };

    fetchMaster();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, initialData]);


  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Auto calc total generus
  useEffect(() => {
    const male = parseInt(formData.count_male, 10) || 0;
    const female = parseInt(formData.count_female, 10) || 0;
    setFormData((prev: any) => ({ ...prev, count_total: String(male + female) }));
  }, [formData.count_male, formData.count_female]);

  // --- Row Handlers ---
  const addNewRow = () => {
    setReportRows(prev => [
      ...prev,
      { temp_id: crypto.randomUUID(), material_category_id: "", material_id: "", notes: "" }
    ]);
  };

  const removeRow = (temp_id: string) => {
    setReportRows(prev => prev.filter(r => r.temp_id !== temp_id));
  };

  const handleRowChange = (temp_id: string, field: keyof ReportRowState, value: string) => {
    setReportRows(prev => prev.map(row => {
      if (row.temp_id === temp_id) {
        // Jika kategori berubah, reset materi
        if (field === 'material_category_id') {
          return { ...row, [field]: value, material_id: "", notes: "" }; 
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.group_id || !formData.category_id) {
      setError("Kelompok dan Jenjang wajib diisi.");
      return;
    }

    // Validasi Rows
    if (reportRows.length > 0) {
      const invalidRow = reportRows.find(r => !r.material_id);
      if (invalidRow) {
         setError("Mohon pilih materi untuk semua baris pencapaian.");
         return;
      }
    }

    const payload = {
      group_id: Number(formData.group_id),
      village_id: Number(formData.village_id),
      category_id: Number(formData.category_id),
      period_month: Number(formData.period_month),
      period_year: Number(formData.period_year),
      
      count_male: Number(formData.count_male),
      count_female: Number(formData.count_female),
      count_total: Number(formData.count_total),
      
      attendance_total_meetings: Number(formData.attendance_total_meetings),
      attendance_present_percentage: parseFloat(formData.attendance_present_percentage),
      attendance_permission_percentage: parseFloat(formData.attendance_permission_percentage),
      attendance_absent_percentage: parseFloat(formData.attendance_absent_percentage),
      
      program_success_info: formData.program_success_info,
      challenges_info: formData.challenges_info,
      
      reportRows: reportRows, // Data dinamis
      author_user_id: authorId,
    };

    startTransition(async () => {
      let response;
      if (isEditMode && initialData) {
        // @ts-ignore
        response = await updateKbmReportAction({ ...payload, id: initialData.id });
      } else {
        // @ts-ignore
        response = await createKbmReportAction(payload);
      }

      if (!response.success) {
        setError(response.message);
      } else {
        setSuccess(response.message);
        router.push("/kbmreport");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* --- Bagian 1: Info Utama --- */}
      <h4 className="mb-3 text-lg font-semibold">Info Utama Laporan</h4>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SelectGroupV2
          label="Kelompok"
          name="group_id"
          value={formData.group_id}
          onChange={handleChange}
          required
          options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
        />
        <SelectGroupV2
          label="Jenjang (Kategori)"
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectGroupV2
          label="Periode Bulan"
          name="period_month"
          value={formData.period_month}
          onChange={handleChange}
          required
          options={monthOptions}
        />
        <SelectGroupV2
          label="Periode Tahun"
          name="period_year"
          value={formData.period_year}
          onChange={handleChange}
          required
          options={yearOptions}
        />
      </div>

      {/* --- Bagian 2: Sensus --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">1. Info Jumlah Generus</h4>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <InputGroupV2 label="Laki-laki" name="count_male" type="number" placeholder="Jumlah Santri Laki-laki" value={formData.count_male} onChange={handleChange} min="0" required />
        <InputGroupV2 label="Perempuan" name="count_female" type="number" placeholder="Jumlah Santri Perempuan" value={formData.count_female} onChange={handleChange} min="0" required />
        <InputGroupV2 label="Total" name="count_total" type="number" placeholder="Total Santri" value={formData.count_total} onChange={() => {}} readOnly disabled />
      </div>

      {/* --- Bagian 3: Kehadiran --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">2. Info Presentase Kehadiran</h4>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InputGroupV2 label="Total Pertemuan" name="attendance_total_meetings" type="number" placeholder="Total Pertemuan" value={formData.attendance_total_meetings} onChange={handleChange} />
        <InputGroupV2 label="Hadir (%)" name="attendance_present_percentage" type="number" placeholder="Persentase Hadir" step="0.1" value={formData.attendance_present_percentage} onChange={handleChange} />
        <InputGroupV2 label="Izin (%)" name="attendance_permission_percentage" type="number" placeholder="Persentase Izin" step="0.1" value={formData.attendance_permission_percentage} onChange={handleChange} />
        <InputGroupV2 label="Alpa (%)" name="attendance_absent_percentage" type="number" placeholder="Persentase Alpa" step="0.1" value={formData.attendance_absent_percentage} onChange={handleChange} />
      </div>

      {/* --- Bagian 4: Capaian Materi (DINAMIS) --- */}
      <div className="mt-8 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-black dark:text-white">3. Info Capaian Materi</h4>
          {isLoadingMaster && <span className="text-sm text-gray-500">Memuat data materi...</span>}
        </div>
        
        <div className="flex flex-col gap-4">
          {reportRows.map(row => (
            <ReportRowInput
              key={row.temp_id}
              row={row}
              categories={materialCategories}
              allMaterials={allMaterials} // Pass semua materi
              onChange={handleRowChange}
              onRemove={removeRow}
            />
          ))}

          <button
            type="button"
            onClick={addNewRow}
            disabled={isLoadingMaster}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary p-3 font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <FaPlus /> Tambah Pencapaian Materi
          </button>
        </div>
      </div>

      {/* --- Bagian 5 & 6: Esai --- */}
      <h4 className="mb-3 mt-6 text-lg font-semibold">4. Info Keberhasilan Program</h4>
      <TextAreaGroupV2 label="Keberhasilan Program" name="program_success_info" placeholder="Tuliskan kegiatan atau aktivitas yang menunjukan keberhasilan program" value={formData.program_success_info} onChange={handleChange} />
      
      <h4 className="mb-3 mt-6 text-lg font-semibold">5. Info Tantangan & Solusi</h4>
      <TextAreaGroupV2 label="Tantangan & Solusi" name="challenges_info" placeholder="Tuliskan tantangan selama mengajar" value={formData.challenges_info} onChange={handleChange} />

      {/* --- Submit --- */}
      {error && <div className="my-4 p-3 text-sm text-red-700 bg-red-100 border border-red-500 rounded">{error}</div>}
      {success && <div className="my-4 p-3 text-sm text-green-700 bg-green-100 border border-green-500 rounded">{success}</div>}

      <button
        type="submit"
        className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
        disabled={isPending}
      >
        {isPending ? "Menyimpan..." : "Simpan Laporan"}
      </button>
    </form>
  );
}

/**
 * Sub-komponen Baris Input Materi
 * Menggunakan pola yang sama dengan EvaluationRowInput (Cascading Dropdown)
 */
const ReportRowInput = ({
  row,
  categories,
  allMaterials,
  onChange,
  onRemove
}: {
  row: ReportRowState;
  categories: MaterialCategoryModel[];
  allMaterials: MaterialWithRelations[];
  onChange: (id: string, field: keyof ReportRowState, val: string) => void;
  onRemove: (id: string) => void;
}) => {
  
  // Filter materi berdasarkan kategori yang dipilih DI BARIS INI
  const availableMaterials = useMemo(() => {
    if (!row.material_category_id) return [];
    return allMaterials.filter(m => String(m.material_category_id) === String(row.material_category_id));
  }, [row.material_category_id, allMaterials]);

  return (
    <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-boxdark-2">
      
      {/* Header Baris (Dropdowns) */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Pilih Kategori */}
          <SelectGroupV2
            label="Kategori Materi"
            name={`cat_${row.temp_id}`}
            value={row.material_category_id}
            onChange={(e) => onChange(row.temp_id, 'material_category_id', e.target.value)}
            options={categories.map(c => ({ value: String(c.id), label: c.name }))}
            className="!mb-0"
            required
          />
          
          {/* 2. Pilih Materi (Filtered) */}
          <SelectGroupV2
            label="Materi"
            name={`mat_${row.temp_id}`}
            value={row.material_id}
            onChange={(e) => onChange(row.temp_id, 'material_id', e.target.value)}
            options={availableMaterials.map(m => ({ value: m.id, label: m.material_name }))}
            disabled={!row.material_category_id || availableMaterials.length === 0}
            className="!mb-0"
            required
          />
        </div>
        
        {/* Tombol Hapus */}
        <button 
          type="button" 
          onClick={() => onRemove(row.temp_id)} 
          className="text-red-500 hover:text-red-700 mt-8"
          title="Hapus Baris"
        >
          <FaTrash />
        </button>
      </div>
      
      {/* Input Evaluasi */}
      <TextAreaGroupV2
        label="Pencapaian / Evaluasi (Satu kalimat singkat)"
        name={`note_${row.temp_id}`}
        value={row.notes}
        onChange={(e) => onChange(row.temp_id, 'notes', e.target.value)}
        rows={2}
        placeholder="Contoh: Rata-rata s.d. Juz 5; atau 70% santri lulus materi ini."
        className="!mb-0"
      />
    </div>
  );
};