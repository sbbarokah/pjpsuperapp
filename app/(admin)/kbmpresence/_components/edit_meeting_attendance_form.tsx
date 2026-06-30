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
  initialData: any; // bisa diganti dengan MeetingAttendanceModel
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

  // Format datetime-local
  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState({
    group_id: String(initialData.group_id),
    category_ids: initialData.category_ids.map(String),
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
  const [studentStatus, setStudentStatus] = useState<Record<string, "H" | "I" | "A">>({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch ulang siswa berdasarkan group dan kategori yang mungkin berubah
  useEffect(() => {
    const fetchStudents = async () => {
      if (!formData.group_id || formData.category_ids.length === 0) return;
      setIsLoadingStudents(true);
      const res = await getStudentsByCategoriesAction(
        Number(formData.group_id),
        formData.category_ids.map(Number)
      );
      if (res.success && res.data) {
        const fetched = res.data as unknown as StudentData[];
        // Cocokkan status dari data lama
        const oldStudents = initialData.recapitulation?.students || [];
        const statusMap: Record<string, "H" | "I" | "A"> = {};
        fetched.forEach((s) => {
          // Cari berdasarkan full_name (lebih baik pakai user_id jika tersedia)
          const old = oldStudents.find(
            (o: any) => o.name === s.full_name
          );
          statusMap[s.user_id] = old ? old.status : "H";
        });
        setStudents(fetched);
        setStudentStatus(statusMap);
      } else {
        // Fallback: gunakan data dari initialData saja
        const oldStudents = initialData.recapitulation?.students || [];
        const fakeStudents: StudentData[] = oldStudents.map((s: any) => ({
          user_id: s.name,
          full_name: s.name,
          gender: s.gender,
          category_id: 0,
        }));
        const statusMap: Record<string, "H" | "I" | "A"> = {};
        oldStudents.forEach((s: any) => (statusMap[s.name] = s.status));
        setStudents(fakeStudents);
        setStudentStatus(statusMap);
      }
      setIsLoadingStudents(false);
    };
    fetchStudents();
  }, [initialData, formData.group_id, formData.category_ids]);

  // Handler form sama persis dengan create
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

  const handleStatusChange = (userId: string, status: "H" | "I" | "A") => {
    setStudentStatus((prev) => ({ ...prev, [userId]: status }));
  };

  const buildRecapitulation = (): MeetingRecapitulation => {
    // Sama persis dengan di create form
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
      gender: student.gender,
      status: studentStatus[student.user_id] || "H",
      category: student.category_id,
    }));

    return {
      summary: { h, i, a, pct_h },
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

  // Render JSX sama persis dengan form create, ganti judul tombol submit
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5.5">
      {/* Sama dengan create, hanya saja tombol submit: "Perbarui Kehadiran" */}
      {/* ... (seluruh UI dari CreateMeetingAttendanceForm) ... */}
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