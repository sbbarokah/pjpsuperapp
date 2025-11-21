"use client";

import { EvaluationRecapWithRelations } from "@/lib/types/evaluation.types";
import { Profile } from "@/lib/types/user.types";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEdit, FaTrashAlt, FaBook, FaCalendarAlt, FaUser } from "react-icons/fa";
import { deleteEvaluationRecapAction } from "../actions";
import { monthOptions } from "@/lib/constants";

interface ListProps {
  recaps: EvaluationRecapWithRelations[];
  profile: Profile;
}

const RecapCard = ({
  recap,
  onDelete,
}: {
  recap: EvaluationRecapWithRelations;
  onDelete: () => void;
}) => (
  <div className="flex flex-col justify-between rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
    <div className="p-4 border-b border-stroke dark:border-strokedark">
      <h3 className="font-semibold text-lg text-black dark:text-white truncate">
        {recap.group.name}
      </h3>
      <p className="text-sm font-medium text-primary">
        {recap.category.name}
      </p>
    </div>
    
    <div className="p-4 flex-grow min-h-[100px]">
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
        <FaCalendarAlt />
        <span>Periode: {monthOptions.find(m => m.value == recap.period_month)?.label} {recap.period_year}</span>
      </div>
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-700 dark:text-gray-300">
        <FaUser />
        <span>Author: {recap.author?.full_name}</span>
      </div>
      <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <FaBook className="mt-1 flex-shrink-0" />
        <p className="line-clamp-3">
          <span className="font-medium">Catatan:</span> {recap.notes || "-"}
        </p>
      </div>
    </div>
    
    <div className="p-4 border-t border-stroke dark:border-strokedark flex justify-end items-center gap-3">
      <Link href={`/kbmevaluation/edit/${recap.id}`} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm">
        <FaEdit /> Edit
      </Link>
      <button
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
      >
        <FaTrashAlt /> Hapus
      </button>
    </div>
  </div>
);

export function RecapListClient({ recaps, profile }: ListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const handleDelete = (id: string, groupName: string, catName: string) => {
    if (window.confirm(`Hapus rekap penilaian ${groupName} - ${catName}?`)) {
      startTransition(async () => {
        setError(null);
        const response = await deleteEvaluationRecapAction(id);
        if (!response.success) {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    }
  };

  if (recaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <h3 className="text-lg font-medium text-black dark:text-white">
          Belum Ada Rekap Penilaian
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Klik "Buat Rekap Baru" untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded border border-red-500 bg-red-100 p-3 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recaps.map((recap) => (
          <RecapCard
            key={recap.id}
            recap={recap}
            onDelete={() => handleDelete(recap.id, recap.group.name, recap.category.name)}
          />
        ))}
      </div>
    </div>
  );
}