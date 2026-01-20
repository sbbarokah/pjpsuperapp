"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AttendanceRawData,
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
import { FaTrash } from "react-icons/fa";

interface RecapFormProps {
  admin: Profile;
  groups: GroupModel[];
  categories: CategoryModel[];
  initialData?: AttendanceRecapModel | null;
}

type Generus = Pick<Profile, "user_id" | "full_name" | "gender"> & {
  is_deleted?: boolean; // Flag penanda siswa histori
};

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

  // State untuk menyimpan hitungan gender
  const [genderCounts, setGenderCounts] = useState({ m: 0, f: 0, t: 0 });
  
  // State untuk input dinamis per siswa
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceData>>({});

  // --- Efek untuk memuat siswa jika mode Edit ---
  useEffect(() => {
    if (isEditMode && initialData) {
      setAttendanceData(initialData.raw_data.attendances);
      
      // Populate gender counts dari raw_data
      setGenderCounts({
        m: initialData.raw_data.count_male,
        f: initialData.raw_data.count_female,
        t: initialData.raw_data.count_total
      });

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
      setGenderCounts({ m: 0, f: 0, t: 0 });
    }
  };

  /**
   * FITUR: Exclude Student
   * Mengeluarkan siswa dari laporan dan memperbarui sensus gender
   */
  const handleExcludeStudent = (userId: string) => {
    const studentToExclude = students.find(s => s.user_id === userId);
    if (!studentToExclude) return;

    setStudents(prev => prev.filter(s => s.user_id !== userId));
    setAttendanceData(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    setGenderCounts(prev => {
      const isMale = studentToExclude.gender === 'L';
      return {
        m: isMale ? Math.max(0, prev.m - 1) : prev.m,
        f: !isMale ? Math.max(0, prev.f - 1) : prev.f,
        t: Math.max(0, prev.t - 1)
      };
    });
  };

  const handleStudentDataChange = (
    userId: string,
    field: 'p' | 'i' | 'a',
    value: string,
    studentName: string 
  ) => {
    const numValue = parseInt(value, 10) || 0;
    
    setAttendanceData((prev) => {
      const prevData = prev[userId] || { p: 0, i: 0, a: 0 };
      
      return {
        ...prev,
        [userId]: {
          ...prevData,
          name: studentName, // Pastikan nama selalu ter-set / ter-update
          [field]: numValue,
        },
      };
    });
  };
  
  /**
   * Mengambil daftar generus dari server action
   * Menginisialisasi attendanceData dengan menyertakan nama siswa
   * Mengambil data siswa aktif DAN mempertahankan siswa histori (yang sudah dihapus)
   */
  const handleFetchStudents = async (isInitialLoad = false) => {
    if (!formData.group_id || !formData.category_id) {
      if (!isInitialLoad) setError("Harap pilih Kelompok dan Kategori terlebih dahulu.");
      return;
    }
    
    setIsLoadingStudents(true);
    setError(null);

    // 1. Ambil Siswa Aktif dari Server
    const response = await getGenerusForFormAction(
      Number(formData.group_id),
      Number(formData.category_id)
    );
    
    if (!response.success || !response.data) {
      setError(response.error || "Gagal mengambil data generus.");
      setStudents([]); 
    } else {
      const activeStudents = response.data as Generus[];
      
      // 2. Logic Mempertahankan "Ghost Students" (Siswa Terhapus)
      // Hanya berjalan jika kita punya data lama (attendanceData/initialData)
      let combinedStudents = [...activeStudents];
      
      // Ambil daftar ID siswa yang aktif untuk pengecekan cepat
      const activeStudentIds = new Set(activeStudents.map(s => s.user_id));

      // Loop keys dari data presensi yang sedang dipegang (state atau initial)
      // Kita gunakan 'attendanceData' state karena itu sumber kebenaran saat ini
      const currentAttendanceIds = Object.keys(attendanceData);
      
      currentAttendanceIds.forEach((existingId) => {
        // Jika ada ID di data presensi TAPI tidak ada di daftar aktif
        if (!activeStudentIds.has(existingId)) {
          const ghostData = attendanceData[existingId];
          
          // Buat object Generus 'palsu' berdasarkan data snapshot
          const ghostStudent: Generus = {
            user_id: existingId,
            full_name: ghostData.name || "Siswa Terhapus / Tanpa Nama",
            gender: 'L', // Default karena kita tdk tau gendernya dr snapshot (opsional: simpan gender di snapshot jg)
            is_deleted: true, // Tandai sebagai terhapus
          };
          
          // Masukkan ke daftar tampilan
          combinedStudents.push(ghostStudent);
        }
      });

      // Sort agar rapi (opsional, misal yang terhapus ditaruh paling bawah atau urut abjad)
      combinedStudents.sort((a, b) => a.full_name.localeCompare(b.full_name));

      // 3. Update State Students dengan daftar gabungan
      setStudents(combinedStudents);

      // Hitung Gender (hanya dari yang aktif atau semua? biasanya sensus hanya yg aktif)
      let m = 0; let f = 0;
      activeStudents.forEach((s) => {
        if (s.gender === 'L') m++;
        else if (s.gender === 'P') f++;
      });
      // Jika ingin menghitung total termasuk yg terhapus, loop combinedStudents
      setGenderCounts({ m, f, t: activeStudents.length }); // Sensus biasanya snapshot realtime yg aktif

      // 4. Update/Perbaiki Attendance Data
      setAttendanceData((prev) => {
        const newData: Record<string, StudentAttendanceData> = { ...prev };
        
        // Update nama siswa AKTIF (jika ada koreksi nama di master)
        activeStudents.forEach(student => {
            const existing = prev[student.user_id];
            newData[student.user_id] = {
                name: student.full_name, // Selalu refresh nama dari master
                p: existing?.p || 0,
                i: existing?.i || 0,
                a: existing?.a || 0,
            };
        });
        
        // Siswa GHOST tidak perlu di-update namanya (karena master data ga punya),
        // biarkan pakai nama yang ada di `prev` (snapshot lama).
        
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

    const meetingCount = parseInt(formData.meeting_count, 10);
    if (isNaN(meetingCount) || meetingCount <= 0) {
      setError("Jumlah Pertemuan harus diisi (lebih dari 0).");
      return;
    }
    if (students.length === 0) {
      setError("Tidak ada data generus. Klik 'Tampilkan Generus' terlebih dahulu.");
      return;
    }
    
    for (const student of students) {
      const data = attendanceData[student.user_id];
      const safeP = data?.p || 0;
      const safeI = data?.i || 0;
      const safeA = data?.a || 0;

      const totalInput = safeP + safeI + safeA;
      if (totalInput !== meetingCount) {
        setError(
          `Data ${student.full_name} tidak valid. Total (H+I+A = ${totalInput}) tidak sama dengan Jumlah Pertemuan (${meetingCount}).`
        );
        return;
      }
    }

    // Siapkan raw_data dengan struktur baru (termasuk sensus)
    const rawDataPayload: AttendanceRawData = {
      count_male: genderCounts.m,
      count_female: genderCounts.f,
      count_total: genderCounts.t,
      attendances: attendanceData
    };

    const payload: CreateRecapPayload = {
      group_id: Number(formData.group_id),
      category_id: Number(formData.category_id),
      period_month: Number(formData.period_month),
      period_year: Number(formData.period_year),
      meeting_count: meetingCount,
      raw_data: rawDataPayload,
    };

    startTransition(async () => {
      let response;
      if (isEditMode && initialData) {
        const updatePayload: UpdateRecapPayload = { ...payload, id: initialData?.id || "" };
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
              onClick={() => handleFetchStudents(false)}
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
              <div 
                key={student.user_id} 
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-lg border border-stroke p-4 dark:border-strokedark transition-all hover:shadow-md ${
                  student.is_deleted ? "bg-red-50 dark:bg-red-900/10 border-red-200" : "bg-white dark:bg-boxdark"
                }`}
              >
                {/* <div className="md:col-span-1"> */}
                <div className="md:col-span-3 flex items-start gap-3">
                  <p className={`font-medium ${student.is_deleted ? "text-red-500" : "text-black dark:text-white"}`}>
                    {index + 1}. {student.full_name} 
                    {student.is_deleted && <span className="text-xs ml-2 italic">(Data Lama/Terhapus)</span>}
                  </p>
                </div>
                <div className="md:col-span-8 grid grid-cols-3 gap-3">
                  <InputGroupV2
                    label="Hadir (P)"
                    placeholder="Tuliskan jumlah hadir"
                    type="number"
                    name={`p_${student.user_id}`}
                    value={attendanceData[student.user_id]?.p || 0}
                    onChange={(e) => handleStudentDataChange(student.user_id, 'p', e.target.value, student.full_name)}
                    min="0"
                    max={formData.meeting_count}
                  />
                  <InputGroupV2
                    label="Izin (I)"
                    placeholder="Tuliskan jumlah izin"
                    type="number"
                    name={`i_${student.user_id}`}
                    value={attendanceData[student.user_id]?.i || 0}
                    onChange={(e) => handleStudentDataChange(student.user_id, 'i', e.target.value, student.full_name)}
                    min="0"
                    max={formData.meeting_count}
                  />
                  <InputGroupV2
                    label="Alpa (A)"
                    placeholder="Tuliskan jumlah alpa"
                    type="number"
                    name={`a_${student.user_id}`}
                    value={attendanceData[student.user_id]?.a || 0}
                    onChange={(e) => handleStudentDataChange(student.user_id, 'a', e.target.value, student.full_name)}
                    min="0"
                    max={formData.meeting_count}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleExcludeStudent(student.user_id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title="Keluarkan dari laporan ini"
                  >
                    <FaTrash />
                  </button>
                </div>
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