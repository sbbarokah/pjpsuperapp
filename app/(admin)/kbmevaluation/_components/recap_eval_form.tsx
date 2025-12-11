"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  EvaluationRecapModel,
  EvaluationRowState,
  CreateEvaluationPayload,
  UpdateEvaluationPayload,
} from "@/lib/types/evaluation.types";
import { Profile } from "@/lib/types/user.types";
import { GroupModel, CategoryModel, MaterialCategoryModel } from "@/lib/types/master.types";
import { monthOptions } from "@/lib/constants";
import {
  createEvaluationAction,
  updateEvaluationAction,
  getGenerusForFormAction,
  getMaterialsForFormAction,
  getMaterialCategoriesForFormAction,
  getAllMaterialsForFormAction,
} from "../actions";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MaterialWithRelations } from "@/lib/types/material.types";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";
import { TextAreaGroupV2 } from "@/components/forms/text_area_v2";
import { InputGroupV2 } from "@/components/forms/input_group_v2";

interface RecapFormProps {
  admin: Profile;
  groups: GroupModel[];
  categories: CategoryModel[];
  initialData?: EvaluationRecapModel | null;
}

type Generus = Pick<Profile, "user_id" | "full_name">;
type RowChangeValue = string | boolean;

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: currentYear, label: String(currentYear) },
  { value: currentYear - 1, label: String(currentYear - 1) },
];

