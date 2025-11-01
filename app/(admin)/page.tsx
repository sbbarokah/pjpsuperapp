// app/(admin)/page.tsx (Dashboard Anda)
'use client';

// Contoh fetch data dari Supabase di Server Component
// (Anda perlu setup Supabase client untuk Server-side)
// Untuk saat ini, kita buat statis:

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Selamat Datang di Dashboard</h1>
      <p>Ini adalah konten halaman utama admin Anda.</p>
      <p>Layout (Header, Sidebar) akan otomatis diterapkan.</p>
    </div>
  );
}