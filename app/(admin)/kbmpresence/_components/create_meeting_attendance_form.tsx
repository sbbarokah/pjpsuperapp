"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Profile } from "@/lib/types/user.types";
import { GroupModel, CategoryModel } from "@/lib/types/master.types";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";
import { InputGroupV2 } from "@/components/forms/input_group_v2";
import { CreateMeetingAttendanceDto, MeetingMaterial, MeetingRecapitulation } from "@/lib/types/presence.types";
import { createMeetingAttendanceAction, getStudentsByCategoriesAction } from "../actions";

interface StudentData {
  user_id: string;
  full_name: string;
  gender: "L" | "P";
  category_id: number;
  category?: { name: string } | null; // opsional jika dari join
}

interface FormProps {
  admin: Profile;
  groups: GroupModel[];
  categories: CategoryModel[];
}

export function CreateMeetingAttendanceForm({ admin, groups, categories }: FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdminKelompok = admin.role === "admin_kelompok";

  const now = new Date();
  const currentDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // State form
  const [formData, setFormData] = useState({
    group_id: String(isAdminKelompok ? admin.group_id : ""),
    category_ids: [] as string[],
    datetime: currentDateTime,
    activity: "Pengajian Kelompok",
    activity_type: "Sambung" as "Sambung" | "Khusus",
    activity_level: (isAdminKelompok ? "Kelompok" : "Desa") as
      | "Kelompok"
      | "Desa"
      | "Daerah",
    place: "Masjid Kelompok",
  });

  // State material dinamis
  const [materials, setMaterials] = useState<MeetingMaterial[]>([
    { id: crypto.randomUUID(), topic: "", presenter: "" },
  ]);

  const [students, setStudents] = useState<StudentData[]>([]);
  const [studentStatus, setStudentStatus] = useState<Record<string, "H" | "I" | "A">>({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Multi‑select categories
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev) => ({ ...prev, category_ids: selected }));
  };

  // Material handlers
  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), topic: "", presenter: "" },
    ]);
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMaterialChange = (
    id: string,
    field: keyof MeetingMaterial,
    value: string
  ) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Ambil siswa berdasarkan group & categories
  const handleFetchStudents = async () => {
    if (!formData.group_id || formData.category_ids.length === 0) {
      setError("Pilih kelompok dan minimal satu kategori.");
      return;
    }
    setIsLoadingStudents(true);
    setError(null);

    const res = await getStudentsByCategoriesAction(
      Number(formData.group_id),
      formData.category_ids.map(Number)
    );

    if (!res.success || !res.data) {
      setError(res.error || "Gagal memuat siswa.");
      setStudents([]);
    } else {
      const fetched = res.data as unknown as StudentData[];
      setStudents(fetched);
      // Inisialisasi semua Hadir
      const initial: Record<string, "H" | "I" | "A"> = {};
      fetched.forEach((s) => {
        initial[s.user_id] = "H";
      });
      setStudentStatus(initial);
    }
    setIsLoadingStudents(false);
  };

  // Ubah status per siswa
  const handleStatusChange = (userId: string, status: "H" | "I" | "A") => {
    setStudentStatus((prev) => ({ ...prev, [userId]: status }));
  };

  // Hitung recapitulation sebelum submit
  const buildRecapitulation = (): MeetingRecapitulation => {
    const total = students.length;
    let h = 0,
      i = 0,
      a = 0;
    const by_category: Record<string, { h: number; i: number; a: number; total: number }> = {};

    students.forEach((student) => {
      const status = studentStatus[student.user_id] || "H";
      if (status === "H") h++;
      else if (status === "I") i++;
      else if (status === "A") a++;

      const catId = String(student.category_id);
      if (!by_category[catId]) {
        by_category[catId] = { h: 0, i: 0, a: 0, total: 0 };
      }
      by_category[catId].total++;
      by_category[catId][status === "H" ? "h" : status === "I" ? "i" : "a"]++;
    });

    const pct_h = total ? Math.round((h / total) * 100) : 0;

    const byCategoryFinal: Record<string, { h: number; i: number; a: number; pct_h: number }> = {};
    Object.entries(by_category).forEach(([catId, counts]) => {
      byCategoryFinal[catId] = {
        h: counts.h,
        i: counts.i,
        a: counts.a,
        pct_h: counts.total ? Math.round((counts.h / counts.total) * 100) : 0,
      };
    });

    const studentsArray = students.map((student) => ({
      name: student.full_name,
      gender: student.gender, // pastikan data gender tersedia dari getStudentsByCategoriesAction
      status: (studentStatus[student.user_id] || "H") as "H" | "I" | "A",
      category: student.category_id
    }));

    return {
      summary: { h, i, a, pct_h },
      by_category: byCategoryFinal,
      students: studentsArray, // <-- sekarang array
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validasi
    if (!formData.datetime || !formData.activity.trim() || !formData.place.trim()) {
      setError("Lengkapi tanggal & waktu, kegiatan, dan tempat.");
      return;
    }
    if (students.length === 0) {
      setError("Belum ada data generus. Klik 'Tampilkan Generus'.");
      return;
    }

    // Filter material yang tidak kosong
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
      const res = await createMeetingAttendanceAction(payload);
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

      {/* 5. Material (dinamis) */}
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

      {/* 7. Daftar Siswa & Status */}
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
                  <th className="p-3 text-center text-sm font-medium uppercase">Hadir</th>
                  <th className="p-3 text-center text-sm font-medium uppercase">Izin</th>
                  <th className="p-3 text-center text-sm font-medium uppercase">Alfa</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr
                    key={student.user_id}
                    className="border-b border-stroke dark:border-strokedark"
                  >
                    <td className="p-3 text-sm">{idx + 1}</td>
                    <td className="p-3 text-sm font-medium">{student.full_name}</td>
                    {(["H", "I", "A"] as const).map((status) => (
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
          Pilih kelompok dan kategori, lalu klik &quot;Tampilkan Generus&quot;.
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

      {/* Tombol Submit */}
      <button
        type="submit"
        disabled={isPending || students.length === 0}
        className="mt-4 flex w-full justify-center rounded-lg bg-primary p-3 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Kehadiran"}
      </button>
    </form>
  );
}