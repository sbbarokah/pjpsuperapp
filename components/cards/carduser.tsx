// app/generus/_components/usercard.tsx

import { UserAdminView } from "@/lib/types/user.types";
import { DataCard } from "@/components/cards/datacard";
import { calculateAge } from "@/lib/utils";

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
      bgColor = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      text = "Admin Kelompok";
      break;
  }

  return (
    <span className={`w-fit px-2 py-0.5 text-xs font-medium rounded-full ${bgColor}`}>
      {text}
    </span>
  );
};

// Badge untuk Gender
const GenderBadge = ({ gender }: { gender?: string | null }) => {
  if (!gender) return null;
  const lower = gender.toLowerCase();
  let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  let label = gender;
  if (lower === 'l') {
    bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    label = "Laki-laki";
  } else if (lower === 'p') {
    bgColor = "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
    label = "Perempuan";
  }
  return (
    <span className={`w-fit px-2 py-0.5 text-xs font-medium rounded-full ${bgColor}`}>
      {label}
    </span>
  );
};

// Badge untuk Kategori
const CategoryBadge = ({ category }: { category?: { name: string } | null }) => {
  if (!category?.name) return null;
  return (
    <span className="w-fit px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
      {category.name}
    </span>
  );
};

type UserCardProps = {
  user: UserAdminView;
  actions?: React.ReactNode;
  href?: string;
};

export function UserCard({ user, actions, href }: UserCardProps) {
  const age = calculateAge(user.birth_date);

  // Warna border kiri berdasarkan gender (tetap dipertahankan)
  const genderBorderClass = (gender?: string | null) => {
    if (!gender) return "border-l-gray-300";
    if (gender.toLowerCase() === 'l') return "border-l-blue-500";
    if (gender.toLowerCase() === 'p') return "border-l-pink-500";
    return "border-l-gray-300";
  };

  return (
    <DataCard
      actions={actions}
      href={href}
      className={`border-l-4 ${genderBorderClass(user.gender)}`}
    >
      <div className="flex h-full flex-col gap-3">
        {/* Header: Nama dan Badge (Role, Gender, Kategori) */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-black dark:text-white truncate">
            {user.full_name || user.username}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <RoleBadge role={user.role} />
            <GenderBadge gender={user.gender} />
            <CategoryBadge category={user.category} />
          </div>
        </div>

        {/* Detail Kontak & Info Pribadi (gender sudah di badge, jadi tidak diulang) */}
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
          {user.school_name !== null && (
            <p>
              Sekolah:{" "}
              <span className="font-medium text-black dark:text-white">
                {user.school_name}
              </span>
            </p>
          )}
        </div>

        {/* Detail Kelompok (kategori sudah di badge) */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {user.group?.name && (
            <p>
              Kelompok:{" "}
              <span className="font-semibold text-black dark:text-white">
                {user.group.name}
              </span>
            </p>
          )}
        </div>

        {/* Footer: Info Lokasi */}
        <div className="mt-auto border-t border-gray-100 pt-3 dark:border-boxdark-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {user.village?.name ? (
              <p>
                Desa:{" "}
                <span className="font-semibold text-black dark:text-white">
                  {user.village.name}
                </span>
              </p>
            ) : (
              <p className="italic">Belum ada data desa.</p>
            )}
          </div>
        </div>
      </div>
    </DataCard>
  );
}