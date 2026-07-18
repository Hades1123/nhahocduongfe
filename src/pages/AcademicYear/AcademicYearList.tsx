import React, { useEffect, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import {
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import AcademicYearFormModal from "./AcademicYearFormModal";
import YearTransitionDialog from "./YearTransitionDialog";
import { AcademicYear, academicYearApi } from "@/api/academicYearApi";
import { api } from "@/api/api";

const columns: TableColumn[] = [
  { title: "STT", dataIndex: "stt" },
  { title: "Tên năm học", dataIndex: "name" },
  { title: "Ngày bắt đầu", dataIndex: "startDate" },
  { title: "Ngày kết thúc", dataIndex: "endDate" },
  { title: "Trạng thái", dataIndex: "statusBadge" },
  { title: "Thao tác", dataIndex: "action", isAction: true },
];

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Chưa bắt đầu",
  CURRENT: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
};

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  CURRENT: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const AcademicYearList = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>(undefined);
  const [transitionOpen, setTransitionOpen] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const data = await academicYearApi.getAll();
      setYears(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/academic-years/history");
      setHistory(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleAdd = () => {
    setEditId(undefined);
    setFormOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditId(id);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await academicYearApi.delete(id);
        Swal.fire("Đã xóa!", "", "success");
        fetchYears();
      } catch (e: any) {
        Swal.fire("Lỗi!", e?.response?.data?.message || "Không thể xóa", "error");
      }
    }
  };

  const handleRollback = async (sessionId: string) => {
    const result = await Swal.fire({
      title: "Xác nhận khôi phục?",
      text: "Toàn bộ thay đổi của phiên chuyển năm này sẽ được hoàn tác. Năm cũ sẽ trở lại trạng thái Đang diễn ra.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Khôi phục",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        const res = await academicYearApi.rollback(sessionId);
        Swal.fire("Thành công!", res.message, "success");
        fetchYears();
        fetchHistory();
      } catch (e: any) {
        Swal.fire("Lỗi!", e?.response?.data?.message || "Không thể khôi phục", "error");
      }
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    fetchYears();
  };

  const handleTransitionSuccess = () => {
    setTransitionOpen(false);
    fetchYears();
    fetchHistory();
  };

  const tableData = years.map((y, i) => ({
    stt: i + 1,
    name: y.name,
    startDate: y.startDate || "-",
    endDate: y.endDate || "-",
    statusBadge: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[y.status] || ""}`}>
        {STATUS_LABELS[y.status] || y.status}
      </span>
    ),
    action: (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(y.id)} className="text-blue-600 hover:text-blue-800" title="Sửa">
          <PencilSquareIcon className="w-5 h-5" />
        </button>
        {y.status !== "CURRENT" && (
          <button onClick={() => handleDelete(y.id)} className="text-red-600 hover:text-red-800" title="Xóa">
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    ),
  }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Bảng năm học ── */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl font-bold">Quản lý năm học</h2>
          <div className="flex flex-wrap gap-2">
            <Button variants="contained" onClick={handleAdd}>
              + Thêm năm học
            </Button>
            <Button variants="outlined" onClick={() => { setTransitionOpen(true); }}>
              <ArrowPathIcon className="w-5 h-5 mr-1" />
              Chuyển năm học
            </Button>
            <Button variants="outlined" onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }}>
              <ClockIcon className="w-5 h-5 mr-1" />
              {showHistory ? "Ẩn lịch sử" : "Lịch sử chuyển năm"}
            </Button>
          </div>
        </div>

        <Table columns={columns} dataSource={tableData} loading={loading} />
      </Card>

      {/* ── Lịch sử chuyển năm + Rollback ── */}
      {showHistory && (
        <Card>
          <h2 className="text-xl font-bold mb-4">Lịch sử chuyển năm học</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Chưa có lịch sử chuyển năm nào.</p>
          ) : (
            <div className="space-y-4">
              {history.map((session: any) => (
                <div key={session.sessionId} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          {session.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.time).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {session.summary?.map((line: string, i: number) => (
                          <p key={i} className={`text-sm ${line.includes("sinh lên") || line.includes("lên ") ? "ml-4" : line.includes("tốt nghiệp") ? "ml-4 text-orange-600" : "font-medium text-gray-800"}`}>
                            {line.startsWith("-") ? "" : ""}{line}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Mã phiên: {session.sessionId}
                      </p>
                    </div>
                    <Button
                      variants="outlined"
                      onClick={() => handleRollback(session.sessionId)}
                      className="flex-shrink-0"
                    >
                      <ArrowUturnLeftIcon className="w-4 h-4 mr-1" />
                      Khôi phục
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Modals ── */}
      <AcademicYearFormModal
        open={formOpen}
        editId={editId}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
      <YearTransitionDialog
        open={transitionOpen}
        onClose={() => setTransitionOpen(false)}
        onSuccess={handleTransitionSuccess}
      />
    </div>
  );
};

export default AcademicYearList;
