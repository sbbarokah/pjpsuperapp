import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Ini adalah client server KHUSUS untuk digunakan di dalam Middleware.
// Ini menggunakan NextRequest dan NextResponse secara langsung.

export function createClient(request: NextRequest) {
  // Ambil variabel public dari .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Buat 'cookie store' yang akan dibaca dan ditulis oleh Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 1. Patch semua cookie ke 'request' yang sedang berjalan
        //    agar rute selanjutnya bisa membacanya.
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({ name, value, ...options });
        });

        // 2. Buat ulang 'response' berdasarkan 'request' yang sudah di-patch
        //    Ini SANGAT PENTING.
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        // 3. Terapkan semua cookie ke 'response' yang akan dikirim ke browser.
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}
