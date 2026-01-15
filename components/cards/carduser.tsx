// app/generus/_components/usercard.tsx

import { UserAdminView } from "@/lib/types/user.types";
import { DataCard } from "@/components/cards/datacard"; // Asumsi DataCard Anda

function calculateAge(birthDateString?: string | null): number | null {
  if (!birthDateString) {
    return null;
  }
  
  try {
    const birthDate = new Date(birthDateString);
    // Cek jika tanggal valid
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error("Invalid birth_date format:", error);
    return null;
  }
}

// Pastikan komponen ini ada di file ini atau diimpor
const RoleBadge = ({ role }: { role: string | null }) => {
  let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  let text = role || "user";

  switch (role) {
    case "superadmin":
      bgColor = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      text = "Superadmin";
      break;
    case "admin_desa":
      bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      text = "Admin Desa";
      break;
    case "admin_kelompok":
      bgColor =
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      text = "Admin Kelompok";
      break;
  }

  return (
    <span
      className={`w-fit px-2 py-0.5 text-xs font-medium rounded-full ${bgColor}`}
    >
      {text}
    </span>
  );
};


// --- Komponen UserCard Utama ---
type UserCardProps = {
  user: UserAdminView;
  actions?: React.ReactNode;
  href?: string;
};


export function UserCard({ user, actions, href }: UserCardProps) {
  // Hitung umur dari birth_date
  const age = calculateAge(user.birth_date);

  return (
    <DataCard actions={actions} href={href}>
      <div className="flex h-full flex-col gap-3">
        {/* Header: Nama dan Role */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-black dark:text-white truncate">
            {user.full_name || user.username}
          </h3>
          <RoleBadge role={user.role} />
        </div>

        {/* [PERUBAHAN] Detail Kontak & Info Pribadi */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className="truncate">
            Email:{" "}
            <span className="font-medium text-black dark:text-white">
              {user.email}
            </span>
          </p>
          {age !== null && (
            <p>
              Umur:{" "}
              <span className="font-medium text-black dark:text-white">
                {age} tahun
              </span>
            </p>
          )}
        </div>
        
        {/* [PERUBAHAN] Detail Klasifikasi (Grup & Kategori) */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {user.group?.name ? (
              <p>
                Kelompok:{" "}
                <span className="font-semibold text-black dark:text-white">
                  {user.group.name}
                </span>
              </p>
            ) : null}
            
          {user.category?.name ? (
              <p>
                Kategori:{" "}
                <span className="font-semibold text-black dark:text-white">
                  {user.category.name}
                </span>
              </p>
            ) : null}
        </div>

        {/* Footer: Info Lokasi (didorong ke bawah) */}
        <div className="mt-auto border-t border-gray-100 pt-3 dark:border-boxdark-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {user?.village?.name ? (
              <p>
                Desa:{" "}
                <span className="font-semibold text-black dark:text-white">
                  {user.village.name}
                </span>
              </p>
            ) : null}

            {!user.village?.name && (
              <p className="italic">Belum ada data desa.</p>
            )}
          </div>
        </div>
      </div>
    </DataCard>
  );
}