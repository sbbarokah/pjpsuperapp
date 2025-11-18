import { cn } from "@/lib/utils";

// 3. TextAreaGroup (untuk Esai)
export const TextAreaGroupV2 = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  rows = 4,
  className
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  className?: string;
}) => (
  <div className={cn("mb-4.5", className)}>
    <label className="mb-2.5 block font-medium text-black dark:text-white">
      {label}
    </label>
    <textarea
      name={name}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
    />
  </div>
);
