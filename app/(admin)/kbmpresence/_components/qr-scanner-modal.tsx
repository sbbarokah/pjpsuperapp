"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qrRegionId = useRef(`qr-scanner-${Math.random().toString(36).substring(2, 10)}`).current;
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const initializeScanner = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const scanner = new Html5Qrcode(qrRegionId);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            // QR terdeteksi
            onScanSuccess(decodedText);
            // Hentikan scanner dan tutup modal
            // stopScanner();
            // onClose();
          },
          () => {
            // frame-to-frame error, abaikan
          }
        );

        if (isMounted) setIsLoading(false);
      } catch (err: any) {
        console.error("Gagal mengakses kamera:", err);
        if (isMounted) {
          setError("Tidak dapat mengakses kamera. Pastikan Anda menggunakan HTTPS dan memberikan izin kamera.");
          setIsLoading(false);
        }
      }
    };

    const stopScanner = async () => {
      const scanner = html5QrCodeRef.current;
      if (scanner && scanner.isScanning) {
        await scanner.stop();
        scanner.clear();
      }
      html5QrCodeRef.current = null;
    };

    initializeScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, qrRegionId, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-boxdark">
        {/* Tombol tutup */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-meta-4"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <h3 className="mb-3 text-center text-lg font-bold text-black dark:text-white">
          Pindai QR Code
        </h3>

        {/* Overlay loading di atas area kamera */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="text-sm text-gray-500">Membuka kamera...</div>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-lg bg-red-100 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Area kamera – selalu dirender agar library bisa mengukur ukuran */}
        <div
          id={qrRegionId}
          style={{ width: "100%", minHeight: "250px" }}
        />
      </div>
    </div>
  );
}