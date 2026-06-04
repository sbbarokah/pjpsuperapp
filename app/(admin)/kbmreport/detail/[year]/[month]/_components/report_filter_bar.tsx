"use client";

import { useRouter, usePathname } from "next/navigation";
import { SelectGroupV2 } from "@/components/forms/select_group_v2";
import { monthOptions } from "@/lib/constants";
import { GroupModel } from "@/lib/types/master.types";

interface ReportFilterBarProps {
  groups: GroupModel[];
  selectedGroupId: number;
  year: number;
  month: number;
}

export const ReportFilterBar = ({ groups, selectedGroupId, year, month }: ReportFilterBarProps) => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: currentYear, label: String(currentYear) },
    { value: currentYear - 1, label: String(currentYear - 1) },
  ];

  const updateFilters = (key: string, value: string | number) => {
    // Kita bangun URL baru: /kbmreport/detail-group/[year]/[month]?groupId=[id]
    // Logika update: jika bulan/tahun berubah, redirect ke route baru
    // jika group berubah, cukup update query param
    const newYear = key === "year" ? value : year;
    const newMonth = key === "month" ? value : month;
    const newGroup = key === "groupId" ? value : selectedGroupId;

    router.push(`/kbmreport/detail/${newYear}/${newMonth}?groupId=${newGroup}`);
  };

  return (
    <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg border border-stroke dark:bg-boxdark dark:border-strokedark mb-6">
      <div className="w-full sm:w-64">
        <SelectGroupV2
          label="Pilih Kelompok"
          name="groupId"
          value={selectedGroupId}
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
          onChange={(e) => updateFilters("groupId", e.target.value)}
        />
      </div>
      <div className="w-full sm:w-40">
        <SelectGroupV2
          label="Tahun"
          name="year"
          value={year}
          options={yearOptions}
          onChange={(e) => updateFilters("year", e.target.value)}
        />
      </div>
      <div className="w-full sm:w-40">
        <SelectGroupV2
          label="Bulan"
          name="month"
          value={month}
          options={monthOptions}
          onChange={(e) => updateFilters("month", e.target.value)}
        />
      </div>
    </div>
  );
};