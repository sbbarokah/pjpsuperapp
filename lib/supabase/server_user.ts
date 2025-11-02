import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// PENTING: File ini untuk membuat client di SISI SERVER (Server Components, Server Actions)
// Ini dibuat untuk SETIAP REQUEST dan bertindak sebagai PENGGUNA YANG SEDANG LOGIN.
// Ini menggunakan ANON_KEY dan akan mematuhi RLS (Row Level Security).

export async function createClient() {
  const cookieStore = await cookies();

  // Ambil variabel public dari .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          // Iteraasi dan set setiap cookie satu per satu
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Tangani error jika cookies di-set di Server Component (read-only)
          // Ini wajar terjadi saat revalidasi
          console.log("[createClient] Unable to set cookies in Server Component:", error);
        }
      },
    },
  });
}
