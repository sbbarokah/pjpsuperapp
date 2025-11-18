"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AttendanceRecapModel,
  CreateRecapPayload,
  StudentAttendanceData,
  UpdateRecapPayload,
} from "@/lib/types/attendance.types";
import { Profile } from "@/lib/types/user.types";
import { GroupModel, CategoryModel } from "@/lib/types/master.types";
import { monthOptions } from "@/lib/constants";
import {
  createRecapAction,
  updateRecapAction,
  getGenerusForFormAction,
} from "../actions";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";
import { InputGroupV2 } from "@/components/forms/input_group_v2";

interface RecapFormProps {
  admin: Profile;
  groups: GroupModel[];
  categories: CategoryModel[];
  initialData?: AttendanceRecapModel | null;
}

type Generus = Pick<Profile, "user_id" | "full_name">;

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: currentYear, label: String(currentYear) },
  { value: currentYear - 1, label: String(currentYear - 1) },
];

export function AttendanceRecapForm({
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
    meeting_count: String(initialData?.meeting_count || "0"),
  });
  
  const [students, setStudents] = useState<Generus[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // State untuk input dinamis per siswa
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceData>>(
    initialData?.raw_data || {}
  );

  // --- Efek untuk memuat siswa jika mode Edit ---
  useEffect(() => {
    if (isEditMode && initialData) {
      // Di mode edit, kita harus mengambil daftar siswa
      // yang terkait dengan rekap yang ada
      handleFetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, initialData]); // Hanya jalan sekali saat load

  // --- Handlers ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Reset daftar siswa jika filter berubah
    if (name === "group_id" || name === "category_id") {
      setStudents([]);
      setAttendanceData({});
    }
  };

  const handleStudentDataChange = (
    userId: string,
    field: 'p' | 'i' | 'a',
    value: string
  ) => {
    const numValue = parseInt(value, 10) || 0;
    setAttendanceData((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { p: 0, i: 0, a: 0 }), // Inisialisasi jika belum ada
        [field]: numValue,
      },
    }));
  };
  
  /**
   * Mengambil daftar generus dari server action
   */
  const handleFetchStudents = async () => {
    if (!formData.group_id || !formData.category_id) {
      setError("Harap pilih Kelompok dan Kategori terlebih dahulu.");
      return;
    }
    
    setIsLoadingStudents(true);
    setError(null);

    console.log("isi form data", formData);
    
    const response = await getGenerusForFormAction(
      Number(formData.group_id),
      Number(formData.category_id)
    );
    console.log("isi response", response);
    
    if (!response.success || !response.data) {
      setError(response.error || "Gagal mengambil data generus.");
      setStudents([]);
      setAttendanceData({});
    } else {
      setStudents(response.data);
      // Inisialisasi/Pertahankan state presensi
      setAttendanceData((prev) => {
        const newData: Record<string, StudentAttendanceData> = {};
        for (const student of response.data!) {
          newData[student.user_id] = prev[student.user_id] || { p: 0, i: 0, a: 0 };
        }
        return newData;
      });
    }
    setIsLoadingStudents(false);
  };

  /**
   * Submit form
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // --- Validasi Klien ---
    const meetingCount = parseInt(formData.meeting_count, 10);
    if (isNaN(meetingCount) || meetingCount <= 0) {
      setError("Jumlah Pertemuan harus diisi (lebih dari 0).");
      return;
    }
    if (students.length === 0) {
      setError("Tidak ada data generus. Klik 'Tampilkan Generus' terlebih dahulu.");
      return;
    }
    
    // Validasi per siswa
    for (const student of students) {
      const data = attendanceData[student.user_id];
      const totalInput = (data.p || 0) + (data.i || 0) + (data.a || 0);
      if (totalInput !== meetingCount) {
        setError(
          `Data ${student.full_name} tidak valid. Total (H+I+A = ${totalInput}) tidak sama dengan Jumlah Pertemuan (${meetingCount}).`
        );
        return;
      }
    }

    // --- Siapkan Payload ---
    const payload: CreateRecapPayload = {
      group_id: Number(formData.group_id),
      category_id: Number(formData.category_id),
      period_month: Number(formData.period_month),
      period_year: Number(formData.period_year),
      meeting_count: meetingCount,
      raw_data: attendanceData,
    };

    startTransition(async () => {
      let response;
      if (isEditMode && initialData) {
        const updatePayload: UpdateRecapPayload = { ...payload, id: initialData.id };
        response = await updateRecapAction(updatePayload);
      } else {
        response = await createRecapAction(payload);
      }

      if (!response.success) {
        setError(response.message || "Terjadi kesalahan.");
      } else {
        setSuccess(response.message || "Rekap berhasil disimpan.");
        router.push("/kbmattendance");
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
            disabled={isAdminKelompok || isEditMode} // Kunci jika admin kelompok atau mode edit
            required
          />
          <SelectGroupV2
            label="Kategori (Kelas)"
            name="category_id"
            value={formData.category_id}
            onChange={handleFormChange}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            disabled={isEditMode} // Kunci jika mode edit
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

        {/* --- Bagian 2: Tombol & Jumlah Pertemuan --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <InputGroupV2
            label="Jumlah Pertemuan KBM"
            name="meeting_count"
            type="number"
            value={formData.meeting_count}
            onChange={handleFormChange}
            placeholder="cth: 12"
            min="0"
            required
            className="!mb-0"
          />
          {!isEditMode && (
             <button
              type="button"
              onClick={handleFetchStudents}
              disabled={isLoadingStudents || !formData.group_id || !formData.category_id}
              className="flex w-full justify-center rounded-lg bg-blue-600 py-3 px-5 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
            >
              {isLoadingStudents ? "Mencari..." : "Tampilkan Generus"}
            </button>
          )}
        </div>
        
        <hr className="my-4"/>

        {/* --- Bagian 3: Daftar Isian Siswa --- */}
        {isLoadingStudents ? (
          <div className="text-center p-4">Memuat data generus...</div>
        ) : students.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-black dark:text-white">
              Isi Presensi ({students.length} Generus)
            </h4>
            {students.map((student, index) => (
              <div key={student.user_id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center rounded border border-stroke p-3 dark:border-strokedark">
                <div className="md:col-span-1">
                  <p className="font-medium text-black dark:text-white">{index + 1}. {student.full_name}</p>
                </div>
                <InputGroupV2
                  label="Hadir (P)"
                  placeholder="Tuliskan jumlah hadir"
                  type="number"
                  name={`p_${student.user_id}`}
                  value={attendanceData[student.user_id]?.p || 0}
                  onChange={(e) => handleStudentDataChange(student.user_id, 'p', e.target.value)}
                  min="0"
                  max={formData.meeting_count}
                />
                <InputGroupV2
                  label="Izin (I)"
                  placeholder="Tuliskan jumlah izin"
                  type="number"
                  name={`i_${student.user_id}`}
                  value={attendanceData[student.user_id]?.i || 0}
                  onChange={(e) => handleStudentDataChange(student.user_id, 'i', e.target.value)}
                  min="0"
                  max={formData.meeting_count}
                />
                <InputGroupV2
                  label="Alpa (A)"
                  placeholder="Tuliskan jumlah alpa"
                  type="number"
                  name={`a_${student.user_id}`}
                  value={attendanceData[student.user_id]?.a || 0}
                  onChange={(e) => handleStudentDataChange(student.user_id, 'a', e.target.value)}
                  min="0"
                  max={formData.meeting_count}
                />
              </div>
            ))}
          </div>
        ) : (
          !isEditMode && <p className="text-center text-gray-600 dark:text-gray-400">Pilih kelompok dan kategori, lalu klik "Tampilkan Generus".</p>
        )}
        
        {/* --- Pesan Error/Sukses & Tombol Submit --- */}
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

        <button
          type="submit"
          className="mt-6 flex w-full justify-center rounded-lg bg-primary p-3 font-medium text-white hover:bg-opacity-90"
          disabled={isPending || students.length === 0}
        >
          {isPending ? "Menyimpan..." : (isEditMode ? "Perbarui Rekap" : "Simpan Rekap Baru")}
        </button>
      </div>
    </form>
  );
}