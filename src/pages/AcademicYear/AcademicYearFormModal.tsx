import React, { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { AcademicYear, academicYearApi } from "@/api/academicYearApi";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  editId: number | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

interface StatusOption {
  value: "UPCOMING" | "CURRENT" | "COMPLETED" | string;
  label: string;
}
const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Chưa bắt đầu",
  CURRENT: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
}
const AcademicYearFormModal = ({ open, editId, onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<StatusOption>({ value: "UPCOMING", label: STATUS_LABELS["UPCOMING"] });
  const [saving, setSaving] = useState(false);

  const isEdit = editId != null;

  useEffect(() => {
    if (open && editId) {
      academicYearApi.getById(editId).then(y => {
        setName(y.name);
        setStartDate(y.startDate || "");
        setEndDate(y.endDate || "");
        setStatus({ value: y.status, label: STATUS_LABELS[y.status] });
      }).catch(() => {});
    } else if (open) {
      setName("");
      setStartDate("");
      setEndDate("");
      setStatus({ value: "UPCOMING", label: STATUS_LABELS["UPCOMING"] });
    }
  }, [open, editId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Swal.fire("Lỗi", "Vui lòng nhập tên năm học", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = { name, startDate: startDate || null, endDate: endDate || null, status: status.value } as any;
      if (isEdit) {
        await academicYearApi.update(editId, payload);
      } else {
        await academicYearApi.create(payload);
      }
      Swal.fire("Thành công!", "", "success");
      onSuccess();
    } catch (e: any) {
      Swal.fire("Lỗi!", e?.response?.data?.message || "Không thể lưu", "error");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: "UPCOMING", label: "Chưa bắt đầu" },
    { value: "CURRENT", label: "Đang diễn ra" },
    { value: "COMPLETED", label: "Đã kết thúc" },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title={isEdit ? "Sửa năm học" : "Thêm năm học"}>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tên năm học *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: 2026-2027" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <Select value={status} onChange={e => setStatus(e)} options={statusOptions} />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variants="outlined" onClick={onClose}>Hủy</Button>
          <Button variants="contained" onClick={handleSave} isDisabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AcademicYearFormModal;
