import React, { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { AcademicYear, academicYearApi, TransitionResult } from "@/api/academicYearApi";
import Swal from "sweetalert2";
import { ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const YearTransitionDialog = ({ open, onClose, onSuccess }: Props) => {
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [newYearName, setNewYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<TransitionResult | null>(null);

  useEffect(() => {
    if (open) {
      academicYearApi.getCurrentYear()
        .then(y => {
          setCurrentYear(y);
          const parts = y.name.split("-");
          if (parts.length === 2) {
            const nextStart = parseInt(parts[1]);
            setNewYearName(parts[1] + "-" + (nextStart + 1));
          }
        })
        .catch(() => {});
      setResult(null);
      setWarnings([]);
    }
  }, [open]);

  const handleValidate = async () => {
    if (!currentYear) return;
    setValidating(true);
    try {
      const w = await academicYearApi.validate(currentYear.id);
      setWarnings(w);
      if (w.length === 0) {
        Swal.fire("OK!", "Không có vấn đề gì. Sẵn sàng chuyển năm.", "success");
      }
    } catch (e: any) {
      Swal.fire("Lỗi!", e?.response?.data?.message || "", "error");
    } finally {
      setValidating(false);
    }
  };

  const handleTransition = async () => {
    if (!newYearName.trim()) {
      Swal.fire("Lỗi", "Vui lòng nhập tên năm học mới", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Xác nhận chuyển năm học?",
      html: `
        <p>Năm cũ <b>${currentYear?.name}</b> → Đã kết thúc</p>
        <p>Năm mới <b>${newYearName}</b> → Đang diễn ra</p>
        <p class="text-red-500 mt-2">Hành động này sẽ tự động lên lớp cho tất cả học sinh.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Chuyển năm",
      cancelButtonText: "Hủy",
    });

    if (!confirm.isConfirmed) return;

    setProcessing(true);
    try {
      const res = await academicYearApi.transition({
        newYearName,
        startDate: startDate || null as any,
        endDate: endDate || null as any,
      });
      setResult(res);
      if (res.success) {
        Swal.fire("Thành công!", res.message, "success");
        onSuccess();
      } else {
        Swal.fire("Thất bại!", res.message, "error");
      }
    } catch (e: any) {
      Swal.fire("Lỗi!", e?.response?.data?.message || "Chuyển năm thất bại, dữ liệu đã được rollback.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Chuyển đổi năm học mới">
      <div className="flex flex-col gap-4 p-2 sm:p-4 w-full sm:min-w-[480px] sm:max-w-[560px]">
        {/* Current year info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Năm học hiện tại</p>
          <p className="text-lg font-bold">{currentYear?.name || "Đang tải..."}</p>
          <p className="text-xs text-gray-500">
            {currentYear?.startDate} → {currentYear?.endDate}
          </p>
        </div>

        {/* New year inputs */}
        <div>
          <label className="block text-sm font-medium mb-1">Tên năm học mới *</label>
          <Input value={newYearName} onChange={e => setNewYearName(e.target.value)} placeholder="VD: 2026-2027" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              Cảnh báo ({warnings.length})
            </div>
            <ul className="list-disc list-inside text-sm text-yellow-600">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`p-3 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center gap-2 font-medium">
              {result.success ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              )}
              {result.message}
            </div>
            {result.success && (
              <div className="mt-2 text-sm text-gray-600">
                <p>🔹 {result.promotedCount} học sinh được lên lớp</p>
                <p>🎓 {result.graduatedCount} học sinh tốt nghiệp</p>
                <p className="mt-1 text-xs text-gray-400">
                  Session ID: <code className="bg-gray-100 px-1 rounded">{result.sessionId}</code>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  💡 Có thể khôi phục bằng nút "Khôi phục" trong Lịch sử chuyển năm
                </p>
                {result.warnings.length > 0 && (
                  <p className="text-yellow-600">⚠️ {result.warnings.length} cảnh báo</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
          <Button variants="outlined" onClick={handleValidate} isDisabled={validating}>
            {validating ? "Đang kiểm tra..." : "🔍 Kiểm tra trước"}
          </Button>
          <div className="flex gap-2 justify-end">
            <Button variants="outlined" onClick={onClose}>Đóng</Button>
            <Button variants="contained" onClick={handleTransition} isDisabled={processing}>
              {processing ? "Đang xử lý..." : "🚀 Chuyển năm học"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default YearTransitionDialog;
