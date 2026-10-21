"use client";

import { useState, useRef, useEffect } from "react";
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
import { toPng } from 'html-to-image';
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

  // State gambar (sekarang berupa data URL)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  // State teks kartu
  const [cardTitle, setCardTitle] = useState("Kartu Santri");
  const [cardSubtitle, setCardSubtitle] = useState("Pengajian Generus");

  // State ukuran & tata letak
  const [cardWidthMm, setCardWidthMm] = useState(85);
  const [cardHeightMm, setCardHeightMm] = useState(55);
  const [photoSize, setPhotoSize] = useState(56);
  const [photoPosition, setPhotoPosition] = useState<"top" | "middle" | "bottom">("top");
  const [qrSize, setQrSize] = useState(35);
  const [overlayOpacity, setOverlayOpacity] = useState(40);

  // State ukuran font
  const [fontTitle, setFontTitle] = useState(10);
  const [fontSubtitle, setFontSubtitle] = useState(7);
  const [fontName, setFontName] = useState(10);
  const [fontInfo, setFontInfo] = useState(7);

  // State warna
  const [colorTitle, setColorTitle] = useState("#ffffff");
  const [colorSubtitle, setColorSubtitle] = useState("#ffffff");
  const [colorName, setColorName] = useState("#ffffff");
  const [colorGroup, setColorGroup] = useState("#ffffff");
  const [colorVillage, setColorVillage] = useState("#ffffff");

  // State visibilitas group & village
  const [showGroupName, setShowGroupName] = useState(true);
  const [showVillageName, setShowVillageName] = useState(true);

  // State urutan elemen (1–7)
  const [elementOrder, setElementOrder] = useState<Record<string, number>>({
    title: 1,
    subtitle: 2,
    photo: 3,
    name: 4,
    group: 5,
    village: 6,
    qr: 7,
  });

  // State margin per elemen (top & bottom dalam px)
  const [elementMargins, setElementMargins] = useState<
    Record<string, { top: number; bottom: number }>
  >({
    title: { top: 0, bottom: 2 },
    subtitle: { top: 0, bottom: 2 },
    photo: { top: 0, bottom: 2 },
    name: { top: 0, bottom: 2 },
    group: { top: 0, bottom: 2 },
    village: { top: 0, bottom: 2 },
    qr: { top: 0, bottom: 2 },
  });

  const printRef = useRef<HTMLDivElement>(null);

  const qrValue = JSON.stringify({
    id: user.user_id,
    nama: user.full_name || user.username,
    kelompok: user.group?.name || "-",
    desa: user.village?.name || "-",
  });

  const { SVG } = useQRCode();

  // ======================== PERSISTENSI LOCALSTORAGE ========================
  // Muat pengaturan tersimpan saat komponen pertama kali dirender
  useEffect(() => {
    const savedSettings = localStorage.getItem("santri-card-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);

        setCardTitle(parsed.cardTitle ?? "Kartu Santri");
        setCardSubtitle(parsed.cardSubtitle ?? "Pengajian Generus");

        if (parsed.fotoPreview) setFotoPreview(parsed.fotoPreview);
        if (parsed.bgPreview) setBgPreview(parsed.bgPreview);

        setCardWidthMm(parsed.cardWidthMm ?? 85);
        setCardHeightMm(parsed.cardHeightMm ?? 55);
        setPhotoSize(parsed.photoSize ?? 56);
        setPhotoPosition(parsed.photoPosition ?? "top");
        setQrSize(parsed.qrSize ?? 35);
        setOverlayOpacity(parsed.overlayOpacity ?? 40);

        setFontTitle(parsed.fontTitle ?? 10);
        setFontSubtitle(parsed.fontSubtitle ?? 7);
        setFontName(parsed.fontName ?? 10);
        setFontInfo(parsed.fontInfo ?? 7);

        setColorTitle(parsed.colorTitle ?? "#ffffff");
        setColorSubtitle(parsed.colorSubtitle ?? "#ffffff");
        setColorName(parsed.colorName ?? "#ffffff");
        setColorGroup(parsed.colorGroup ?? "#ffffff");
        setColorVillage(parsed.colorVillage ?? "#ffffff");

        setShowGroupName(parsed.showGroupName ?? true);
        setShowVillageName(parsed.showVillageName ?? true);

        if (parsed.elementOrder) setElementOrder(parsed.elementOrder);
        if (parsed.elementMargins) setElementMargins(parsed.elementMargins);
      } catch (error) {
        console.error("Gagal memuat pengaturan tersimpan:", error);
      }
    }
  }, []);

  // Simpan pengaturan setiap kali ada perubahan
  useEffect(() => {
    const settings = {
      cardTitle,
      cardSubtitle,
      fotoPreview,
      bgPreview,
      cardWidthMm,
      cardHeightMm,
      photoSize,
      photoPosition,
      qrSize,
      overlayOpacity,
      fontTitle,
      fontSubtitle,
      fontName,
      fontInfo,
      colorTitle,
      colorSubtitle,
      colorName,
      colorGroup,
      colorVillage,
      showGroupName,
      showVillageName,
      elementOrder,
      elementMargins,
    };
    localStorage.setItem("santri-card-settings", JSON.stringify(settings));
  }, [
    cardTitle,
    cardSubtitle,
    fotoPreview,
    bgPreview,
    cardWidthMm,
    cardHeightMm,
    photoSize,
    photoPosition,
    qrSize,
    overlayOpacity,
    fontTitle,
    fontSubtitle,
    fontName,
    fontInfo,
    colorTitle,
    colorSubtitle,
    colorName,
    colorGroup,
    colorVillage,
    showGroupName,
    showVillageName,
    elementOrder,
    elementMargins,
  ]);

  // ======================== HANDLER ========================
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    setColorTitle("#ffffff");
    setColorSubtitle("#ffffff");
    setColorName("#ffffff");
    setColorGroup("#ffffff");
    setColorVillage("#ffffff");
    setShowGroupName(true);
    setShowVillageName(true);
    setElementOrder({
      title: 1,
      subtitle: 2,
      photo: 3,
      name: 4,
      group: 5,
      village: 6,
      qr: 7,
    });
    setElementMargins({
      title: { top: 0, bottom: 2 },
      subtitle: { top: 0, bottom: 2 },
      photo: { top: 0, bottom: 2 },
      name: { top: 0, bottom: 2 },
      group: { top: 0, bottom: 2 },
      village: { top: 0, bottom: 2 },
      qr: { top: 0, bottom: 2 },
    });
    // Pengaturan default akan otomatis tersimpan ke localStorage melalui effect
  };

  const handleOrderChange = (key: string, value: number) => {
    setElementOrder((prev) => ({ ...prev, [key]: value }));
  };

  const handleMarginChange = (key: string, side: "top" | "bottom", value: number) => {
    setElementMargins((prev) => ({
      ...prev,
      [key]: { ...prev[key], [side]: value },
    }));
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Kartu Santri - ${user.full_name || user.username}`,
    pageStyle: `
      @page {
        size: ${cardWidthMm}mm ${cardHeightMm}mm;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
        }
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-area {
          position: absolute;
          top: 0;
          left: 0;
          margin: 0;
          padding: 0;
        }
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

  // ======================== RENDER ELEMEN KARTU ========================
  const renderCardElements = () => {
    const elements: { key: string; order: number; render: () => React.JSX.Element }[] = [
      {
        key: "title",
        order: elementOrder.title,
        render: () => (
          <h2
            className="font-bold text-center leading-tight"
            style={{ fontSize: `${fontTitle}px`, color: colorTitle }}
          >
            {cardTitle}
          </h2>
        ),
      },
      {
        key: "subtitle",
        order: elementOrder.subtitle,
        render: () => (
          <p style={{ fontSize: `${fontSubtitle}px`, color: colorSubtitle }}>
            {cardSubtitle}
          </p>
        ),
      },
      {
        key: "photo",
        order: elementOrder.photo,
        render: () =>
          fotoPreview ? (
            <img
              src={fotoPreview}
              alt="Foto Santri"
              className="rounded-full object-cover border-2 border-white"
              style={{ width: photoSize, height: photoSize }}
            />
          ) : (
            <></>
          ),
      },
      {
        key: "name",
        order: elementOrder.name,
        render: () => (
          <p className="font-bold" style={{ fontSize: `${fontName}px`, color: colorName }}>
            {user.full_name || user.username}
          </p>
        ),
      },
      {
        key: "group",
        order: elementOrder.group,
        render: () =>
          showGroupName ? (
            <p style={{ fontSize: `${fontInfo}px`, color: colorGroup }}>
              {user.group?.name || "-"}
            </p>
          ) : (
            <></>
          ),
      },
      {
        key: "village",
        order: elementOrder.village,
        render: () =>
          showVillageName ? (
            <p style={{ fontSize: `${fontInfo}px`, color: colorVillage }}>
              {user.village?.name || "-"}
            </p>
          ) : (
            <></>
          ),
      },
      {
        key: "qr",
        order: elementOrder.qr,
        render: () => (
          <div className="bg-white p-0.5 rounded">
            <SVG
              text={qrValue}
              options={{
                margin: 2,
                width: qrSize,
                color: { dark: "#000000", light: "#ffffff" },
              }}
            />
          </div>
        ),
      },
    ];

    return elements
      .filter((el) => {
        if (el.key === "photo" && !fotoPreview) return false;
        if (el.key === "group" && !showGroupName) return false;
        if (el.key === "village" && !showVillageName) return false;
        return true;
      })
      .sort((a, b) => a.order - b.order)
      .map((el) => (
        <div
          key={el.key}
          style={{
            marginTop: `${elementMargins[el.key]?.top ?? 0}px`,
            marginBottom: `${elementMargins[el.key]?.bottom ?? 0}px`,
          }}
        >
          {el.render()}
        </div>
      ));
  };

  // ======================== UI ========================
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

            {/* Bagian 3: Urutan, Warna, Visibilitas, Margin */}
            <div className="space-y-6">
              {/* Urutan Elemen */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Urutan Elemen (1–7)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: "title", label: "Judul" },
                    { key: "subtitle", label: "Subjudul" },
                    { key: "photo", label: "Foto" },
                    { key: "qr", label: "QR Code" },
                    { key: "name", label: "Nama" },
                    { key: "group", label: "Kelompok" },
                    { key: "village", label: "Desa" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="text-xs w-20">{item.label}</span>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={elementOrder[item.key]}
                        onChange={(e) =>
                          handleOrderChange(item.key, Number(e.target.value))
                        }
                        className="w-14 rounded-lg border border-stroke px-2 py-1 text-sm dark:border-dark-3 dark:bg-dark-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Warna */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Warna Teks</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { key: "title", label: "Judul", value: colorTitle, set: setColorTitle },
                    { key: "subtitle", label: "Subjudul", value: colorSubtitle, set: setColorSubtitle },
                    { key: "name", label: "Nama", value: colorName, set: setColorName },
                    { key: "group", label: "Kelompok", value: colorGroup, set: setColorGroup },
                    { key: "village", label: "Desa", value: colorVillage, set: setColorVillage },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="text-xs w-16">{item.label}</span>
                      <input
                        type="color"
                        value={item.value}
                        onChange={(e) => item.set(e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-stroke"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibilitas */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showGroupName}
                    onChange={(e) => setShowGroupName(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Tampilkan Kelompok
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showVillageName}
                    onChange={(e) => setShowVillageName(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Tampilkan Desa
                </label>
              </div>

              {/* Margin per Elemen */}
              <div>
                <h4 className="mb-2 text-sm font-semibold">Jarak (Margin) per Elemen</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: "title", label: "Judul" },
                    { key: "subtitle", label: "Subjudul" },
                    { key: "photo", label: "Foto" },
                    { key: "qr", label: "QR Code" },
                    { key: "name", label: "Nama" },
                    { key: "group", label: "Kelompok" },
                    { key: "village", label: "Desa" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="text-xs w-16">{item.label}</span>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-gray-500">T</label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={elementMargins[item.key]?.top ?? 0}
                          onChange={(e) =>
                            handleMarginChange(item.key, "top", Number(e.target.value))
                          }
                          className="w-12 rounded-lg border border-stroke px-1 py-0.5 text-sm dark:border-dark-3 dark:bg-dark-2"
                        />
                        <label className="text-[10px] text-gray-500">B</label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={elementMargins[item.key]?.bottom ?? 0}
                          onChange={(e) =>
                            handleMarginChange(item.key, "bottom", Number(e.target.value))
                          }
                          className="w-12 rounded-lg border border-stroke px-1 py-0.5 text-sm dark:border-dark-3 dark:bg-dark-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tombol Cetak */}
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
              className="print-area relative overflow-hidden border border-gray-300 rounded-lg shadow-lg print:shadow-none"
              style={{
                width: `${cardWidthMm}mm`,
                height: `${cardHeightMm}mm`,
                backgroundImage: bgPreview ? `url(${bgPreview})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: bgPreview ? "transparent" : "#f0f0f0",
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-2 text-white"
                style={{
                  backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})`,
                }}
              >
                {renderCardElements()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}