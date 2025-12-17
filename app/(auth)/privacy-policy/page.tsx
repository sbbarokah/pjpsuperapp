import React from 'react';
import Head from 'next/head';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Jika menggunakan Next.js Pages Router, uncomment Head di bawah */}
      {/* <Head>
        <title>Kebijakan Privasi - PJP Super App</title>
        <meta name="description" content="Kebijakan Privasi untuk PJP Super App" />
      </Head> 
      */}
      
      <div className="max-w-4xl mx-auto bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-blue-600">
          <h1 className="text-2xl font-bold leading-6 text-white">
            Kebijakan Privasi
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-blue-100">
            PJP Super App - Manajemen Laporan Belajar Siswa
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6 text-gray-700 space-y-6">
          <section>
            <p className="text-sm text-gray-500 mb-4">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
            </p>
            <h2 className="text-lg font-semibold text-gray-900">1. Pendahuluan</h2>
            <p className="mt-2">
              Selamat datang di <strong>PJP Super App</strong> ("Aplikasi", "Kami"). Aplikasi ini dikelola dan dioperasikan untuk tujuan manajemen laporan belajar siswa TPA/TPK. Kami menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi yang disimpan di dalam layanan kami.
            </p>
            <p className="mt-2">
              Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat Anda mengunjungi website kami di <a href="https://pjpsuperapp.vercel.app" className="text-blue-600 hover:underline">https://pjpsuperapp.vercel.app</a> atau menggunakan aplikasi seluler kami.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Informasi yang Kami Kumpulkan</h2>
            <p className="mt-2">Aplikasi ini dirancang untuk penggunaan administratif oleh pengelola TPA/TPK. Kami mengumpulkan jenis informasi berikut:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Data Akun Pengguna:</strong> Informasi pendaftaran Admin TPA/TPK oleh Superadmin.</li>
              <li><strong>Data Siswa:</strong> Nama, kelas, dan data demografis dasar siswa.</li>
              <li><strong>Data Akademik:</strong> Laporan kehadiran, nilai materi, dan laporan belajar.</li>
              <li><strong>Data Teknis:</strong> Informasi perangkat dan log akses untuk keamanan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Penggunaan Informasi</h2>
            <p className="mt-2">Kami menggunakan informasi tersebut untuk:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Menyediakan fitur manajemen laporan belajar dan absensi.</li>
              <li>Memungkinkan pengelolaan operasional pendidikan oleh Admin.</li>
              <li>Menghasilkan laporan kemajuan belajar siswa.</li>
              <li>Memelihara keamanan sistem.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Perlindungan Data Anak</h2>
            <p className="mt-2">
              Aplikasi ini digunakan oleh staf resmi (Admin TPA/TPK) untuk mengelola data siswa. Kami tidak mengumpulkan data pribadi secara langsung dari anak di bawah umur 13 tahun melalui pendaftaran publik. Seluruh data siswa diinput oleh pihak sekolah/TPA yang berwenang.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Hubungi Kami</h2>
            <p className="mt-2">
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui pengembang aplikasi atau administrator sistem.
            </p>
          </section>
        </div>
        
        <div className="px-4 py-4 sm:px-6 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} PJPSuperApp. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;