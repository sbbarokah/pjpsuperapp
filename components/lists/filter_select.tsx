import { FaFilter } from "react-icons/fa";

/**
 * [BARU] Komponen Select Dropdown internal yang ringan
 */
export const FilterSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder: string;
}) => (
  <div>
    <label htmlFor={name} className="mb-2.5 block font-medium text-black dark:text-white">
      {label}
    </label>
    <div className="relative z-20 bg-transparent dark:bg-form-input">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        // Gunakan style yang sama dengan search bar Anda
        className="relative z-20 w-full appearance-none rounded-full border border-stroke bg-white py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:focus-visible:border-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {/* Ikon panah/filter */}
      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
        <FaFilter className="text-gray-500" />
      </span>
    </div>
  </div>
);