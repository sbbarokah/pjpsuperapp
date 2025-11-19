"use client";

import { CategoryModel } from "@/lib/types/master.types";
import { AggregatedGroupData } from "../detail/[year]/[month]/page";
import { KbmReportWithRelations } from "@/lib/types/report.types";

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
 * [REVISI]
 * Komponen Tabel Generik untuk Laporan Capaian, Sukses, dan Kendala
 * Sekarang mengelompokkan berdasarkan Kategori, lalu menampilkan Kelompok.
 */
const AchievementTable = ({
  data,
  field,
  title,
  categories, // Perlu daftar kategori untuk iterasi
}: {
  data: AggregatedGroupData[];
  field: keyof KbmReportWithRelations;
  title: string;
  categories: CategoryModel[];
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
      
      {/* 3. Iterasi PER KATEGORI terlebih dahulu */}
      {categories.map(category => {
        // 4. Ambil laporan untuk kategori ini
        const reportsForThisCategory = filteredReports.filter(
          item => item.report.category_id === category.id
        );

        // 5. Jika tidak ada laporan, jangan render apapun
        if (reportsForThisCategory.length === 0) {
          return null;
        }

        // 6. Render sub-judul kategori dan tabelnya
        return (
          <div key={category.id} className="mb-6 last:mb-0">
            <h4 className="mb-3 text-lg font-medium text-black dark:text-white">
              Kategori: {category.name}
            </h4>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                      Kelompok
                    </th>
                    <th className="px-4 py-4 font-medium text-black dark:text-white">
                      Catatan Laporan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportsForThisCategory.map((item) => (
                    <tr key={item.report.id}>
                      <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                        <p className="font-medium">{item.groupName}</p>
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
      })}
    </div>
  );
};


// --- Komponen Utama ---
export function VillageReportTables({ data, categories }: VillageReportTablesProps) {

  const allKbmReports = data.flatMap(groupData => 
    groupData.kbmReports.map(report => ({
      groupName: groupData.group.name,
      report: report
    }))
  ).sort((a, b) => { 
    // Urutkan berdasarkan nama kelompok, lalu kategori
    if (a.groupName < b.groupName) return -1;
    if (a.groupName > b.groupName) return 1;
    if (a.report.category.name < b.report.category.name) return -1;
    if (a.report.category.name > b.report.category.name) return 1;
    return 0;
  });

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
          Rekap Jumlah Generus per Kategori
        </h3>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white">Kelompok</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Kategori</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Laki-laki</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Perempuan</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Total</th>
              </tr>
            </thead>
            <tbody>
              {allKbmReports.map(({ groupName, report }) => (
                <tr key={report.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium">{groupName}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p>{report.category.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {report.count_male}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {report.count_female}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium">{report.count_total}</p>
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
          Rekap Kehadiran KBM per Kategori
        </h3>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white">Kelompok</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Kategori</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Hadir (%)</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Izin (%)</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Alpa (%)</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Total Pertemuan</th>
              </tr>
            </thead>
            <tbody>
              {allKbmReports.map(({ groupName, report }) => (
                <tr key={report.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium">{groupName}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p>{report.category.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="font-medium text-green-600">
                      {report.attendance_present_percentage.toFixed(1)}%
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {report.attendance_permission_percentage.toFixed(1)}%
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {report.attendance_absent_percentage.toFixed(1)}%
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    {report.attendance_total_meetings}
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
      
      
      {/* --- 5. Program Sukses --- */}
      <h2 className="text-2xl font-semibold text-black dark:text-white">
        Detail Laporan Program Sukses
      </h2>
      <AchievementTable 
        data={data}
        field="program_success_info"
        title="Rekap Informasi Program Sukses"
        categories={categories} // <-- Berikan daftar kategori
      />

      {/* --- 6. Kendala --- */}
      <h2 className="text-2xl font-semibold text-black dark:text-white">
        Detail Laporan Kendala & Solusi
      </h2>
      <AchievementTable 
        data={data}
        field="challenges_info"
        title="Rekap Informasi Kendala & Solusi"
        categories={categories} // <-- Berikan daftar kategori
      />

    </div>
  );
}