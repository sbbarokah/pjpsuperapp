"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "../header/icons";
import { useSidebarContext } from "../sidebar/sidebar-context";

export function MobileHeader() {
  const { toggleSidebar } = useSidebarContext();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-3 shadow-1 dark:border-stroke-dark dark:bg-gray-dark lg:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg border p-1.5 dark:border-stroke-dark dark:bg-[#020D1A] hover:bg-gray-100 dark:hover:bg-[#FFFFFF1A] transition-colors"
          aria-label="Toggle Sidebar"
        >
          <MenuIcon />
        </button>

        <Link href={"/"} className="flex items-center gap-2">
          <Image
            src={"/images/logo/pjp_logo_clean.png"}
            width={28}
            height={28}
            alt="Logo"
          />
          <span className="font-bold text-dark dark:text-white text-sm">
            PJP Super App
          </span>
        </Link>
      </div>
    </header>
  );
}