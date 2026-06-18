"use client";

import React, { useMemo, useState } from "react";
import { Search, Edit, Trash2, Shield, Users, SearchIcon, Layers, ChevronLeft, ChevronRight, Mail, Check, Copy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Helper untuk format Role menjadi lebih rapi
const formatRole = (role: string) => {
  return role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin_desa":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
    case "pengurus_desa":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200";
    case "admin_kelompok":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
    case "pengurus_kelompok":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200";
  }
};

type FilteredAdminListProps = {
  admins: any[]; 
};

export function FilteredAdminListClient({ admins }: FilteredAdminListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State Filter Local
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // State Paginasi dari URL
  const currentPageUrl = Number(searchParams.get("page")) || 1;
  const itemsPerPage = Number(searchParams.get("limit")) || 10;

  // Pembaruan URL Params
  const updateUrlParams = (updates: Record<string, any>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 1. Logika Filter Data
  const filteredAdmins = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    
    return admins.filter((admin) => {
      const matchesSearch = 
        (admin.full_name?.toLowerCase().includes(query)) ||
        (admin.username?.toLowerCase().includes(query));
      
      const matchesRole = roleFilter === "all" || admin.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [admins, searchTerm, roleFilter]);

  // 2. Kalkulasi Paginasi
  const totalItems = filteredAdmins.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentPage = Math.min(currentPageUrl, totalPages);

  // 3. Slice Data untuk Halaman Saat Ini
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAdmins.slice(start, end);
  }, [filteredAdmins, currentPage, itemsPerPage]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    updateUrlParams({ page: 1 });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    updateUrlParams({ page: 1 });
  };

  const handleCopyEmail = (email: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = email;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  };

  console.log("isi paginated admin", paginatedAdmins);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        
        {/* HEADER: Filter & Search */}
        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Daftar Admin & Pengurus
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter Role */}
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="rounded-md border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input text-sm cursor-pointer"
            >
              <option value="all">Semua Role</option>
              <option value="admin_desa">Admin Desa</option>
              <option value="pengurus_desa">Pengurus Desa</option>
              <option value="admin_kelompok">Admin Kelompok</option>
              <option value="pengurus_kelompok">Pengurus Kelompok</option>
            </select>

            {/* Search Bar */}
            <div className="relative">
              <button className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-gray-500" />
              </button>
              <input
                type="text"
                placeholder="Cari nama atau username..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-md border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input text-sm md:w-64"
              />
            </div>
          </div>
        </div>

        {/* BODY: Data Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-6 py-4 font-medium text-black dark:text-white">Nama, Username & Email</th>
                <th className="px-6 py-4 font-medium text-black dark:text-white">Role Akses</th>
                <th className="px-6 py-4 font-medium text-black dark:text-white">Wilayah Tugas</th>
                <th className="px-6 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdmins.length > 0 ? (
                paginatedAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-black dark:text-white">{admin.full_name}</p>
                      <div className="flex flex-col mt-0.5 space-y-0.5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{admin.username}</p>
                        {admin.email && (
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Mail size={10} /> {admin.email}
                            </p>
                            <button
                              onClick={() => handleCopyEmail(admin.email)}
                              className="text-gray-400 hover:text-primary transition-colors focus:outline-none"
                              title="Salin Email"
                            >
                              {copiedEmail === admin.email ? (
                                <Check size={12} className="text-green-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                        getRoleBadgeColor(admin.role)
                      )}>
                        <Shield size={12} />
                        {formatRole(admin.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {admin.role.includes("desa") ? (
                          <span className="font-medium text-black dark:text-white">
                            🏢 {admin.villages?.name || "Semua Desa"}
                          </span>
                        ) : (
                          <>
                            <span className="font-medium text-black dark:text-white">
                              🕌 {admin.groups?.name || "Belum Ditugaskan"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Desa: {admin.villages?.name || "-"}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/users/edit/${admin.id}`}
                          className="hover:text-primary transition-colors text-gray-500"
                          title="Edit Admin"
                        >
                          <Edit size={18} />
                        </Link>
                        <button 
                          className="hover:text-red-500 transition-colors text-gray-500"
                          title="Hapus Akses"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                    Tidak ada data admin/pengurus yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- KOMPONEN PAGINASI --- */}
      {totalItems > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-stroke dark:border-slate-700 shadow-default flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Menampilkan <span className="font-black text-slate-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-black text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-black text-slate-800 dark:text-slate-200">{totalItems}</span> data
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers size={12} /> Tampilkan:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => updateUrlParams({ limit: Number(e.target.value), page: 1 })}
                className="p-1.5 px-2.5 text-xs font-black rounded-xl border border-stroke dark:border-slate-700 bg-gray-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              >
                <option value={10}>10 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 justify-center w-full md:w-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => updateUrlParams({ page: Math.max(1, currentPage - 1) })}
              className="w-10 h-10 rounded-xl border border-stroke dark:border-slate-700 flex items-center justify-center bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-slate-750 text-black dark:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isNearCurrent = Math.abs(currentPage - pageNum) <= 1;
              const isEdge = pageNum === 1 || pageNum === totalPages;

              if (!isNearCurrent && !isEdge) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="text-xs text-slate-400 px-1 font-bold">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => updateUrlParams({ page: pageNum })}
                  className={cn(
                    "w-10 h-10 rounded-xl text-xs font-black transition-all border",
                    currentPage === pageNum
                      ? "bg-black border-black text-white dark:bg-white dark:text-black dark:border-white shadow-lg"
                      : "border-stroke dark:border-slate-700 bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => updateUrlParams({ page: Math.min(totalPages, currentPage + 1) })}
              className="w-10 h-10 rounded-xl border border-stroke dark:border-slate-700 flex items-center justify-center bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-slate-750 text-black dark:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}