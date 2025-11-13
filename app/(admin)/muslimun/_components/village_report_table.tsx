"use client";

import { CategoryModel } from "@/lib/types/master.types";
import { AggregatedGroupData } from "../detail/[year]/[month]/page";
import { KbmReportWithCategory } from "@/lib/types/report.types";

interface VillageReportTablesProps {
  data: AggregatedGroupData[];
  categories: CategoryModel[];
}

/**
 * Helper untuk menghitung rata-rata dengan aman
 */
const getAverage = (sum: number, count: number) => {
  if (count === 0) return 0;
  return (sum / count);
};

/**
 * Komponen Tabel Generik untuk Laporan Capaian, Sukses, dan Kendala
 * Ini akan me-render satu baris untuk setiap KBM Report (per kategori)
 */
const AchievementTable = ({
  data,
  field,
  title
}: {
  data: AggregatedGroupData[];
  field: keyof KbmReportWithCategory;
  title: string;
}) => {
  // 1. Pipihkan data: Ubah dari [Group] > [KBMs] menjadi daftar KBM
  const allKbmReports = data.flatMap(groupData => 
    groupData.kbmReports.map(report => ({
      groupName: groupData.group.name,
      report: report
    }))
  );

  // 2. Filter hanya yang memiliki isi
  const filteredReports = allKbmReports.filter(item => 
    item.report[field] && String(item.report[field]).trim() !== ""
  );

  if (filteredReports.length === 0) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">Tidak ada data untuk ditampilkan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        {title}
      </h3>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                Kelompok
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                Kategori
              </th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">
                Catatan Laporan
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((item) => (
              <tr key={item.report.id}>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="font-medium">{item.groupName}</p>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p>{item.report.category?.name || "N/A"}</p>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="text-black dark:text-white whitespace-pre-wrap">
                    {String(item.report[field])}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- Komponen Utama ---
export function VillageReportTables({ data, categories }: VillageReportTablesProps) {
  
  // Daftar bidang capaian yang ingin ditampilkan
  const achievementFields: (keyof KbmReportWithCategory)[] = [
    'achievement_quran_meaning',
    'achievement_hadith_meaning',
    'achievement_quran_reading',
    'achievement_writing',
    'achievement_surah_memorization',
    'achievement_dalil_memorization',
    'achievement_prayer_memorization',
    'achievement_asmaul_husna',
    'achievement_tajwid',
    'achievement_practices',
    'achievement_character',
  ];

  // Label untuk bidang capaian
  const achievementLabels: Record<string, string> = {
    'achievement_quran_meaning': "Makna Al-Qur'an",
    'achievement_hadith_meaning': "Makna Al-Hadist",
    'achievement_quran_reading': "Bacaan Al-Qur'an / Tilawaty / Iqro",
    'achievement_writing': "Menulis (Pegon/Arab)",
    'achievement_surah_memorization': "Hafalan Surat",
    'achievement_dalil_memorIZATION': "Hafalan Dalil",
    'achievement_prayer_memorization': "Hafalan Do'a",
    'achievement_asmaul_husna': "Asmaul Husna",
    'achievement_tajwid': "Tajwid",
    'achievement_practices': "Praktik Ibadah",
    'achievement_character': "Akhlaqul Karimah",
  };

  return (
    <div className="flex flex-col gap-8">
      {/* --- 1. Musyawarah 5 unsur --- */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Laporan Musyawarah 5 Unsur (Muslimun)
        </h3>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white">Kelompok</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Tgl Musy.</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Unsur KI</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Pakar</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Mubaligh</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Ortu</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ group, meetingReport }) => (
                <tr key={group.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium">{group.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {meetingReport ? meetingReport.muroh_date : <span className="text-gray-500">N/A</span>}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {meetingReport?.element_ki || "-"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {meetingReport?.element_expert || "-"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {meetingReport?.element_mubaligh || "-"}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {meetingReport?.element_parent || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 2. Jumlah Generus --- */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Rekap Jumlah Generus
        </h3>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white">Kelompok</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Laki-laki</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Perempuan</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ group, summary }) => (
                <tr key={group.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium">{group.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {summary.count_male}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {summary.count_female}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium">{summary.count_total}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- 3. Kehadiran --- */}
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Rekap Rata-Rata Kehadiran KBM
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          * Rata-rata dihitung dari semua laporan KBM per kategori yang masuk.
        </p>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white">Kelompok</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Hadir (%)</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Izin (%)</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Alpa (%)</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Total Pertemuan</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ group, summary }) => (
                <tr key={group.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium">{group.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium text-green-600">
                      {getAverage(summary.attendance_present_sum, summary.attendance_report_count).toFixed(1)}%
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {getAverage(summary.attendance_permission_sum, summary.attendance_report_count).toFixed(1)}%
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {getAverage(summary.attendance_absent_sum, summary.attendance_report_count).toFixed(1)}%
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {summary.attendance_total_meetings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- 4. Laporan Pencapaian (Looping) --- */}
      <h2 className="text-2xl font-semibold text-black dark:text-white">
        Detail Laporan Pencapaian KBM
      </h2>
      {achievementFields.map(field => (
        <AchievementTable 
          key={field}
          data={data}
          field={field}
          title={`Rekap Capaian: ${achievementLabels[field] || field}`}
        />
      ))}
      
      {/* --- 5. Program Sukses --- */}
      <h2 className="text-2xl font-semibold text-black dark:text-white">
        Detail Laporan Program Sukses
      </h2>
      <AchievementTable 
        data={data}
        field="program_success_info"
        title="Rekap Informasi Program Sukses"
      />

      {/* --- 6. Kendala --- */}
      <h2 className="text-2xl font-semibold text-black dark:text-white">
        Detail Laporan Kendala & Solusi
      </h2>
      <AchievementTable 
        data={data}
        field="challenges_info"
        title="Rekap Informasi Kendala & Solusi"
      />

    </div>
  );
}