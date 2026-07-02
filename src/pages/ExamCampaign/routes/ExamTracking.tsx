import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@/api/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import Swal from "sweetalert2";

const columns: TableColumn[] = [
  { title: "STT", dataIndex: "STT" },
  { title: "Mã HS", dataIndex: "studentCode" },
  { title: "Họ tên", dataIndex: "name" },
  { title: "Lớp", dataIndex: "schoolClass" },
  { title: "SĐT", dataIndex: "phoneNumber" },
  { title: "Trạng thái", dataIndex: "statusBadge" },
];

interface StudentExamStatus {
  patientId: number;
  fullName: string;
  code: string;
  schoolClass: string;
  phoneNumber: string;
  examId?: number;
  examDate?: string;
  status: string;
}

const ExamTracking = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  );
  const [students, setStudents] = useState<StudentExamStatus[]>([]);
  const [dentists, setDentists] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "EXAMINED" | "NOT_EXAMINED"
  >("ALL");

  useEffect(() => {
    api
      .get("/api/exam-campaigns")
      .then((res) => {
        setCampaigns(res.data);
        if (res.data.length > 0) {
          setSelectedCampaignId(res.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCampaignId) return;
    setLoading(true);

    Promise.all([
      api.get(`/api/exam-campaigns/${selectedCampaignId}/students`),
      api.get(`/api/exam-campaigns/${selectedCampaignId}/schedules`),
    ])
      .then(([studentsRes, schedulesRes]) => {
        setStudents(studentsRes.data);

        const allDentists = new Set<string>();
        schedulesRes.data.forEach((schedule: any) => {
          if (schedule.dentistNames && Array.isArray(schedule.dentistNames)) {
            schedule.dentistNames.forEach((name: string) =>
              allDentists.add(name),
            );
          }
        });
        setDentists(Array.from(allDentists));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCampaignId]);

  const notifyDentists = async () => {
    if (!selectedCampaignId) return;
    setNotifying(true);
    try {
      await api.post(`/api/exam-campaigns/${selectedCampaignId}/notify`);
      Swal.fire(
        "Thành công",
        `Đã gửi thông báo cho bác sĩ của đợt khám`,
        "success",
      );
    } catch (e) {
      Swal.fire("Lỗi", "Không thể gửi thông báo", "error");
    } finally {
      setNotifying(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    filterStatus === "ALL" ? true : s.status === filterStatus,
  );

  const examinedCount = students.filter((s) => s.status === "EXAMINED").length;
  const notExaminedCount = students.filter(
    (s) => s.status === "NOT_EXAMINED",
  ).length;

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  const dataSource = filteredStudents.map((s, idx) => ({
    id: s.patientId,
    STT: idx + 1,
    studentCode: s.code,
    name: s.fullName,
    schoolClass: s.schoolClass,
    phoneNumber: s.phoneNumber,
    statusBadge:
      s.status === "EXAMINED" ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          ✓ Đã khám
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          ✗ Chưa khám
        </span>
      ),
  }));

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Theo dõi trạng thái khám</h1>

      {/* Campaign selector */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Chọn đợt khám:
          </label>
          <select
            className="text-ellipsis rounded border text-sm md:max-w-56 md:overflow-x-auto"
            value={selectedCampaignId ?? ""}
            onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {selectedCampaign && (
            <span className="text-xs text-gray-500">
              {selectedCampaign.startDate} → {selectedCampaign.endDate}
            </span>
          )}
        </div>

        {/* Dentists list */}
        {dentists.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Bác sĩ phụ trách:</span>
            <div className="flex flex-wrap gap-2">
              {dentists.map((dentist, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {dentist}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded border bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-800">{students.length}</p>
          <p className="text-sm text-gray-500">Tổng học sinh</p>
        </div>
        <div className="rounded border border-l-4 border-green-500 bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{examinedCount}</p>
          <p className="text-sm text-gray-500">Đã khám</p>
        </div>
        <div className="rounded border border-l-4 border-red-400 bg-white p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-red-500">{notExaminedCount}</p>
          <p className="text-sm text-gray-500">Chưa khám</p>
        </div>
      </div>

      {/* Filters + Actions */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          {(["ALL", "EXAMINED", "NOT_EXAMINED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`rounded px-3 py-1 text-sm font-medium ${
                filterStatus === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "ALL"
                ? "Tất cả"
                : f === "EXAMINED"
                ? "Đã khám"
                : "Chưa khám"}
            </button>
          ))}
        </div>
        <Button
          onClick={notifyDentists}
          isDisabled={notifying || notExaminedCount === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {notifying ? "Đang gửi..." : `Gửi thông báo cho bác sĩ`}
        </Button>
      </div>

      <Table columns={columns} dataSource={dataSource} loading={loading} />
    </div>
  );
};

export default ExamTracking;
