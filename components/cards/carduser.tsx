// app/generus/_components/usercard.tsx

import { UserAdminView } from "@/lib/types/user.types"; // Impor tipe Anda
import { DataCard } from "@/components/cards/datacard"; // Impor DataCard generik Anda

type UserCardProps = {
  user: UserAdminView;
  actions?: React.ReactNode;
  href?: string;
};

// Helper untuk format nama
const formatName = (user: UserAdminView) => {
  const name = `${user.front_name || ""} ${user.last_name || ""}`.trim();
  return name || user.username || "Tanpa Nama"; // Fallback ke username
};

// Helper untuk badge role
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

export function UserCard({ user, actions, href }: UserCardProps) {
  return (
    <DataCard actions={actions} href={href}>
      {/* DataCard harusnya sudah menangani 'flex flex-col h-full'.
        Isi di bawah ini adalah 'children' dari DataCard.
      */}
      <div className="flex h-full flex-col gap-3">
        {/* Header: Nama dan Role */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-black dark:text-white truncate">
            {formatName(user)}
          </h3>
          <RoleBadge role={user.role} />
        </div>

        {/* Detail: Email */}
        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
          {user.email}
        </p>

        {/* Footer: Info Desa & Kelompok (didorong ke bawah) */}
        <div className="mt-auto border-t border-gray-100 pt-3 dark:border-boxdark-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {user.group?.name ? (
              <p>
                Kelompok:{" "}
                <span className="font-semibold text-black dark:text-white">
                  {user.group.name}
                </span>
              </p>
            ) : null}
            
            {user?.village?.name ? (
              <p>
                Desa:{" "}
                <span className="font-semibold text-black dark:text-white">
                  {user.village.name}
                </span>
              </p>
            ) : null}

            {!user.group?.name && !user.village?.name && (
              <p className="italic">Belum ada data desa/kelompok.</p>
            )}
          </div>
        </div>
      </div>
    </DataCard>
  );
}