export function EvaluationRecapForm({
  admin,
  groups,
  categories,
  initialData = null,
}: RecapFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!initialData;
  const isAdminKelompok = admin.role === 'admin_kelompok';

  // --- State Utama Form ---
  const [formData, setFormData] = useState({
    group_id: String(initialData?.group_id || (isAdminKelompok ? admin.group_id : "")),
    category_id: String(initialData?.category_id || ""),
    period_month: String(initialData?.period_month || new Date().getMonth() + 1),
    period_year: String(initialData?.period_year || currentYear),
    challenges: initialData?.challenges || "",
    solutions: initialData?.solutions || "",
    notes: initialData?.notes || "",
  });

  const [students, setStudents] = useState<Generus[]>([]);
  const [allAvailableMaterials, setAllAvailableMaterials] = useState<MaterialWithRelations[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategoryModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationRows, setEvaluationRows] = useState<EvaluationRowState[]>([]);
  
  // --- Efek untuk memuat data di Mode Edit ---
  useEffect(() => {
    const loadEditData = async () => {
      if (isEditMode && initialData) {
        setIsLoading(true);
        // 1. Ambil semua data master
        const [studentResponse, materialResponse, matCatResponse] = await Promise.all([
          getGenerusForFormAction(initialData.group_id, initialData.category_id),
          getAllMaterialsForFormAction(), // Ambil SEMUA materi
          getMaterialCategoriesForFormAction() // Ambil SEMUA kategori materi
        ]);
        
        // 2. Set state master
        if (studentResponse.success) setStudents(studentResponse.data || []);
        if (materialResponse.success) setAllAvailableMaterials(materialResponse.data || []);
        if (matCatResponse.success) setMaterialCategories(matCatResponse.data || []);

        // 3. De-pivot raw_data ke state form
        const rowsFromData: EvaluationRowState[] = initialData.raw_data.map((item) => ({
          temp_id: crypto.randomUUID(), // Buat ID sementara baru untuk React key
          material_category_id: item.material_category_id,
          material_category_name: item.material_category_name,
          material_id: item.material_id,
          material_name: item.material_name,
          // scores: item.scores,
          scores: item.scores,
          evaluation_note: item.evaluation_note,
          show_details: item.show_details ?? true,
        }));
        setEvaluationRows(rowsFromData);
        setIsLoading(false);
      }
    };
    loadEditData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, initialData]);

  // --- Handlers ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "group_id" || name === "category_id") {
      setStudents([]);
      setAllAvailableMaterials([]);
      setMaterialCategories([]);
      setEvaluationRows([]);
    }
  };

  const handleFetchData = async () => {
    if (!formData.group_id || !formData.category_id) {
      setError("Harap pilih Kelompok dan Kategori terlebih dahulu.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const [studentResponse, materialResponse, matCatResponse] = await Promise.all([
      getGenerusForFormAction(Number(formData.group_id), Number(formData.category_id)),
      getAllMaterialsForFormAction(), // Ambil materi untuk kategori siswa
      getMaterialCategoriesForFormAction() // Ambil SEMUA kategori materi
    ]);

    if (!studentResponse.success || !studentResponse.data) {
      setError(studentResponse.error || "Gagal mengambil data generus.");
      setStudents([]);
    } else {
      setStudents(studentResponse.data);
    }

    if (!materialResponse.success || !materialResponse.data) {
      setError(materialResponse.error || "Gagal mengambil data materi.");
      setAllAvailableMaterials([]);
    } else {
      setAllAvailableMaterials(materialResponse.data);
    }
    
    if (!matCatResponse.success || !matCatResponse.data) {
      setError(matCatResponse.error || "Gagal mengambil kategori materi.");
      setMaterialCategories([]);
    } else {
      setMaterialCategories(matCatResponse.data);
    }
    
    setEvaluationRows([]); // Reset baris
    setIsLoading(false);
  };

  // --- Handlers untuk Baris Dinamis ---
  
  const addNewRow = () => {
    setEvaluationRows(prev => [
      ...prev,
      {
        temp_id: crypto.randomUUID(),
        material_category_id: "",
        material_category_name: "",
        material_id: "",
        material_name: "",
        scores: {},
        evaluation_note: "",
        show_details: true,
      }
    ]);
  };
  
  const removeRow = (temp_id: string) => {
    setEvaluationRows(prev => prev.filter(row => row.temp_id !== temp_id));
  };
  
  // Update satu sel nilai siswa
  const handleScoreChange = (temp_id: string, userId: string, name: string, score: string) => {
    setEvaluationRows(prev => prev.map(row => 
      row.temp_id === temp_id
        ? { ...row, scores: { ...row.scores, [userId]: {name, score} } }
        : row
    ));
  };

  // [REVISI] Update field di baris (material_id atau evaluation_note)
  const handleRowChange = (
    temp_id: string, 
    field: 'material_id' | 'material_category_id' | 'evaluation_note' | 'show_details', 
    value: RowChangeValue
  ) => {
    setEvaluationRows(prev => prev.map(row => {
      if (row.temp_id === temp_id) {
        if (field === 'material_category_id') {
          // Reset materi dan nilai jika kategori berubah
          return { ...row, [field]: value as string, material_id: "", scores: {} };
        }
        // Value otomatis masuk sesuai tipe (string atau boolean)
        return { ...row, [field]: value };
      }
      return row;
    }));
  };
  
  /**
   * Submit form
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // --- Validasi Klien ---
    if (students.length === 0) {
      setError("Tidak ada data generus. Klik 'Tampilkan Generus' terlebih dahulu.");
      return;
    }
    if (evaluationRows.length === 0) {
      setError("Belum ada materi yang dinilai. Klik 'Tambah Materi Penilaian'.");
      return;
    }
    // Cek duplikasi materi
    const materialIds = evaluationRows.map(r => r.material_id).filter(Boolean);
    if (new Set(materialIds).size !== materialIds.length) {
      setError("Terdapat materi yang sama dipilih lebih dari satu kali.");
      return;
    }

    // --- Siapkan Payload [REVISI] ---
    const payload: CreateEvaluationPayload = {
      group_id: Number(formData.group_id),
      category_id: Number(formData.category_id),
      period_month: Number(formData.period_month),
      period_year: Number(formData.period_year),
      challenges: formData.challenges,
      solutions: formData.solutions,
      notes: formData.notes,
      evaluationRows: evaluationRows,
    };

    startTransition(async () => {
      let response;
      if (isEditMode && initialData) {
        const updatePayload: UpdateEvaluationPayload = { ...payload, id: initialData.id };
        response = await updateEvaluationAction(updatePayload);
      } else {
        response = await createEvaluationAction(payload);
      }

      if (!response.success) {
        setError(response.message || "Terjadi kesalahan.");
      } else {
        setSuccess(response.message || "Rekap berhasil disimpan.");
        router.push("/kbmevaluation");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-5.5">
        
        {/* --- Bagian 1: Filter --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectGroupV2
            label="Kelompok"
            name="group_id"
            value={formData.group_id}
            onChange={handleFormChange}
            options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
            disabled={isAdminKelompok || isEditMode}
            required
          />
          <SelectGroupV2
            label="Kategori (Kelas)"
            name="category_id"
            value={formData.category_id}
            onChange={handleFormChange}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            disabled={isEditMode}
            required
          />
          <SelectGroupV2
            label="Periode Bulan"
            name="period_month"
            value={formData.period_month}
            onChange={handleFormChange}
            options={monthOptions}
            disabled={isEditMode}
            required
          />
          <SelectGroupV2
            label="Periode Tahun"
            name="period_year"
            value={formData.period_year}
            onChange={handleFormChange}
            options={yearOptions}
            disabled={isEditMode}
            required
          />
        </div>

        {/* --- Tombol Muat Data --- */}
        {!isEditMode && (
          <button
            type="button"
            onClick={handleFetchData}
            disabled={isLoading || !formData.group_id || !formData.category_id}
            className="flex w-full justify-center rounded-lg bg-blue-600 py-3 px-5 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
          >
            {isLoading ? "Memuat Data..." : "Tampilkan Generus & Materi"}
          </button>
        )}
        
        <hr className="my-4"/>
        
        {/* --- Bagian 2: Catatan Umum --- */}
        <TextAreaGroupV2
          label="Tantangan KBM (Opsional)"
          name="challenges"
          value={formData.challenges}
          onChange={handleFormChange}
          placeholder="Tuliskan tantangan KBM untuk periode ini..."
          rows={3}
        />
        <TextAreaGroupV2
          label="Solusi (Opsional)"
          name="solutions"
          value={formData.solutions}
          onChange={handleFormChange}
          placeholder="Tuliskan solusi atas tantangan pada periode ini (bisa dari hasil muroh PJP, Muslimun, atau usulan pengajar)..."
          rows={3}
        />
        <TextAreaGroupV2
          label="Catatan Umum (Opsional)"
          name="notes"
          value={formData.notes}
          onChange={handleFormChange}
          placeholder="Tuliskan catatan umum untuk rekap periode ini..."
          rows={3}
        />

        {/* --- Bagian 3: Daftar Isian Penilaian --- */}
        {isLoading ? (
          <div className="text-center p-4">Memuat data...</div>
        ) : students.length > 0 ? (
          <div className="flex flex-col gap-6">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Isi Penilaian Generus ({students.length} Anak)
            </h4>
            
            {/* Render Baris Penilaian Dinamis */}
            {evaluationRows.map((row) => (
              <EvaluationRowInput
                key={row.temp_id}
                row={row}
                students={students}
                materialCategories={materialCategories} // [BARU] Pass master list
                allMaterials={allAvailableMaterials} // [BARU] Pass master list
                onScoreChange={handleScoreChange}
                onRowChange={handleRowChange}
                onRemove={removeRow}
              />
            ))}
            
            {/* Tombol Tambah Baris */}
            <button
              type="button"
              onClick={addNewRow}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary p-3 font-medium text-primary hover:bg-primary/10"
            >
              <FaPlus /> Tambah Materi Penilaian
            </button>
          </div>
        ) : (
          !isEditMode && <p className="text-center text-gray-600 dark:text-gray-400">Pilih kelompok dan kategori, lalu klik "Tampilkan Generus & Materi".</p>
        )}
        
        {/* ... (Pesan Error/Sukses & Tombol Submit) ... */}
        {error && (
          <div className="my-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
            <p>{error}</p>
          </div>
        )}
        <button
          type="submit"
          className="mt-6 flex w-full justify-center rounded-lg bg-primary p-3 font-medium text-white hover:bg-opacity-90"
          disabled={isPending || students.length === 0 || evaluationRows.length === 0}
        >
          {isPending ? "Menyimpan..." : (isEditMode ? "Perbarui Rekap" : "Simpan Rekap Penilaian")}
        </button>
      </div>
    </form>
  );
}

