"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";

interface MultiSelectFilterProps {
  label: string;
  name: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: string[];
  placeholder: string;
}

export function MultiSelectFilter({
  label,
  name,
  selectedValues,
  onChange,
  options,
  placeholder,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-2.5 block font-medium text-black dark:text-white">
        {label}
      </label>

      {/* Tombol Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-20 flex w-full items-center justify-between rounded-full border border-stroke bg-white py-3 pl-5 pr-12 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:focus-visible:border-primary"
      >
        <span className="text-left truncate">
          {selectedValues.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <span className="text-black dark:text-white">
              {selectedValues.length} dipilih
            </span>
          )}
        </span>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-gray-dark p-2">
          {/* Pencarian cepat? Tidak perlu untuk sekarang */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-dark-3"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-dark-4"
                />
                <span className="text-sm font-medium text-black dark:text-white">
                  {option}
                </span>
              </label>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="border-t border-stroke pt-2 mt-2 px-2">
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Hapus semua
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tag/chip jika ada yang dipilih (opsional) */}
      {selectedValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedValues.slice(0, 3).map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/20"
            >
              {val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="ml-0.5 rounded-full hover:text-red-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedValues.length > 3 && (
            <span className="text-xs text-gray-500">+{selectedValues.length - 3} lainnya</span>
          )}
        </div>
      )}
    </div>
  );
}