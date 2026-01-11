"use client";

import { useState } from "react";
import { getExportDataAction } from "../actions";
import { FaFileDownload, FaSpinner } from "react-icons/fa";

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // 1. Panggil Server Action
      const response = await getExportDataAction();
      
      if (!response.success || !response.data || response.data.length === 0) {
        alert("Gagal mengekspor data atau data kosong.");
        return;
      }

      // 2. Konversi JSON ke CSV
      const headers = Object.keys(response.data[0]);
      const csvRows = [
        headers.join(","), // Header Row
        ...response.data.map(row => 
          headers.map(fieldName => {
            const val = (row as any)[fieldName];
            // Escape quote dan bungkus string dalam quote untuk keamanan CSV
            const escaped = String(val ?? "").replace(/"/g, '""'); 
            return `"${escaped}"`;
          }).join(",")
        )
      ];
      
      const csvString = csvRows.join("\n");

      // 3. Trigger Download
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      const dateStr = new Date().toISOString().split("T")[0];
      a.setAttribute("download", `data_sensus_generus_${dateStr}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengekspor data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-green-600 bg-white px-4 py-2 text-center font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 dark:border-green-500 dark:bg-boxdark dark:text-green-500 dark:hover:bg-green-900/20"
    >
      {isLoading ? (
        <FaSpinner className="animate-spin h-4 w-4" />
      ) : (
        <FaFileDownload className="h-4 w-4" />
      )}
      {isLoading ? "Mengunduh..." : "Ekspor Data"}
    </button>
  );
}