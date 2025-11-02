"use client";

// app/(auth)/layout.tsx (server)
import type { ReactNode } from "react";

export const metadata = {
  title: "Sign in",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#030712]">
      <main className="w-full max-w-md p-6">{children}</main>
    </div>
  );
}