/**
 * [REVISI] Sub-komponen untuk satu baris materi
 * Menggunakan layout tabel untuk daftar siswa
 */
const EvaluationRowInput = ({
  row,
  students,
  materialCategories, // Master list Kategori Materi (Aqidah, Fiqih)
  allMaterials,       // Master list SEMUA materi (Iman, Wudhu, Sholat)
  onScoreChange,
  onRowChange,
  onRemove,
}: {
  row: EvaluationRowState;
  students: Generus[];
  materialCategories: MaterialCategoryModel[];
  allMaterials: MaterialWithRelations[];
  onScoreChange: (temp_id: string, userId: string, name: string, score: string) => void;
  onRowChange: (temp_id: string, field: 'material_id' | 'material_category_id' | 'evaluation_note' | 'show_details', value: RowChangeValue) => void;
  onRemove: (temp_id: string) => void;
}) => {

  // [BARU] Filter materi yang tersedia berdasarkan kategori yang dipilih
  const availableMaterials = useMemo(() => {
    if (!row.material_category_id) {
      return []; // Jika tidak ada kategori, tidak ada materi
    }
    return allMaterials.filter(
      (m) => String(m.material_category_id) === String(row.material_category_id)
    );
  }, [row.material_category_id, allMaterials]);

  return (
    <div className="rounded-lg border-2 border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark transition-all duration-300">
    
      {/* Header Baris (Pilih Materi & Hapus) */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Baris 1: Dropdown & Delete */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectGroupV2
              label="Kategori Materi"
              name={`material_cat_${row.temp_id}`}
              value={row.material_category_id}
              onChange={(e) => onRowChange(row.temp_id, 'material_category_id', e.target.value)}
              options={materialCategories.map(m => ({ value: String(m.id), label: m.name }))}
              required
              className="!mb-0"
            />
            <SelectGroupV2
              label="Materi yang Dinilai"
              name={`material_${row.temp_id}`}
              value={row.material_id}
              onChange={(e) => onRowChange(row.temp_id, 'material_id', e.target.value)}
              options={availableMaterials.map(m => ({ value: m.id, label: m.material_name }))}
              required
              disabled={!row.material_category_id || availableMaterials.length === 0}
              className="!mb-0"
            />
          </div>
          <button
            type="button"
            onClick={() => onRemove(row.temp_id)}
            className="p-2 text-red-500 hover:text-red-700 mt-8"
            title="Hapus baris materi ini"
          >
            <FaTrash />
          </button>
        </div>

        {/* Baris 2: Toggle Switch (Nilai Show Details dari DB/State) */}
        <div className="flex items-center justify-end gap-3 border-b border-stroke pb-2 dark:border-strokedark">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {row.show_details ? "Sembunyikan" : "Tampilkan"} Penilaian Siswa
          </span>
          <button
            type="button"
            // [PENTING] Memanggil onRowChange untuk update state di parent -> nanti disimpan ke DB
            onClick={() => onRowChange(row.temp_id, 'show_details', !row.show_details)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              row.show_details ? "bg-primary" : "bg-gray-300 dark:bg-form-input"
            }`}
          >
            <span
              className={`${
                row.show_details ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>
      </div>
      
      {/* Tabel Penilaian Siswa (Sama seperti sebelumnya) */}
      {row.show_details && (
        <div className="max-w-full overflow-x-auto mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-3 font-medium text-black dark:text-white w-12">No.</th>
                <th className="px-4 py-3 font-medium text-black dark:text-white min-w-[200px]">Nama Generus</th>
                <th className="px-4 py-3 font-medium text-black dark:text-white min-w-[200px] w-2/5">Nilai (Deskriptif)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.user_id}>
                  <td className="border-b border-stroke px-4 py-2 dark:border-strokedark text-center">{index + 1}</td>
                  <td className="border-b border-stroke px-4 py-2 dark:border-strokedark">
                    <p className="font-medium text-black dark:text-white">{student.full_name}</p>
                  </td>
                  <td className="border-b border-stroke px-4 py-2 dark:border-strokedark">
                    <textarea
                      name={`score_${row.temp_id}_${student.user_id}`}
                      value={row.scores[student.user_id].score || ""}
                      onChange={(e) => onScoreChange(row.temp_id, student.user_id, student.full_name, e.target.value)}
                      placeholder="Tuliskan nilai deskriptif..."
                      rows={2}
                      className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Input Evaluasi per Materi (Sama seperti sebelumnya) */}
      <div className="mt-4">
        <TextAreaGroupV2
          label="Catatan Evaluasi Materi Ini (akan dimunculkan di laporan KBM)"
          name={`eval_${row.temp_id}`}
          value={row.evaluation_note}
          onChange={(e) => onRowChange(row.temp_id, 'evaluation_note', e.target.value)}
          placeholder="Tuliskan evaluasi/kesimpulan untuk materi ini..."
          rows={2}
          className="!mb-0"
        />
      </div>
    </div>
  );
};

/**
 * [BARU] Sub-komponen untuk satu baris materi
 */
const EvaluationRowInput2 = ({
  row,
  students,
  materials,
  onScoreChange,
  onRowChange,
  onRemove,
}: {
  row: EvaluationRowState;
  students: Generus[];
  materials: MaterialWithRelations[];
  onScoreChange: (temp_id: string, userId: string, score: string) => void;
  onRowChange: (temp_id: string, field: 'material_id' | 'evaluation_note', value: string) => void;
  onRemove: (temp_id: string) => void;
}) => {
  return (
    <div className="rounded-lg border-2 border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
      {/* Header Baris (Pilih Materi & Hapus) */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="flex-grow">
          <SelectGroupV2
            label="Materi yang Dinilai"
            name={`material_${row.temp_id}`}
            value={row.material_id}
            onChange={(e) => onRowChange(row.temp_id, 'material_id', e.target.value)}
            options={materials.map(m => ({ value: m.id, label: m.material_name }))}
            required
            className="!mb-0"
          />
        </div>
        <button
          type="button"
          onClick={() => onRemove(row.temp_id)}
          className="p-2 text-red-500 hover:text-red-700 mt-8"
          title="Hapus baris materi ini"
        >
          <FaTrash />
        </button>
      </div>
      
      {/* Grid Penilaian Siswa */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {students.map(student => (
          <InputGroupV2
            key={student.user_id}
            label={student.full_name}
            type="text"
            name={`score_${row.temp_id}_${student.user_id}`}
            value={row.scores[student.user_id].score || ""}
            onChange={(e) => onScoreChange(row.temp_id, student.user_id, e.target.value)}
            placeholder="Nilai (cth: A, B, 80)"
            className="!mb-0"
          />
        ))}
      </div>
      
      {/* [BARU] Input Evaluasi per Materi */}
      <div className="mt-4">
        <TextAreaGroupV2
          label="Catatan Evaluasi Materi Ini"
          name={`eval_${row.temp_id}`}
          value={row.evaluation_note}
          onChange={(e) => onRowChange(row.temp_id, 'evaluation_note', e.target.value)}
          placeholder="Tuliskan evaluasi/kesimpulan untuk materi ini..."
          rows={2}
          className="!mb-0"
        />
      </div>
    </div>
  );
};