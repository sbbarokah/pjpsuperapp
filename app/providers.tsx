// app/providers.tsx
"use client";

import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <NextTopLoader color="#5750F1" showSpinner={false} />
      <SidebarProvider>{children}</SidebarProvider>
    </ThemeProvider>
  );
}
