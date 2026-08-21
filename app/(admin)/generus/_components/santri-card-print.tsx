"use client";

import { useState, useRef } from "react";
import { useQRCode } from "next-qrcode";
import { useReactToPrint } from "react-to-print";
import {
  Camera,
  ImageIcon,
  X,
  Printer,
  Eye,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserAdminView } from "@/lib/types/user.types";
import type { Profile } from "@/lib/types/user.types";

type UserDetail = UserAdminView & {
  email: string;
  village: { name: string } | null;
  group: { name: string } | null;
  category: { name: string } | null;
};

interface SantriCardPrintProps {
  user: UserDetail;
  admin: Profile;
}

export function SantriCardPrint({ user, admin }: SantriCardPrintProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "card">("detail");

  // State gambar
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  // State teks kartu
  const [cardTitle, setCardTitle] = useState("Kartu Santri");
  const [cardSubtitle, setCardSubtitle] = useState("Pengajian Generus");

  // State ukuran & tata letak
  const [cardWidthMm, setCardWidthMm] = useState(85);
  const [cardHeightMm, setCardHeightMm] = useState(55);
  const [photoSize, setPhotoSize] = useState(56); // dalam px
  const [photoPosition, setPhotoPosition] = useState<"top" | "middle" | "bottom">("top");
  const [qrSize, setQrSize] = useState(35);
  const [overlayOpacity, setOverlayOpacity] = useState(40); // 0-100

  // State ukuran font
  const [fontTitle, setFontTitle] = useState(10);
  const [fontSubtitle, setFontSubtitle] = useState(7);
  const [fontName, setFontName] = useState(10);
  const [fontInfo, setFontInfo] = useState(7);

  const printRef = useRef<HTMLDivElement>(null);

  // QR code value: gabungan data unik
  const qrValue = JSON.stringify({
    id: user.user_id,
    nama: user.full_name || user.username,
    kelompok: user.group?.name || "-",
    desa: user.village?.name || "-",
  });

  // Gunakan hook useQRCode
  const { SVG } = useQRCode();

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFotoPreview(URL.createObjectURL(file));
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBgPreview(URL.createObjectURL(file));
  };

  const removeFoto = () => setFotoPreview(null);
  const removeBg = () => setBgPreview(null);

  const resetCardSettings = () => {
    setCardTitle("Kartu Santri");
    setCardSubtitle("Pengajian Generus");
    setFotoPreview(null);
    setBgPreview(null);
    setCardWidthMm(85);
    setCardHeightMm(55);
    setPhotoSize(56);
    setPhotoPosition("top");
    setQrSize(35);
    setOverlayOpacity(40);
    setFontTitle(10);
    setFontSubtitle(7);
    setFontName(10);
    setFontInfo(7);
  };

  // const handlePrint = useReactToPrint({
  //   contentRef: printRef,
  //   documentTitle: `Kartu Santri - ${user.full_name || user.username}`,
  //   pageStyle: `
  //     @page {
  //       size: ${cardWidthMm}mm ${cardHeightMm}mm;
  //       margin: 0;
  //     }
  //     @media print {
  //       html, body {
  //         margin: 0 !important;
  //         padding: 0 !important;
  //       }
  //       .print-area {
  //         position: absolute;
  //         top: 0;
  //         left: 0;
  //         margin: 0;
  //         padding: 0;
  //       }
  //     }
  //   `,
  // });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Kartu Santri - ${user.full_name || user.username}`,
    pageStyle: `
      @page {
        size: ${cardWidthMm}mm ${cardHeightMm}mm;
        margin: 0;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
  });

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | null;
  }) => (
    <tr className="border-b border-gray-100 dark:border-dark-3">
      <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 w-1/3">
        {label}
      </td>
      <td className="px-3 py-2 text-sm font-medium text-black dark:text-white">
        {value || "-"}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-stroke dark:border-strokedark">
        <button
          onClick={() => setActiveTab("detail")}
          className={cn(
            "pb-2 text-sm font-bold uppercase tracking-wide transition",
            activeTab === "detail"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Eye size={16} className="inline mr-1" /> Detail
        </button>
        <button
          onClick={() => setActiveTab("card")}
          className={cn(
            "pb-2 text-sm font-bold uppercase tracking-wide transition",
            activeTab === "card"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Printer size={16} className="inline mr-1" /> Kartu Santri
        </button>
      </div>

      {/* ========== TAB DETAIL ========== */}
      {activeTab === "detail" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Pribadi */}
          <div className="rounded-2xl bg-white p-6 shadow dark:bg-boxdark">
            <h3 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">
              Data Pribadi
            </h3>
            <table className="w-full">
              <tbody>
                <DetailRow label="Nama Lengkap" value={user.full_name} />
                <DetailRow label="Username" value={user.username} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow
                  label="Jenis Kelamin"
                  value={
                    user.gender === "L"
                      ? "Laki-laki"
                      : user.gender === "P"
                      ? "Perempuan"
                      : "-"
                  }
                />
                <DetailRow label="Tempat Lahir" value={user?.birth_place ?? ""} />
                <DetailRow
                  label="Tanggal Lahir"
                  value={
                    user.birth_date
                      ? new Date(user.birth_date).toLocaleDateString("id-ID")
                      : "-"
                  }
                />
              </tbody>
            </table>
          </div>

          {/* Penempatan & Pendidikan */}
          <div className="rounded-2xl bg-white p-6 shadow dark:bg-boxdark">
            <h3 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">
              Penempatan & Pendidikan
            </h3>
            <table className="w-full">
              <tbody>
                <DetailRow label="Desa" value={user.village?.name ?? "-"} />
                <DetailRow label="Kelompok" value={user.group?.name ?? "-"} />
                <DetailRow label="Kelas" value={user.category?.name ?? "-"} />
                <DetailRow label="Nama Sekolah" value={user.school_name ?? "-"} />
                <DetailRow label="Jenjang" value={user.school_level ?? "-"} />
              </tbody>
            </table>
          </div>

          {/* Orang Tua */}
          <div className="rounded-2xl bg-white p-6 shadow dark:bg-boxdark">
            <h3 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">
              Orang Tua
            </h3>
            <table className="w-full">
              <tbody>
                <DetailRow label="Ayah" value={user.father_name ?? "-"} />
                <DetailRow label="Ibu" value={user.mother_name ?? "-"} />
                <DetailRow label="Kontak" value={user.parent_contact ?? "-"} />
              </tbody>
            </table>
          </div>

          {/* Data Lainnya */}
          <div className="rounded-2xl bg-white p-6 shadow dark:bg-boxdark">
            <h3 className="text-lg font-bold mb-4 border-l-4 border-primary pl-3">
              Status & Lainnya
            </h3>
            <table className="w-full">
              <tbody>
                <DetailRow
                  label="Status Aktif"
                  value={user.is_active !== false ? "Aktif" : "Nonaktif"}
                />
                <DetailRow label="Role" value={user.role} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== TAB KARTU SANTRI ========== */}
      {activeTab === "card" && (
        <div className="space-y-6">
          {/* Panel Kustomisasi */}
          <div className="rounded-2xl bg-white p-6 shadow no-print dark:bg-boxdark">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">Sesuaikan Kartu Santri</h3>
              <button
                onClick={resetCardSettings}
                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            {/* Bagian 1: Ukuran Kartu & Latar */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="mb-3 text-sm font-semibold">Ukuran Kartu</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs">Lebar (mm)</label>
                    <input
                      type="number"
                      min={50}
                      max={200}
                      value={cardWidthMm}
                      onChange={(e) => setCardWidthMm(Number(e.target.value))}
                      className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">Tinggi (mm)</label>
                    <input
                      type="number"
                      min={30}
                      max={150}
                      value={cardHeightMm}
                      onChange={(e) => setCardHeightMm(Number(e.target.value))}
                      className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs">
                    Kecerahan Latar (Overlay Gelap): {overlayOpacity}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Upload Foto & Background */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium">Foto Santri</label>
                  {fotoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <button
                        onClick={removeFoto}
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary">
                      <Camera size={20} />
                      <span className="text-xs">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFotoUpload}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium">Latar Belakang</label>
                  {bgPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={bgPreview}
                        alt="Preview"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <button
                        onClick={removeBg}
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary">
                      <ImageIcon size={20} />
                      <span className="text-xs">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBgUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian 2: Ukuran Elemen */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="mb-3 text-sm font-semibold">Ukuran Foto & QR</h4>
                <div className="mb-4">
                  <label className="mb-1 block text-xs">
                    Foto (px): {photoSize}
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={photoSize}
                    onChange={(e) => setPhotoSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">
                    QR Code (px): {qrSize}
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Ukuran Font</h4>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs">
                      Judul: {fontTitle}px
                    </label>
                    <input
                      type="range"
                      min={6}
                      max={30}
                      value={fontTitle}
                      onChange={(e) => setFontTitle(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">
                      Subjudul: {fontSubtitle}px
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={20}
                      value={fontSubtitle}
                      onChange={(e) => setFontSubtitle(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">
                      Nama: {fontName}px
                    </label>
                    <input
                      type="range"
                      min={6}
                      max={30}
                      value={fontName}
                      onChange={(e) => setFontName(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">
                      Info: {fontInfo}px
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={20}
                      value={fontInfo}
                      onChange={(e) => setFontInfo(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Tata Letak</h4>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs">Posisi Foto</label>
                    <select
                      value={photoPosition}
                      onChange={(e) =>
                        setPhotoPosition(e.target.value as "top" | "middle" | "bottom")
                      }
                      className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2"
                    >
                      <option value="top">Atas (setelah subtitle)</option>
                      <option value="middle">Tengah (setelah nama)</option>
                      <option value="bottom">Bawah (setelah info desa)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">Judul Kartu</label>
                    <input
                      type="text"
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                      className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">Subjudul</label>
                    <input
                      type="text"
                      value={cardSubtitle}
                      onChange={(e) => setCardSubtitle(e.target.value)}
                      className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Cetak */}
            <button
              onClick={() => handlePrint()}
              className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-opacity-90 active:scale-95 transition"
            >
              <Printer size={18} /> Cetak Kartu
            </button>
          </div>

          {/* Pratinjau Kartu */}
          <div className="flex justify-center">
            <div
              ref={printRef}
              className="relative overflow-hidden border border-gray-300 rounded-lg shadow-lg print:shadow-none"
              style={{
                width: `${cardWidthMm}mm`,
                height: `${cardHeightMm}mm`,
                backgroundImage: bgPreview ? `url(${bgPreview})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: bgPreview ? "transparent" : "#f0f0f0",
              }}
            >
              {/* Overlay gelap dengan kecerahan yang dapat diatur */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-2 text-white"
                style={{
                  backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`,
                }}
              >
                <h2
                  className="font-bold text-center leading-tight"
                  style={{ fontSize: `${fontTitle}px` }}
                >
                  {cardTitle}
                </h2>
                <p
                  className="mb-1"
                  style={{ fontSize: `${fontSubtitle}px` }}
                >
                  {cardSubtitle}
                </p>

                {/* Foto sesuai posisi yang dipilih */}
                {photoPosition === "top" && fotoPreview && (
                  <img
                    src={fotoPreview}
                    alt="Foto Santri"
                    className="rounded-full object-cover mb-1 border-2 border-white"
                    style={{ width: photoSize, height: photoSize }}
                  />
                )}

                <p
                  className="font-bold"
                  style={{ fontSize: `${fontName}px` }}
                >
                  {user.full_name || user.username}
                </p>

                {photoPosition === "middle" && fotoPreview && (
                  <img
                    src={fotoPreview}
                    alt="Foto Santri"
                    className="rounded-full object-cover my-1 border-2 border-white"
                    style={{ width: photoSize, height: photoSize }}
                  />
                )}

                <p style={{ fontSize: `${fontInfo}px` }}>
                  {user.group?.name || "-"}
                </p>
                <p style={{ fontSize: `${fontInfo}px` }}>
                  {user.village?.name || "-"}
                </p>

                {photoPosition === "bottom" && fotoPreview && (
                  <img
                    src={fotoPreview}
                    alt="Foto Santri"
                    className="rounded-full object-cover mt-1 border-2 border-white"
                    style={{ width: photoSize, height: photoSize }}
                  />
                )}

                {/* QR Code */}
                <div className="mt-1 bg-white p-0.5 rounded">
                  <SVG
                    text={qrValue}
                    options={{
                      margin: 2,
                      width: qrSize,
                      color: {
                        dark: "#000000",
                        light: "#ffffff",
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}