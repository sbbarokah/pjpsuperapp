
import { CategoryModel } from "@/lib/types/master.types"; // Impor tipe Anda
import { DataCard } from "./datacard";
import { truncateText } from "@/lib/utils";

type CategoryCardProps = {
  category: CategoryModel;
  /** Kirim komponen Tombol Aksi (misalnya, dropdown edit/hapus) */
  actions?: React.ReactNode;
  href?: string;
};

export function CategoryCard({ category, actions, href }: CategoryCardProps) {
  return (
    <DataCard actions={actions} href={href}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-black dark:text-white truncate">
          {category.name} ({category.id})
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {truncateText(category.description, 50)}
        </p>
      </div>
    </DataCard>
  );
}