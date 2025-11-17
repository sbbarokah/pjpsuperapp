// 2. SelectGroupV2 (untuk Dropdown)
export const SelectGroupV2 = ({
  label,
  name,
  value,
  onChange,
  required,
  options,
  disabled = false,
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
}) => (
  <div className="mb-4.5">
    <label className="mb-2.5 block font-medium text-black dark:text-white">
      {label} {required && <span className="text-meta-1">*</span>}
    </label>
    <div className="relative z-20 bg-transparent dark:bg-form-input">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
      >
        <option value="">Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.0001 13.125C9.81258 13.125 9.62508 13.0625 9.46883 12.9062L4.46883 7.90623C4.15633 7.59373 4.15633 7.09373 4.46883 6.78123C4.78133 6.46873 5.28133 6.46873 5.59383 6.78123L10.0001 11.1875L14.4063 6.78123C14.7188 6.46873 15.2188 6.46873 15.5313 6.78123C15.8438 7.09373 15.8438 7.59373 15.5313 7.90623L10.5313 12.9062C10.3751 13.0625 10.1876 13.125 10.0001 13.125Z"
            fill="#637381"
          />
        </svg>
      </span>
    </div>
  </div>
);