
import { VillageModel } from "@/lib/types/master.types"; // Impor tipe Anda
import { DataCard } from "./datacard";
import { truncateText } from "@/lib/utils";

type VillageCardProps = {
  village: VillageModel;
  actions?: React.ReactNode;
  href?: string;
};

export function VillageCard({ village, actions, href }: VillageCardProps) {
  return (
    <DataCard actions={actions} href={href}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-black dark:text-white truncate">
          {village.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {truncateText(village.description, 50)}
        </p>
      </div>
    </DataCard>
  );
}