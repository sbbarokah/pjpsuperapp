// app/layout.tsx (server)
// import "./globals.css"; // semua CSS global (satoshi.css, style.css, dll) digabung di sini atau import terpisah
// import "flatpickr/dist/flatpickr.min.css";
// import "jsvectormap/dist/jsvectormap.css";
import "@/css/satoshi.css";
import "@/css/style.css";

import type { Metadata } from "next";
import Providers from "./providers"; // client provider wrapper

export const metadata: Metadata = {
  title: {
    template: "%s | NextAdmin - Next.js Dashboard Kit",
    default: "NextAdmin - Next.js Dashboard Kit",
  },
  description:
    "Next.js admin dashboard toolkit with 200+ templates, UI components, and integrations for fast dashboard development.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Providers is a client component (ThemeProvider, SidebarProvider, etc) */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
