"use client";

import { StudentAttendanceData } from "@/lib/types/attendance.types";
import { KbmDetailContext, KbmDetailData } from "@/lib/types/report.types";
import { FaUsers, FaClipboardList, FaExclamationTriangle, FaLightbulb, FaStickyNote } from "react-icons/fa";
import { MdReport } from "react-icons/md";

export function KbmCategorySection({ 
  data, 
  context 
}: { 
  data: KbmDetailData, 
  context: KbmDetailContext 
}) {
  const { category, attendance, evaluation, manualReport } = data;
  
  // Jika tidak ada data sama sekali untuk kategori ini
  if (!attendance && !evaluation && !manualReport) {
    return null; // Atau tampilkan pesan "Data Kosong"
  }

  const hasDetailAttendance = !!attendance;
  const hasDetailEvaluation = !!evaluation;

  // Helper untuk mengambil nama siswa dari ID
  const getStudentName = (id: string) => context.students.get(id) || "Siswa Tidak Dikenal";

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {/* Header Kategori */}
      <div className="bg-gray-100 dark:bg-meta-4 px-6 py-4 border-b border-stroke dark:border-strokedark">
        <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          <span className="inline-block w-3 h-8 bg-primary rounded-sm mr-2"></span>
          Kelas: {category.name}
        </h3>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 flex gap-4">
           <span>Pertemuan: {attendance?.meeting_count || manualReport?.attendance_total_meetings || 0} kali</span>
           <span>Jumlah Generus: {attendance?.generus_count || manualReport?.count_total || 0} orang</span>
           <span>(L: {attendance?.raw_data.count_male || manualReport?.count_male || 0}; P: {attendance?.raw_data.count_female || manualReport?.count_female || 0})</span>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-8">
        
        {/* --- BAGIAN 1: KEHADIRAN --- */}
        <div>
          <h4 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <FaUsers className="text-primary" /> Rekap Kehadiran
          </h4>
          
          {hasDetailAttendance ? (
            /* TAMPILKAN TABEL DETAIL PRESENSI */
            <div className="max-w-full overflow-x-auto border rounded-lg dark:border-strokedark">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="px-4 py-3 font-medium text-black dark:text-white">Nama Generus</th>
                    <th className="px-4 py-3 font-medium text-center text-green-600">Hadir</th>
                    <th className="px-4 py-3 font-medium text-center text-yellow-600">Izin</th>
                    <th className="px-4 py-3 font-medium text-center text-red-600">Alfa</th>
                    <th className="px-4 py-3 font-medium text-center text-black dark:text-white">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(attendance!.raw_data.attendances).map(([userId, stats]: [string, StudentAttendanceData]) => {
                    const total = stats.p + stats.i + stats.a;
                    const percent = total > 0 ? (stats.p / total) * 100 : 0;
                    return (
                      <tr key={userId} className="border-b border-stroke dark:border-strokedark">
                        {/* <td className="px-4 py-3 text-black dark:text-white">{getStudentName(userId)}</td> */}
                        <td className="px-4 py-3 text-black dark:text-white">{stats.name}</td>
                        <td className="px-4 py-3 text-center">{stats.p}</td>
                        <td className="px-4 py-3 text-center">{stats.i}</td>
                        <td className="px-4 py-3 text-center">{stats.a}</td>
                        <td className="px-4 py-3 text-center font-bold">{percent.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                  {/* Baris Total Rata-rata */}
                  <tr className="bg-gray-50 dark:bg-meta-4 font-bold">
                    <td className="px-4 py-3 text-right">Rata-rata Kelas:</td>
                    <td className="px-4 py-3 text-center text-green-600">{attendance!.present_percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center text-yellow-600">{attendance!.permission_percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center text-red-600">{attendance!.absent_percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* FALLBACK KE DATA MANUAL */
            <div className="grid grid-cols-3 gap-4 text-center p-4 bg-gray-50 rounded-lg dark:bg-meta-4">
               <div>
                  <span className="block text-2xl font-bold text-green-600">{manualReport?.attendance_present_percentage || 0}%</span>
                  <span className="text-sm">Rata-rata Hadir</span>
               </div>
               <div>
                  <span className="block text-2xl font-bold text-yellow-600">{manualReport?.attendance_permission_percentage || 0}%</span>
                  <span className="text-sm">Rata-rata Izin</span>
               </div>
               <div>
                  <span className="block text-2xl font-bold text-red-600">{manualReport?.attendance_absent_percentage || 0}%</span>
                  <span className="text-sm">Rata-rata Alfa</span>
               </div>
            </div>
          )}
        </div>

        {/* --- BAGIAN 2: EVALUASI MATERI --- */}
        <div>
          <h4 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
            <FaClipboardList className="text-primary" /> Evaluasi Materi & Penilaian
          </h4>

          {hasDetailEvaluation ? (
            /* LOOPING RAW DATA EVALUASI (ARRAY) */
            <div className="flex flex-col gap-6">
              {evaluation!.raw_data.map((item, idx) => {
                const matName = context.materials.get(item.material_id) || "Materi Tidak Dikenal";
                const matCatName = context.materialCategories.get(item.material_category_id) || "Kategori Lain";
                const showDetails = item.show_details ?? false;
                
                return (
                  <div key={idx} className="border border-stroke rounded-lg p-4 dark:border-strokedark">
                    <div className="mb-3 pb-2 border-b border-stroke dark:border-strokedark">
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-bold">{matCatName}</span>
                      <h5 className="text-lg font-bold text-black dark:text-white">{matName}</h5>
                    </div>

                    {/* Tabel Nilai Siswa */}
                    {showDetails && (
                      <div className="mb-4">
                        <table className="w-full text-sm">
                          <tbody>
                            {/* {Object.entries(item.scores).map(([userId, score]) => ( */}
                            {Object.entries(item.scores).map(([userId, scoreData]: [string, any]) => (  
                              <tr key={userId} className="border-b border-dashed border-gray-200 last:border-0 dark:border-gray-700">
                                {/* <td className="py-1 w-1/2 text-gray-600 dark:text-gray-300">{getStudentName(userId)}</td>
                                <td className="py-1 w-1/2 font-medium text-black dark:text-white">{score}</td> */}
                                <td className="py-1 w-1/2 text-gray-600 dark:text-gray-300">
                                  {scoreData.name} 
                                </td>
                                <td className="py-1 w-1/2 font-medium text-black dark:text-white">
                                  {scoreData.score}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Box Evaluasi Materi */}
                    <div className="bg-blue-50 dark:bg-boxdark-2 p-3 rounded border border-blue-100 dark:border-strokedark text-sm">
                      <span className="font-bold text-blue-800 dark:text-blue-300 block mb-1">Evaluasi / Capaian:</span>
                      {item.evaluation_note || "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* FALLBACK KE MANUAL REPORT RAW DATA */
            <div className="flex flex-col gap-4">
               {manualReport?.raw_data ? (
                 Object.entries(manualReport.raw_data).map(([matId, note]) => {
                   const matName = context.materials.get(matId) || "Materi ID: " + matId;
                   // Note: Di manual report kita mungkin tidak punya category ID di raw_data, 
                   // kecuali kita fetch materinya lagi. Di sini kita tampilkan flat.
                   return (
                     <div key={matId} className="border border-stroke rounded p-4 dark:border-strokedark">
                        <h5 className="font-bold text-black dark:text-white mb-2">{matName}</h5>
                        <p className="text-sm">{note ? note.toString() : ""}</p>
                     </div>
                   );
                 })
               ) : (
                 <p className="text-gray-500 italic">Tidak ada data penilaian rinci.</p>
               )}
            </div>
          )}
        </div>

        {/* --- BAGIAN 3: ESAI (TANTANGAN, SOLUSI, NOTES) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Mengambil dari EvaluationRecap jika ada, fallback ke KbmReport */}
           
           {/* Box Tantangan (Prioritas: Manual Report challenges) */}
           <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:bg-boxdark-2 dark:border-strokedark">
              <h5 className="font-bold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                <MdReport /> Info Keberhasilan Program
              </h5>
              <p className="text-sm whitespace-pre-wrap">
                {manualReport?.program_success_info || evaluation?.achievement || "-"}
              </p>
           </div>
           
           {/* Box Tantangan (Prioritas: Manual Report challenges) */}
           <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-boxdark-2 dark:border-strokedark">
              <h5 className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                <FaExclamationTriangle /> Tantangan / Kendala
              </h5>
              <p className="text-sm whitespace-pre-wrap">
                {manualReport?.challenges_info || evaluation?.challenges || "-"}
              </p>
           </div>

           {/* Box Solusi (Prioritas: Evaluation Recap solutions -> atau gabung di challenges report) */}
           <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:bg-boxdark-2 dark:border-strokedark">
              <h5 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-2">
                <FaLightbulb /> Solusi / Usulan
              </h5>
              <p className="text-sm whitespace-pre-wrap">
                {evaluation?.solutions || (manualReport?.challenges_info ? "(Lihat kolom kendala)" : "-")}
              </p>
           </div>
           
           {/* Box Catatan / Program Sukses */}
           {/* <div className="col-span-1 md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:bg-boxdark-2 dark:border-strokedark"> */}
           <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:bg-boxdark-2 dark:border-strokedark">
              <h5 className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                <FaStickyNote /> Catatan Lain
              </h5>
              <p className="text-sm whitespace-pre-wrap">
                {manualReport?.program_success_info || evaluation?.notes || "-"}
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}