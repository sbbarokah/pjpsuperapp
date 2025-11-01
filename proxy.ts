// import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  return NextResponse.next(); // Lanjutkan ke request selanjutnya

  /*
  // Buat respons awal. Kita mungkin akan memodifikasinya
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Buat Supabase client yang dikonfigurasi untuk proxy
  // Ini diperlukan untuk membaca dan menulis cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Jika kita mengatur cookie, kita perlu memperbarui
          // request dan response
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Jika kita menghapus cookie, kita perlu memperbarui
          // request dan response
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh sesi jika sudah kadaluwarsa.
  // Ini juga mengambil data pengguna (jika ada)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Tentukan rute publik Anda (grup rute (auth))
  // Grup rute (auth) Anda memiliki /login, jadi kita masukkan di sini
  const publicPaths = ['/login']; // Tambahkan rute lain seperti /register jika ada

  // Periksa apakah path saat ini adalah path publik
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // --- LOGIKA PERLINDUNGAN RUTE ---

  // 1. Jika pengguna TIDAK login DAN mencoba mengakses rute non-publik
  if (!user && !isPublicPath) {
    // Alihkan mereka ke halaman login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Jika pengguna SUDAH login DAN mencoba mengakses rute publik
  if (user && isPublicPath) {
    // Alihkan mereka ke halaman dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/'; // Arahkan ke dashboard utama Anda
    return NextResponse.redirect(url);
  }

  // 3. Jika tidak ada pengalihan, lanjutkan request.
  // Respons ini sekarang membawa cookie sesi yang sudah diperbarui (jika ada).
  return response;
  */
}

// Konfigurasi Matcher
export const config = {
  matcher: [
    /*
     * Cocokkan semua path request kecuali untuk:
     * - _next/static (file statis)
     * - _next/image (file optimasi gambar)
     * - favicon.ico (file favicon)
     * - Path apa pun yang mengandung ekstensi file (misalnya: .png, .jpg, .svg)
     * Ini penting agar proxy tidak berjalan pada file aset statis.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
