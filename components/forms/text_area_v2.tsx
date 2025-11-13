// 3. TextAreaGroup (untuk Esai)
export const TextAreaGroupV2 = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}) => (
  <div className="mb-4.5">
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
