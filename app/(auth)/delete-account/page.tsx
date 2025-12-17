import Head from 'next/head';
import Link from 'next/link';

export default function DeleteAccount() {
  // Ganti variabel ini dengan data aplikasi Anda
  const appName = "PJP Super App"; 
  const supportEmail = "teknodigibarokah@gmail.com"; 
  const developerName = "Fitra Zul Fahmi";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Container Utama */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Permintaan Hapus Akun</h1>
          <p className="text-blue-100 mt-2">{appName}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Section 1: Penjelasan */}
          <div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Sesuai kebijakan Google Play Store, Anda berhak meminta penghapusan akun dan data yang terkait dengan aplikasi <strong>{appName}</strong>.
            </p>
          </div>

          {/* Section 2: Langkah-langkah */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Cara Menghapus Akun:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
              <li>Klik tombol "Kirim Email Permintaan" di bawah.</li>
              <li>Pastikan subjek email adalah <strong>"Request Delete Account"</strong>.</li>
              <li>Cantumkan email yang Anda gunakan saat mendaftar di aplikasi.</li>
              <li>Tim kami akan memproses permintaan Anda dalam waktu <strong>7 hari kerja</strong>.</li>
            </ol>
          </div>

          {/* Section 3: Action Button (Mailto) */}
          <a 
            href={`mailto:${supportEmail}?subject=Request Delete Account - ${appName}&body=Halo Tim Support, %0D%0A%0D%0ASaya ingin meminta penghapusan akun saya dari aplikasi ${appName}.%0D%0A%0D%0AEmail Akun: [Isi Email Anda Disini]%0D%0Alasan (Opsional): %0D%0A%0D%0ATerima kasih.`}
            className="block w-full bg-red-500 hover:bg-red-600 text-white text-center font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Kirim Email Permintaan
          </a>

          {/* Section 4: Kebijakan Data (Wajib ada untuk Google) */}
          <div className="text-xs text-gray-400 border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-500 mb-1">Kebijakan Penghapusan Data:</h4>
            <p>
              Setelah diproses, data berikut akan dihapus permanen:
            </p>
            <ul className="list-disc list-inside mt-1 mb-2">
              <li>Informasi Profil (Nama, Email, Foto)</li>
              <li>Riwayat Chat/Aktivitas</li>
              <li>Kredensial Login</li>
            </ul>
            <p>
              <strong>Catatan:</strong> Beberapa data transaksi mungkin tetap kami simpan untuk keperluan pelaporan pajak/hukum sesuai peraturan yang berlaku selama periode tertentu.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {developerName}. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}