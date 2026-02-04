import Breadcrumb from "@/components/ui/breadcrumb";
import { getAuthenticatedUserAndProfile } from "@/lib/services/authService";
import { getProkerById } from "@/lib/services/prokerService"; // [FIX] Gunakan service proker
import { notFound } from "next/navigation";
import { ProkerForm } from "../../_components/proker_form";

export const metadata = {
  title: "Edit Program Kerja | Admin",
};

interface EditProkerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProkerPage({ params }: EditProkerPageProps) {
  // 1. Unwrap params (Next.js 15)
  const { id } = await params;

  // 2. Auth Check
  let profile;
  try {
    const authData = await getAuthenticatedUserAndProfile();
    profile = authData.profile;
  } catch (error) {
    return (
        <>
            <Breadcrumb pageName="Akses Ditolak" />
            <div className="p-6">Sesi berakhir, silakan login kembali.</div>
        </>
    );
  }

  // 3. Fetch Data Proker
  const proker = await getProkerById(id);

  if (!proker) {
    notFound();
  }

  // 4. Validasi Hak Akses (RBAC)
  const isSuperAdmin = profile.role === "superadmin";
  
  // Cek Admin Desa (Harus desa yang sama)
  const isAdminDesaValid = 
    profile.role === "admin_desa" && 
    String(proker.village_id) === String(profile.village_id);

  // Cek Admin Kelompok (Harus kelompok yang sama)
  const isAdminKelompokValid = 
    profile.role === "admin_kelompok" && 
    String(proker.group_id) === String(profile.group_id);

  const canEdit = isSuperAdmin || isAdminDesaValid || isAdminKelompokValid;

  if (!canEdit) {
     return (
      <>
        <Breadcrumb pageName="Akses Ditolak" />
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-red-500">
            Anda tidak memiliki izin untuk mengedit program kerja ini.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Ubah Program Kerja" showNav={false} />
      <div className="grid grid-cols-1 gap-9">
        <div className="flex flex-col gap-9">
          {/* Container Form */}
          <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Formulir Edit Program Kerja
              </h3>
            </div>
            
            {/* Render Form dengan data awal */}
            <div className="p-6.5">
                <ProkerForm initialData={proker} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}