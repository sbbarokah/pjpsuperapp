import logopjp from "@/assets/logos/pjp_logo_clean.png";
import Image from "next/image";

export function LogoWTitle() {
  return (
    // 1. Container utama diubah menjadi flex
    //    - "flex"       -> Membuat item di dalamnya (logo & text) berjajar horizontal
    //    - "items-center" -> Menjajarkannya secara vertikal di tengah
    //    - "gap-3"        -> Memberi jarak (contoh: 12px) antara logo dan teks
    <div className="flex items-center gap-3">
      
      {/* 2. Ini adalah div untuk logo Anda */}
      {/* Saya ubah menjadi h-8 w-8 (32x32px) agar ukurannya pasti persegi */}
      <div className="relative h-8 w-8">
        <Image
          src={logopjp}
          fill
          alt="PJP logo"
          role="presentation"
          quality={75}
        />
      </div>

      {/* 3. Tambahkan teks di sebelahnya */}
      {/* Styling (font-semibold, text-lg) ini opsional, sesuaikan saja */}
      <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        PJP Super App
      </span>
      
    </div>
  );
}