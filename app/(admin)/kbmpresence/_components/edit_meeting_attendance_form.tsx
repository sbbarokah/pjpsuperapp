"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Profile } from "@/lib/types/user.types";
import { GroupModel, CategoryModel } from "@/lib/types/master.types";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";
import { InputGroupV2 } from "@/components/forms/input_group_v2";
import {
  CreateMeetingAttendanceDto,
  MeetingMaterial,
  MeetingRecapitulation,
} from "@/lib/types/presence.types";
import { getStudentsByCategoriesAction, updateMeetingAttendanceAction } from "../actions";

type AttendanceStatus = "HSDC" | "H" | "I" | "S" | "A";

interface StudentData {
  user_id: string;
  full_name: string;
  gender: "L" | "P";
  category_id: number;
  category?: { name: string } | null;
}

interface EditFormProps {
  admin: Profile;
  groups: GroupModel[];
  categories: CategoryModel[];
  initialData: any;
}

export function EditMeetingAttendanceForm({
  admin,
  groups,
  categories,
  initialData,
}: EditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isAdminKelompok = admin.role === "admin_kelompok";

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState({
    group_id: String(initialData.group_id),
    category_ids: initialData.category_ids?.map(String) || [],
    datetime: formatDateTime(initialData.datetime),
    activity: initialData.activity,
    activity_type: (initialData.activity_type as "Sambung" | "Khusus") || "Sambung",
    activity_level: (initialData.activity_level as "Kelompok" | "Desa" | "Daerah") || "Desa",
    place: initialData.place || "",
  });

  const [materials, setMaterials] = useState<MeetingMaterial[]>(
    initialData.material?.length
      ? initialData.material
      : [{ id: crypto.randomUUID(), topic: "", presenter: "" }]
  );

  const [students, setStudents] = useState<StudentData[]>([]);
  const [studentStatus, setStudentStatus] = useState<Record<string, AttendanceStatus>>({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fungsi fetch siswa (digunakan oleh tombol dan useEffect)
  const fetchStudents = async (group_id: string, category_ids: string[]) => {
    if (!group_id || category_ids.length === 0) {
      setError("Pilih kelompok dan minimal satu kategori.");
      return;
    }
    setIsLoadingStudents(true);
    setError(null);

    const res = await getStudentsByCategoriesAction(
      Number(group_id),
      category_ids.map(Number)
    );

    if (!res.success || !res.data) {
      setError(res.error || "Gagal memuat siswa.");
      setStudents([]);
      setStudentStatus({});
    } else {
      const fetched = res.data as unknown as StudentData[];
      // Cocokkan dengan data lama berdasarkan nama (atau user_id jika tersedia)
      const oldStudents = initialData.recapitulation?.students || [];
      const statusMap: Record<string, AttendanceStatus> = {};
      fetched.forEach((s) => {
        const old = oldStudents.find((o: any) => o.name === s.full_name);
        statusMap[s.user_id] = old ? old.status : "H";
      });
      setStudents(fetched);
      setStudentStatus(statusMap);
    }
    setIsLoadingStudents(false);
  };

  // Inisialisasi siswa saat komponen mount
  useEffect(() => {
    if (formData.group_id && formData.category_ids.length > 0) {
      fetchStudents(formData.group_id, formData.category_ids);
    } else {
      // Fallback ke data dari initialData (jika tidak ada group/kategori)
      const oldStudents = initialData.recapitulation?.students || [];
      const fakeStudents: StudentData[] = oldStudents.map((s: any) => ({
        user_id: s.name,
        full_name: s.name,
        gender: s.gender || "L",
        category_id: 0,
      }));
      const statusMap: Record<string, AttendanceStatus> = {};
      oldStudents.forEach((s: any) => {
        statusMap[s.name] = s.status;
      });
      setStudents(fakeStudents);
      setStudentStatus(statusMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev) => ({ ...prev, category_ids: selected }));
  };

  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), topic: "", presenter: "" },
    ]);
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMaterialChange = (id: string, field: keyof MeetingMaterial, value: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleFetchStudents = () => {
    fetchStudents(formData.group_id, formData.category_ids);
  };

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setStudentStatus((prev) => ({ ...prev, [userId]: status }));
  };

  const buildRecapitulation = (): MeetingRecapitulation => {
    const total = students.length;
    let h_sdc = 0,
      h = 0,
      i = 0,
      s = 0,
      a = 0;
    const by_category: Record<
      string,
      { h_sdc: number; h: number; i: number; s: number; a: number; total: number }
    > = {};

    students.forEach((student) => {
      const status = studentStatus[student.user_id] || "H";
      if (status === "HSDC") h_sdc++;
      else if (status === "H") h++;
      else if (status === "I") i++;
      else if (status === "S") s++;
      else if (status === "A") a++;

      const catId = String(student.category_id);
      if (!by_category[catId]) {
        by_category[catId] = { h_sdc: 0, h: 0, i: 0, s: 0, a: 0, total: 0 };
      }
      by_category[catId].total++;
      if (status === "HSDC") by_category[catId].h_sdc++;
      else if (status === "H") by_category[catId].h++;
      else if (status === "I") by_category[catId].i++;
      else if (status === "S") by_category[catId].s++;
      else if (status === "A") by_category[catId].a++;
    });

    const pct_hsdc = total ? Math.round((h_sdc / total) * 100) : 0;
    const pct_h = total ? Math.round((h / total) * 100) : 0;
    const pct_htot = total ? Math.round(((h_sdc + h + i + s) / total) * 100) : 0;

    const byCategoryFinal: Record<
      string,
      { h_sdc: number; h: number; i: number; s: number; a: number; pct_hsdc: number; pct_h: number; pct_htot: number }
    > = {};
    Object.entries(by_category).forEach(([catId, counts]) => {
      const catTotal = counts.total;
      byCategoryFinal[catId] = {
        h_sdc: counts.h_sdc,
        h: counts.h,
        i: counts.i,
        s: counts.s,
        a: counts.a,
        pct_hsdc: catTotal ? Math.round((counts.h_sdc / catTotal) * 100) : 0,
        pct_h: catTotal ? Math.round((counts.h / catTotal) * 100) : 0,
        pct_htot: catTotal
          ? Math.round(((counts.h_sdc + counts.h + counts.i + counts.s) / catTotal) * 100)
          : 0,
      };
    });

    const studentsArray = students.map((student) => ({
      name: student.full_name,
      gender: student.gender,
      status: (studentStatus[student.user_id] || "H") as AttendanceStatus,
      category: student.category_id,
    }));

    return {
      summary: {
        h_sdc,
        h,
        i,
        s,
        a,
        pct_hsdc,
        pct_h,
        pct_htot,
      },
      by_category: byCategoryFinal,
      students: studentsArray,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.datetime || !formData.activity.trim() || !formData.place.trim()) {
      setError("Lengkapi tanggal & waktu, kegiatan, dan tempat.");
      return;
    }
    if (students.length === 0) {
      setError("Tidak ada data siswa.");
      return;
    }

    const cleanMaterials = materials.filter((m) => m.topic.trim() !== "");
    const recapitulation = buildRecapitulation();

    const payload: CreateMeetingAttendanceDto = {
      village_id: Number(admin.village_id),
      group_id: Number(formData.group_id),
      category_ids: formData.category_ids.map(Number),
      datetime: new Date(formData.datetime).toISOString(),
      activity: formData.activity.trim(),
      activity_type: formData.activity_type,
      activity_level: formData.activity_level,
      place: formData.place.trim(),
      material: cleanMaterials,
      recapitulation,
      notes: null,
    };

    startTransition(async () => {
      const res = await updateMeetingAttendanceAction(initialData.id, payload);
      if (!res.success) {
        setError(res.message || "Gagal menyimpan.");
      } else {
        setSuccess(res.message);
        router.push("/kbmpresence");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5.5">
      {/* 1. Kelompok & Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectGroupV2
          label="Kelompok"
          name="group_id"
          value={formData.group_id}
          onChange={handleFormChange}
          options={groups.map((g) => ({ value: String(g.id), label: g.name }))}
          disabled={isAdminKelompok}
          required
        />
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
            Kategori (Kelas) <span className="text-red-500">*</span>
          </label>
          <select
            multiple
            name="category_ids"
            value={formData.category_ids}
            onChange={handleCategoryChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            size={4}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Gunakan Ctrl+klik untuk memilih beberapa kategori
          </p>
        </div>
      </div>

      {/* 2. Tanggal & Waktu */}
      <InputGroupV2
        label="Tanggal & Waktu KBM"
        name="datetime"
        type="datetime-local"
        placeholder="Tanggal dan waktu KBM"
        value={formData.datetime}
        onChange={handleFormChange}
        required
      />

      {/* 3. Kegiatan, Tipe, Level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputGroupV2
          label="Kegiatan"
          name="activity"
          type="text"
          value={formData.activity}
          onChange={handleFormChange}
          placeholder="Nama kegiatan"
          required
        />
        <SelectGroupV2
          label="Tipe Kegiatan"
          name="activity_type"
          value={formData.activity_type}
          onChange={handleFormChange}
          options={[
            { value: "Sambung", label: "Sambung" },
            { value: "Khusus", label: "Khusus" },
          ]}
          required
        />
        <SelectGroupV2
          label="Level Kegiatan"
          name="activity_level"
          value={formData.activity_level}
          onChange={handleFormChange}
          options={[
            { value: "Kelompok", label: "Kelompok" },
            { value: "Desa", label: "Desa" },
            { value: "Daerah", label: "Daerah" },
          ]}
          required
        />
      </div>

      {/* 4. Tempat */}
      <InputGroupV2
        label="Tempat"
        name="place"
        type="text"
        value={formData.place}
        onChange={handleFormChange}
        placeholder="Nama tempat"
        required
      />

      {/* 5. Material */}
      <div>
        <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Materi / Pengisi
        </label>
        <div className="flex flex-col gap-3">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="flex flex-col gap-3 rounded-lg border border-stroke p-3 dark:border-strokedark"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Topik"
                  value={mat.topic}
                  onChange={(e) => handleMaterialChange(mat.id, "topic", e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:flex-1"
                />
                <input
                  type="text"
                  placeholder="Pemateri"
                  value={mat.presenter}
                  onChange={(e) => handleMaterialChange(mat.id, "presenter", e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:flex-1"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Hal."
                    value={mat.pages || ""}
                    onChange={(e) => handleMaterialChange(mat.id, "pages", e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:flex-1"
                  />
                  {materials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMaterial(mat.id)}
                      className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMaterial}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span>+</span> Tambah Materi
        </button>
      </div>

      {/* 6. Tombol Tampilkan Generus */}
      <button
        type="button"
        onClick={handleFetchStudents}
        disabled={isLoadingStudents || !formData.group_id || formData.category_ids.length === 0}
        className="flex w-full justify-center rounded-lg bg-blue-600 py-3 px-5 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
      >
        {isLoadingStudents ? "Mencari..." : "Tampilkan Generus"}
      </button>

      <hr className="my-2" />

      {/* 7. Daftar Siswa */}
      {isLoadingStudents ? (
        <div className="text-center p-4">Memuat data siswa...</div>
      ) : students.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold text-black dark:text-white">
            Daftar Kehadiran ({students.length} Siswa)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 dark:bg-meta-4">
                  <th className="p-3 text-left text-sm font-medium uppercase">No</th>
                  <th className="p-3 text-left text-sm font-medium uppercase">Nama</th>
                  <th className="p-3 text-center text-sm font-medium uppercase">Hadir SDC</th>
                  <th className="p-3 text-center text-sm font-medium uppercase">Hadir</th>
                  <th className="p-3 text-center text-sm font-medium uppercase">Izin</th>
                  <th className="p-3 text-center text-sm font-medium uppercase">Sakit</th>
                  <th className="p-3 text-center text-sm font-medium uppercase">Alfa</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.user_id} className="border-b border-stroke dark:border-strokedark">
                    <td className="p-3 text-sm">{idx + 1}</td>
                    <td className="p-3 text-sm font-medium">{student.full_name}</td>
                    {(["HSDC", "H", "I", "S", "A"] as const).map((status) => (
                      <td key={status} className="p-3 text-center">
                        <input
                          type="radio"
                          name={`status_${student.user_id}`}
                          value={status}
                          checked={studentStatus[student.user_id] === status}
                          onChange={() => handleStatusChange(student.user_id, status)}
                          className="h-5 w-5 accent-primary"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Pilih kelompok dan kategori, lalu klik "Tampilkan Generus".
        </p>
      )}

      {/* Error / Success */}
      {error && (
        <div className="rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-green-500 bg-green-100 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || students.length === 0}
        className="mt-4 flex w-full justify-center rounded-lg bg-primary p-3 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Perbarui Kehadiran"}
      </button>
    </form>
  );
}