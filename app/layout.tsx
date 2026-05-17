// app/layout.tsx (server)
// import "./globals.css"; // semua CSS global (satoshi.css, style.css, dll) digabung di sini atau import terpisah
// import "flatpickr/dist/flatpickr.min.css";
// import "jsvectormap/dist/jsvectormap.css";
import "@/css/satoshi.css";
import "@/css/style.css";

import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import Providers from "./providers"; // client provider wrapper
import FcmListener from "@/components/fcm-listener";

export const metadata: Metadata = {
  title: {
    template: "%s | PJP Super App",
    default: "PJP Super App",
  },
  description: "PJP Super App.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Providers is a client component (ThemeProvider, SidebarProvider, etc) */}
        <Providers>
          <FcmListener />
          {children}
          <GoogleAnalytics gaId="G-622694WTW8" />
        </Providers>
      </body>
    </html>
  );
}
