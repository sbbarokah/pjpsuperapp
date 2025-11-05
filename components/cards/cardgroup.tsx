
import { GroupModel } from "@/lib/types/master.types"; // Impor tipe Anda
import { DataCard } from "./datacard";
import { truncateText } from "@/lib/utils";

type GroupCardProps = {
  group: GroupModel;
  /** Anda harus meneruskan nama desa hasil 'join' atau 'lookup' */
  villageName?: string;
  actions?: React.ReactNode;
  href?: string;
};

export function GroupCard({ group, villageName, actions, href }: GroupCardProps) {
  return (
    <DataCard actions={actions} href={href}>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-black dark:text-white truncate">
          {group.name}
        </h3>
        
        {villageName && (
          <div className="text-sm font-medium text-primary dark:text-primary-light">
            {/* Anda bisa tambahkan ikon 'pin' di sini jika mau */}
            {villageName}
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-300">
          {truncateText(group.description, 50)}
        </p>
      </div>
    </DataCard>
  );
}