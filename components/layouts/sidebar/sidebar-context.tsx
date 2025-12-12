"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { createContext, useContext, useEffect, useState } from "react";

type SidebarState = "expanded" | "collapsed";

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Fungsi untuk handle resize dan initial load
    const handleResize = () => {
      if (!isMobile) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Jalankan sekali saat component mount (Initial Load)
    handleResize();

    // Jalankan setiap kali window di-resize
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  function toggleSidebar() {
    setIsOpen((prev) => !prev);
  }

  return (
    <SidebarContext.Provider
      value={{
        state: isOpen ? "expanded" : "collapsed",
        isOpen,
        setIsOpen,
        isMobile,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
