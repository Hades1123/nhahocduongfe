import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { reportApi } from "@/api/reportApi";
import Button from "@/components/Button";

interface Props {}

const Dashboard = (props: Props) => {
  const [stats, setStats] = useState<any>(null);
  const [reExams, setReExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [reExamSearch, setReExamSearch] = useState("");
  const [studentCounts, setStudentCounts] = useState<any[]>([]);
  const [studentCountHistory, setStudentCountHistory] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    // Fetch stats, re-exams, and student counts in parallel
    Promise.all([
      api.get("/api/dashboard/stats").then((res) => res.data),
      api.get("/api/exams/re-exams").then((res) => res.data).catch(() => []),
      api.get("/api/dashboard/student-count-history").then(res => res.data).catch(() => []),
    ])
      .then(([statsData, reExamsData, historyData]) => {
        setStats(statsData);
        setReExams(reExamsData);
        setStudentCountHistory(historyData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="font-medium text-gray-500">
            Đang tải dữ liệu tổng quan...
          </p>
        </div>
      </div>
    );
  }

  // Filter school classes based on search
  const filteredSchoolClasses = (stats?.cariesBySchoolClass || []).filter(
    (item: any) =>
      item.schoolName.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      item.schoolClass.toLowerCase().includes(schoolSearch.toLowerCase()),
  );

  // Filter re-exams based on search
  const filteredReExams = reExams.filter(
    (item: any) =>
      item.patientName.toLowerCase().includes(reExamSearch.toLowerCase()) ||
      item.schoolClass.toLowerCase().includes(reExamSearch.toLowerCase()),
  );

  // Heatmap teeth definition
  const upperLeft = ["18", "17", "16", "15", "14", "13", "12", "11"];
  const upperRight = ["21", "22", "23", "24", "25", "26", "27", "28"];
  const lowerLeft = ["48", "47", "46", "45", "44", "43", "42", "41"];
  const lowerRight = ["31", "32", "33", "34", "35", "36", "37", "38"];

  const getHeatmapColor = (count: number) => {
    if (!count || count === 0)
      return "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
    if (count <= 2)
      return "bg-amber-100 text-amber-850 border-amber-300 hover:bg-amber-200";
    if (count <= 5)
      return "bg-orange-200 text-orange-900 border-orange-400 hover:bg-orange-300";
    return "bg-rose-500 text-white border-rose-600 hover:bg-rose-600 animate-pulse";
  };

  const getToothCount = (toothCode: string) => {
    return stats?.pathologyHeatmap?.[toothCode] || 0;
  };

  // Find max caries rate for graph scaling
  const years = stats?.statsByYear || [];
  const maxCariesRate = Math.max(...years.map((y: any) => y.cariesRate), 10);

  return (
    <div className="min-h-screen space-y-6 bg-gray-50/50 p-6 text-gray-800">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            Tổng Quan Hệ Thống Nha Học Đường
          </h1>
          <p className="mt-1 text-gray-500">
            Báo cáo tổng hợp số liệu khám răng miệng học đường thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => reportApi.downloadAllSchoolsExcel()}
          >
            Xuất Excel Tổng Hợp
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-green-500"></span>
            Dữ liệu trực tuyến
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Tổng Đợt Khám
              </h3>
              <p className="text-3.5xl mt-2 font-black text-gray-900 dark:text-slate-100">
                {stats?.totalCampaigns}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-transform group-hover:scale-110"></div>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Đợt Đang Hoạt Động
              </h3>
              <p className="text-3.5xl mt-2 font-black text-green-600">
                {stats?.activeCampaigns}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-600 transition-transform group-hover:scale-110"></div>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Tổng Số Học Sinh
              </h3>
              <p className="text-3.5xl mt-2 font-black text-gray-900 dark:text-slate-100">
                {stats?.totalStudents}
              </p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600 transition-transform group-hover:scale-110"></div>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Đã Khám Xong
              </h3>
              <p className="text-3.5xl mt-2 font-black text-purple-600">
                {stats?.totalExamined}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600 transition-transform group-hover:scale-110">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* Student Count by Year */}
      {studentCountHistory.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            📊 Biến động sĩ số qua các năm học
          </h2>
          <div className="flex h-[200px] items-end justify-around border-b border-gray-200 px-4 pb-6 pt-4">
            {(() => {
              const maxCount = Math.max(...studentCountHistory.map((y: any) => y.studentCount), 1);
              return studentCountHistory.map((y: any, idx: number) => {
                const heightPercent = `${(y.studentCount / maxCount) * 100}%`;
                return (
                  <div key={idx} className="group relative flex w-24 flex-col items-center">
                    <div className="absolute bottom-full z-10 mb-2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {y.studentCount} học sinh
                    </div>
                    <div className="flex h-32 w-12 items-end overflow-hidden rounded-t-lg bg-gray-100">
                      <div
                        className="w-full bg-indigo-500 transition-all duration-500 hover:bg-indigo-600"
                        style={{ height: heightPercent }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-indigo-600">
                      {y.studentCount}
                    </div>
                    <div className="mt-1 text-xs font-medium text-gray-500">
                      {y.yearName}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Years & Top Schools */}
        <div className="flex flex-col space-y-6 lg:col-span-2">
          {/* Year-by-year Chart */}
          <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
              Biểu đồ tỷ lệ sâu răng theo năm học
            </h2>
            <div className="flex h-[240px] items-end justify-around border-b border-gray-200 px-4 pb-6 pt-4">
              {years.map((y: any, idx: number) => {
                const heightPercent = `${
                  (y.cariesRate / maxCariesRate) * 100
                }%`;
                return (
                  <div
                    key={idx}
                    className="group relative flex w-20 flex-col items-center"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full z-10 mb-2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      Sâu răng: {y.cariesCount}/{y.totalExamined} HS (
                      {y.cariesRate}%)
                    </div>
                    {/* Bar Track & Fill */}
                    <div className="flex h-36 w-8 items-end overflow-hidden rounded-t-lg bg-gray-100">
                      <div
                        className="w-full cursor-pointer bg-blue-500 transition-all duration-500 hover:bg-blue-600"
                        style={{ height: heightPercent }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-blue-600">
                      {y.cariesRate}%
                    </div>
                    <div className="mt-1 text-xs font-medium text-gray-500">
                      Năm {y.year}
                    </div>
                  </div>
                );
              })}
              {years.length === 0 && (
                <div className="py-12 text-gray-400">
                  Không có dữ liệu năm học
                </div>
              )}
            </div>
          </div>

          {/* Caries Rate by School/Class */}
          <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
                Thống kê tỷ lệ sâu răng theo trường/lớp
              </h2>
              <input
                type="text"
                placeholder="Tìm trường/lớp..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-[300px] flex-1 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600">
                      Trường
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600">
                      Lớp
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase text-gray-600">
                      Đã Khám
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase text-gray-600">
                      Sâu Răng
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-600">
                      Tỷ Lệ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredSchoolClasses.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                        {item.schoolName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.schoolClass}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.totalExamined}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-red-500">
                        {item.cariesCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            item.cariesRate > 50
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.cariesRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredSchoolClasses.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-400"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Pathology Heatmap & Top Schools */}
        <div className="flex flex-col space-y-6">
          {/* Top Schools */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
              Top trường có tỷ lệ bệnh răng miệng cao
            </h2>
            <div className="space-y-4">
              {(stats?.topSchoolsCaries || []).map(
                (school: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold text-gray-700">
                      <span className="max-w-[80%] truncate">
                        {idx + 1}. {school.schoolName}
                      </span>
                      <span className="text-red-500">{school.cariesRate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${school.cariesRate}%` }}
                      ></div>
                    </div>
                  </div>
                ),
              )}
              {(stats?.topSchoolsCaries || []).length === 0 && (
                <div className="py-6 text-center text-gray-400">
                  Không có dữ liệu top trường
                </div>
              )}
            </div>
          </div>

          {/* Pathology Heatmap */}
          <div className="flex flex-1 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
                Heatmap phân bố sâu răng theo vị trí răng
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Sơ đồ cung răng với số ca sâu răng trên từng răng
              </p>
            </div>

            <div className="my-6 space-y-4">
              {/* Upper Arch */}
              <div>
                <div className="mb-1 text-center text-xs font-bold text-gray-400">
                  Cung Răng Hàm Trên
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {/* Left part of upper arch (18 to 11) */}
                  {upperLeft.map((t) => (
                    <div
                      key={t}
                      className={`flex h-11 cursor-help flex-col justify-center rounded border text-center transition-colors ${getHeatmapColor(
                        getToothCount(t),
                      )}`}
                      title={`Răng ${t}: ${getToothCount(t)} ca sâu`}
                    >
                      <span className="text-[10px] font-bold">{t}</span>
                      <span className="text-xs font-black">
                        {getToothCount(t)}
                      </span>
                    </div>
                  ))}
                  {/* Right part of upper arch (21 to 28) */}
                  {upperRight.map((t) => (
                    <div
                      key={t}
                      className={`flex h-11 cursor-help flex-col justify-center rounded border text-center transition-colors ${getHeatmapColor(
                        getToothCount(t),
                      )}`}
                      title={`Răng ${t}: ${getToothCount(t)} ca sâu`}
                    >
                      <span className="text-[10px] font-bold">{t}</span>
                      <span className="text-xs font-black">
                        {getToothCount(t)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower Arch */}
              <div>
                <div className="grid grid-cols-8 gap-1.5">
                  {/* Left part of lower arch (48 to 41) */}
                  {lowerLeft.map((t) => (
                    <div
                      key={t}
                      className={`flex h-11 cursor-help flex-col justify-center rounded border text-center transition-colors ${getHeatmapColor(
                        getToothCount(t),
                      )}`}
                      title={`Răng ${t}: ${getToothCount(t)} ca sâu`}
                    >
                      <span className="text-[10px] font-bold">{t}</span>
                      <span className="text-xs font-black">
                        {getToothCount(t)}
                      </span>
                    </div>
                  ))}
                  {/* Right part of lower arch (31 to 38) */}
                  {lowerRight.map((t) => (
                    <div
                      key={t}
                      className={`flex h-11 cursor-help flex-col justify-center rounded border text-center transition-colors ${getHeatmapColor(
                        getToothCount(t),
                      )}`}
                      title={`Răng ${t}: ${getToothCount(t)} ca sâu`}
                    >
                      <span className="text-[10px] font-bold">{t}</span>
                      <span className="text-xs font-black">
                        {getToothCount(t)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-center text-xs font-bold text-gray-400">
                  Cung Răng Hàm Dưới
                </div>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-between border-t pt-3 text-xs">
              <span className="font-semibold text-gray-500">Mức độ:</span>
              <div className="flex gap-2">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border bg-emerald-50"></span>
                  0
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border bg-amber-100"></span>
                  1-2
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border bg-orange-200"></span>
                  3-5
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border bg-rose-500"></span>
                  &gt;5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Students needing re-exam */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100">
            Danh sách học sinh cần tái khám
          </h2>
          <input
            type="text"
            placeholder="Tìm tên học sinh, lớp..."
            value={reExamSearch}
            onChange={(e) => setReExamSearch(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Họ Tên
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Lớp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Ngày Khám Lần Cuối
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Ngày Tái Khám Dự Kiến
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">
                  Lý Do / Ghi Chú
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredReExams.slice(0, 10).map((e: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-slate-100">
                    {e.patientName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{e.schoolClass}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                      {e.reExamDate}
                    </span>
                  </td>
                  <td className="px-4 py-3 italic text-gray-500">
                    {e.reExamNote}
                  </td>
                </tr>
              ))}
              {filteredReExams.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Không có học sinh nào cần tái khám
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredReExams.length > 10 && (
            <div className="border-t pt-3 text-center text-xs text-gray-400">
              Hiển thị 10 học sinh đầu tiên trong tổng số{" "}
              {filteredReExams.length} học sinh cần tái khám
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
