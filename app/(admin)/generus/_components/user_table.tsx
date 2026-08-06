// app/generus/_components/user_table.tsx
"use client";

import { UserAdminView } from "@/lib/types/user.types";
import { Eye, Layers } from "lucide-react";
import { DeleteUserButton } from "./delete_user_button";
import { calculateAge } from "@/lib/utils";

interface UserTableProps {
  users: UserAdminView[];
  visibleColumns: Set<string>;
  canMutate: boolean;
  onViewDetails: (user: UserAdminView) => void;
  onCategoryModal: (user: UserAdminView) => void;
}

// Mapping kolom yang mungkin ditampilkan
const allColumns = [
  { key: "full_name", label: "Nama Lengkap" },
  { key: "group", label: "Kelompok" },
  { key: "category", label: "Kelas" },
  { key: "age", label: "Umur" },
  { key: "role", label: "Role" },
  { key: "gender", label: "Gender" },
  { key: "village", label: "Desa" },
  { key: "email", label: "Email" },
  { key: "school_name", label: "Nama Sekolah" },
  { key: "school_level", label: "Tingkat Sekolah" },
  { key: "actions", label: "Aksi" },
];

export function UserTable({
  users,
  visibleColumns,
  canMutate,
  onViewDetails,
  onCategoryModal,
}: UserTableProps) {
  const isColVisible = (key: string) => visibleColumns.has(key);

  return (
    <div className="overflow-x-auto rounded-2xl border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
      <table className="min-w-full table-auto">
        <thead className="bg-gray-50 dark:bg-dark-2">
          <tr>
            {allColumns.map(
              (col) =>
                isColVisible(col.key) && (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {col.label}
                  </th>
                )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-dark-3">
          {users.map((user) => {
            const age = calculateAge(user.birth_date);
            return (
              <tr
                key={user.user_id}
                className="hover:bg-gray-50 dark:hover:bg-dark-3 transition-colors"
              >
                {isColVisible("full_name") && (
                  <td className="px-4 py-3 text-sm font-semibold text-black dark:text-white">
                    {user.full_name || user.username}
                  </td>
                )}
                {isColVisible("group") && (
                  <td className="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {user.group?.name || "-"}
                  </td>
                )}
                {isColVisible("category") && (
                  <td className="px-4 py-3 text-xs">
                    {user.category?.name ? (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        {user.category.name}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                {isColVisible("age") && (
                  <td className="px-4 py-3 text-xs">{age ?? "-"}</td>
                )}
                {isColVisible("role") && (
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {user.role || "user"}
                    </span>
                  </td>
                )}
                {isColVisible("gender") && (
                  <td className="px-4 py-3 text-xs">
                    {user.gender === "L" ? (
                      <span className="text-blue-600">Laki-laki</span>
                    ) : user.gender === "P" ? (
                      <span className="text-pink-600">Perempuan</span>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                {isColVisible("village") && (
                  <td className="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {user.village?.name || "-"}
                  </td>
                )}
                {isColVisible("email") && (
                  <td className="px-4 py-3 text-xs text-gray-500">{user.email || "-"}</td>
                )}
                {isColVisible("school_name") && (
                  <td className="px-4 py-3 text-xs text-gray-500">{user.school_name || "-"}</td>
                )}
                {isColVisible("school_level") && (
                  <td className="px-4 py-3 text-xs text-gray-500">{user.school_level || "-"}</td>
                )}
                {isColVisible("actions") && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canMutate && (
                        <button
                          type="button"
                          onClick={() => onCategoryModal(user)}
                          className="rounded-full bg-amber-500/10 p-1.5 text-amber-600 hover:bg-amber-500/20"
                          title="Ubah Kategori"
                        >
                          <Layers size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewDetails(user)}
                        className="rounded-full bg-primary/10 p-1.5 text-primary hover:bg-primary/20"
                        title="Detail"
                      >
                        <Eye size={14} />
                      </button>
                      {canMutate && (
                        <DeleteUserButton id={user.user_id} name={user.full_name || user.username} />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-500">Tidak ada data.</div>
      )}
    </div>
  );
}