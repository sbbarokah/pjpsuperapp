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
  Download,
  Copy,
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
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [cardTitle, setCardTitle] = useState("Kartu Santri");
  const [cardSubtitle, setCardSubtitle] = useState(
    "Pengajian Generus"
  );

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Kartu Santri - ${user.full_name || user.username}`,
    pageStyle: `
      @page {
        size: 85mm 55mm;
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
                  value={
                    user.is_active !== false ? "Aktif" : "Nonaktif"
                  }
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
            <h3 className="text-lg font-bold mb-4">Sesuaikan Kartu Santri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Upload Foto */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Foto Santri
                </label>
                <div className="flex items-center gap-3">
                  {fotoPreview ? (
                    <div className="relative">
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
                  {!fotoPreview && (
                    <p className="text-xs text-gray-500">Opsional</p>
                  )}
                </div>
              </div>

              {/* Upload Background */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Latar Belakang
                </label>
                <div className="flex items-center gap-3">
                  {bgPreview ? (
                    <div className="relative">
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
                  {!bgPreview && (
                    <p className="text-xs text-gray-500">Opsional</p>
                  )}
                </div>
              </div>

              {/* Judul & Subjudul */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium">
                    Judul Kartu
                  </label>
                  <input
                    type="text"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Subjudul</label>
                  <input
                    type="text"
                    value={cardSubtitle}
                    onChange={(e) => setCardSubtitle(e.target.value)}
                    className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePrint()}
              className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-opacity-90 active:scale-95 transition"
            >
              <Printer size={18} /> Cetak Kartu
            </button>
          </div>

          {/* Pratinjau Kartu */}
          <div className="flex justify-center">
            <div
              ref={printRef}
              className="relative w-[85mm] h-[55mm] border border-gray-300 rounded-lg overflow-hidden shadow-lg print:shadow-none"
              style={{
                backgroundImage: bgPreview ? `url(${bgPreview})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: bgPreview ? "transparent" : "#f0f0f0",
              }}
            >
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-white">
                <h2 className="text-[10px] font-bold text-center leading-tight">
                  {cardTitle}
                </h2>
                <p className="text-[7px] mb-1">{cardSubtitle}</p>
                {fotoPreview && (
                  <img
                    src={fotoPreview}
                    className="w-14 h-14 rounded-full border-2 border-white object-cover mb-1"
                  />
                )}
                <p className="text-[10px] font-bold">
                  {user.full_name || user.username}
                </p>
                <p className="text-[7px]">{user.group?.name || "-"}</p>
                <p className="text-[7px]">{user.village?.name || "-"}</p>

                {/* ✅ Komponen SVG QR Code */}
                <div className="mt-1 bg-white p-0.5 rounded">
                  <SVG
                    text={qrValue}
                    options={{
                      // level: "L",
                      margin: 2,
                      width: 35,
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