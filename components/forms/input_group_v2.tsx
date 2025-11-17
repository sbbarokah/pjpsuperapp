// 1. InputGroup (untuk Teks dan Angka)
export const InputGroupV2 = ({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  required,
  readOnly = false,
  disabled = false,
  step,
  min,
  max
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  step?: string;
  min?: string;
  max?: string;
}) => (
  <div className="mb-4.5">
    <label className="mb-2.5 block font-medium text-black dark:text-white">
      {label} {required && <span className="text-meta-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
      step={step}
      min={min}
      max={max}
      className={`w-full rounded border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary dark:disabled:bg-boxdark-2`}
    />
  </div>
);