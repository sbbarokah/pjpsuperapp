"use client";

import { useState, useMemo } from "react";
import { UserAdminView } from "@/lib/types/user.types"; // Perlu tipe UserAdminView
import { UserCard } from "@/components/cards/carduser"; // Impor UserCard Anda
import { DeleteUserButton } from "./delete_user_button"; // Asumsi path ini benar
import Link from "next/link";
import { FaFilter } from "react-icons/fa";

// --- [BARU] Ikon Search (dari contoh Anda) ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
      stroke="#637381"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.5 17.5L14.1667 14.1667"
      stroke="#637381"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * [BARU] Komponen Select Dropdown internal yang ringan
 */
const FilterSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder: string;
}) => (
  <div>
    <label htmlFor={name} className="mb-2.5 block font-medium text-black dark:text-white">
      {label}
    </label>
    <div className="relative z-20 bg-transparent dark:bg-form-input">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        // Gunakan style yang sama dengan search bar Anda
        className="relative z-20 w-full appearance-none rounded-full border border-stroke bg-white py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:focus-visible:border-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {/* Ikon panah/filter */}
      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
        <FaFilter className="text-gray-500" />
      </span>
    </div>
  </div>
);

type FilteredUserListProps = {
  users: UserAdminView[]; // Menerima list lengkap dari server
};

export function FilteredUserListClient({ users }: FilteredUserListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { uniqueGroups, uniqueCategories } = useMemo(() => {
    const groupSet = new Set<string>();
    const categorySet = new Set<string>();

    for (const user of users) {
      if (user.group?.name) {
        groupSet.add(user.group.name);
      }
      if (user.category?.name) {
        categorySet.add(user.category.name);
      }
    }

    return {
      uniqueGroups: Array.from(groupSet).sort(),
      uniqueCategories: Array.from(categorySet).sort(),
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const groupF = groupFilter.trim();
    const categoryF = categoryFilter.trim();

    // Terapkan filter secara berurutan (logika "AND")
    return users
      .filter((user) => {
        // Filter 1: Group
        if (!groupF) return true; // Lewati jika "Semua Kelompok"
        return user.group?.name === groupF;
      })
      .filter((user) => {
        // Filter 2: Category
        if (!categoryF) return true; // Lewati jika "Semua Kelas"
        return user.category?.name === categoryF;
      })
      .filter((user) => {
        // Filter 3: Text Search
        if (!query) return true; // Lewati jika search kosong
        return (
          user.full_name?.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.village?.name?.toLowerCase().includes(query)
        );
      });
  }, [users, searchQuery, groupFilter, categoryFilter]); // Filter ulang hanya jika data atau query berubah

  return (
    <div className="flex flex-col gap-6">
      {/* --- [BARU] Komponen Search Bar --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Bar (sebelumnya full-width, sekarang 1/3) */}
        <div className="w-full md:col-span-1">
          <label htmlFor="search" className="mb-2.5 block font-medium text-black dark:text-white">
            Cari Nama
          </label>
          <div className="relative"> 
            <input
              id="search"
              type="search"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex w-full items-center gap-3.5 rounded-full border bg-white py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
            />
            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
          </div>
        </div>
        
        {/* Filter Kelompok */}
        <FilterSelect
          label="Filter Kelompok"
          name="group_filter"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          options={uniqueGroups}
          placeholder="Semua Kelompok"
        />

        {/* Filter Kategori/Kelas */}
        <FilterSelect
          label="Filter Kelas"
          name="category_filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={uniqueCategories}
          placeholder="Semua Kelas"
        />
      </div>

      {/* --- Grid Data (Logika lama dari UserList) --- */}
      {users.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-300">
          Belum ada data Generus.
          <Link
            href="/generus/new"
            className="ml-2 text-primary hover:underline"
          >
            Buat Baru
          </Link>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => {
            const userName = user.full_name?.trim() || user.username;
            return (
              <UserCard
                key={user.user_id}
                user={user}
                href={`/generus/edit/${user.user_id}`}
                actions={<DeleteUserButton id={user.user_id} name={userName} />}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-300">
          Tidak ada generus yang cocok dengan pencarian "{searchQuery}".
        </div>
      )}
    </div>
  );
}