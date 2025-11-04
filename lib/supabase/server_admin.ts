/***
 * lib/supabase/server_user.ts
 * Untuk MENGEKSEKUSI query (CRUD) setelah pengguna divalidasi.
 * Ini menggunakan SERVICE_ROLE_KEY dan TIDAK mematuhi RLS.
 * PENTING: File ini membuat client dengan hak akses ADMIN (service_role)
 * Ini HANYA boleh digunakan di server (Server Actions, Route Handlers)
 * untuk tugas yang memerlukan hak penuh dan MELEWATI RLS (Row Level Security).
 * */
import { createClient } from "@supabase/supabase-js";

// Ambil variabel dari .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Buat satu instance client admin (singleton)
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Ekspor fungsi yang mengembalikan instance admin.
 * Ganti nama file `server.ts` Anda sebelumnya menjadi `server-admin.ts`
 * dan gunakan ini di `userService.ts`
 */
export function createAdminClient() {
  return supabaseAdmin;
}