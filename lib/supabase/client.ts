// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

// PENTING: File ini untuk membuat client di SISI KLIEN (Browser)
// Gunakan ini di dalam Client Components ("use client")
// Ini menggunakan ANON_KEY dan akan mematuhi RLS.

export function createClient() {
  // Ambil variabel public dari .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Gunakan createBrowserClient dari @supabase/ssr
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

