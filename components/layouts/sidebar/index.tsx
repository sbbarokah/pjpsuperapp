"use client";

import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
// [PERUBAHAN]: Import kedua data navigasi
import { ADMIN_NAV_DATA, PENGURUS_NAV_DATA, SUPERADMIN_NAV_DATA } from "./data"; 
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { LogoWTitle } from "@/components/ui/logo_title";
import { Profile } from "@/lib/types/user.types";
import { canViewMenuMasterDesa, canViewMenuMasterKelompok, canViewMenuUsers, isPengurusLevel } from "@/lib/utils/rbac";

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredNavData = useMemo(() => {
    
    // 1. JIKA SUPERADMIN: Langsung gunakan data khusus Superadmin
    // (Struktur menu sudah flat/datar dan bersih dari menu KBM/Operasional)
    if (profile.role === 'superadmin') {
      return SUPERADMIN_NAV_DATA;
    }

    if (isPengurusLevel(profile.role)) {
      return PENGURUS_NAV_DATA;
    }

    // 2. JIKA BUKAN SUPERADMIN: Gunakan ADMIN_NAV_DATA dan filter sesuai RBAC
    const isItemAllowed = (title: string, url?: string) => {
      // Keamanan ganda, pastikan pengguna/users hanya bisa diakses role yang diizinkan (Superadmin)
      if (title === "Pengguna" || url?.includes("/users")) {
        return canViewMenuUsers(profile.role);
      }
      
      // Filter Master Data
      if (title === "Desa" || url?.includes("/villages")) {
        return canViewMenuMasterDesa(profile.role);
      }
      
      if (title === "Kelompok" || url?.includes("/group")) {
        return canViewMenuMasterKelompok(profile.role);
      }

      // Secara default, biarkan role selain Superadmin melihat menu operasional lainnya (Laporan KBM, dll)
      return true;
    };

    // Proses Penyaringan (Filtering Data Navigasi)
    return ADMIN_NAV_DATA.map((section) => {
      const allowedItems = section.items
        .filter((item) => isItemAllowed(item.title, (item as any).url))
        .map((item) => {
          if (item.items && item.items.length > 0) {
            const allowedSubItems = item.items.filter((sub) => 
              isItemAllowed(sub.title, sub.url)
            );
            return { ...item, items: allowedSubItems };
          }
          return item;
        });

      return { ...section, items: allowedItems };
    })
    // Sembunyikan label kategori ("Master Data", "Main Menu") jika isinya sudah kosong
    .filter((section) => section.items.length > 0);

  }, [profile.role]);


  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  };

  useEffect(() => {
    // Ubah NAV_DATA menjadi filteredNavData di dalam useEffect
    filteredNavData.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }
            return true;
          }
        });
      });
    });
  }, [pathname, filteredNavData]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <LogoWTitle />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {filteredNavData.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(
                                ({ url }) => url === pathname,
                              )}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />

                              <span>{item.title}</span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200",
                                  expandedItems.includes(item.title) &&
                                    "rotate-0",
                                )}
                                aria-hidden="true"
                              />
                            </MenuItem>

                            {expandedItems.includes(item.title) && (
                              <ul
                                className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={pathname === subItem.url}
                                    >
                                      <span>{subItem.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                  item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className="flex items-center gap-3 py-3"
                                as="link"
                                href={href}
                                isActive={pathname === href}
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span>{item.title}</span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}