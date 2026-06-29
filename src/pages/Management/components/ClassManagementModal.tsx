import { api } from "@/api/api";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  TrashIcon,
  PlusIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

interface Props {
  organizationId: any;
  organizationName: string;
  onClose?: () => void;
}

interface ClassMap {
  [grade: string]: string[];
}

const ClassManagementModal = ({
  organizationId,
  organizationName,
  onClose,
}: Props) => {
  const [classes, setClasses] = useState<ClassMap>({});
  const [loading, setLoading] = useState(false);

  // Form thêm lớp mới
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [newGradeName, setNewGradeName] = useState<string>("");
  const [isNewGrade, setIsNewGrade] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>("");

  // Form thêm khối mới riêng biệt
  const [newGradeInput, setNewGradeInput] = useState<string>("");

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/organization/${organizationId}`);
      setClasses(res.data.classes || {});
    } catch {
      Swal.fire({ icon: "error", title: "Không thể tải danh sách lớp!" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Lưu toàn bộ classes về backend
  const saveClasses = async (updatedClasses: ClassMap): Promise<boolean> => {
    try {
      const res = await api.get(`/api/organization/${organizationId}`);
      const org = res.data;
      await api.put(`/api/organization/${organizationId}`, {
        name: org.name,
        address: org.address,
        areaCode: org.code,
        code: org.code,
        classes: updatedClasses,
      });
      return true;
    } catch {
      return false;
    }
  };

  // Thêm khối mới
  const handleAddGrade = async () => {
    const grade = newGradeInput.trim();
    if (!grade) {
      Swal.fire({ icon: "warning", title: "Vui lòng nhập tên khối!" });
      return;
    }
    if (classes[grade] !== undefined) {
      Swal.fire({ icon: "warning", title: `Khối "${grade}" đã tồn tại!` });
      return;
    }
    const updated: ClassMap = { ...classes, [grade]: [] };
    const ok = await saveClasses(updated);
    if (ok) {
      setClasses(updated);
      setNewGradeInput("");
      Swal.fire({
        icon: "success",
        title: `Thêm khối "${grade}" thành công!`,
        timer: 1200,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({ icon: "error", title: "Thêm khối không thành công!" });
    }
  };

  // Thêm lớp vào khối
  const handleAddClass = async () => {
    const grade = isNewGrade ? newGradeName.trim() : selectedGrade;
    const className = newClassName.trim();

    if (!grade) {
      Swal.fire({
        icon: "warning",
        title: "Vui lòng chọn hoặc nhập tên khối!",
      });
      return;
    }
    if (!className) {
      Swal.fire({ icon: "warning", title: "Vui lòng nhập tên lớp!" });
      return;
    }

    const currentList: string[] = classes[grade] || [];
    if (currentList.includes(className)) {
      Swal.fire({
        icon: "warning",
        title: `Lớp "${className}" đã tồn tại trong khối "${grade}"!`,
      });
      return;
    }

    const updated: ClassMap = {
      ...classes,
      [grade]: [...currentList, className],
    };
    const ok = await saveClasses(updated);
    if (ok) {
      setClasses(updated);
      setNewClassName("");
      if (isNewGrade) {
        setNewGradeName("");
        setIsNewGrade(false);
        setSelectedGrade(grade);
      }
      Swal.fire({
        icon: "success",
        title: `Thêm lớp "${className}" thành công!`,
        timer: 1200,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({ icon: "error", title: "Thêm lớp không thành công!" });
    }
  };

  // Xóa một lớp
  const handleDeleteClass = (grade: string, className: string) => {
    Swal.fire({
      html: `Bạn có muốn xóa lớp <b>${className}</b> khỏi khối <b>${grade}</b> không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await api.post(
          `/api/organization/${organizationId}/classes/deletable`,
          [className],
        );
        if (res.data.errorCount > 0) {
          Swal.fire({
            icon: "error",
            html: `Không thể xóa lớp <b>${className}</b> vì lớp đang có học sinh!`,
          });
        } else {
          const newList = classes[grade].filter((c) => c !== className);
          const updated: ClassMap = { ...classes, [grade]: newList };
          const ok = await saveClasses(updated);
          if (ok) {
            setClasses(updated);
            Swal.fire({
              icon: "success",
              title: "Xóa lớp thành công!",
              timer: 1200,
              showConfirmButton: false,
            });
          }
        }
      } catch {
        Swal.fire({ icon: "error", title: "Xóa lớp không thành công!" });
      }
    });
  };

  // Xóa toàn bộ lớp trong một khối
  const handleDeleteGrade = (grade: string) => {
    const classList = classes[grade] || [];
    Swal.fire({
      html: `Bạn có muốn xóa toàn bộ lớp trong khối <b>${grade}</b> không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa tất cả",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      if (classList.length === 0) {
        // Khối rỗng, chỉ xóa key
        const updated = { ...classes };
        delete updated[grade];
        const ok = await saveClasses(updated);
        if (ok) {
          setClasses(updated);
          Swal.fire({
            icon: "success",
            title: `Đã xóa khối "${grade}"!`,
            timer: 1200,
            showConfirmButton: false,
          });
        }
        return;
      }
      try {
        const res = await api.post(
          `/api/organization/${organizationId}/classes/deletable`,
          classList,
        );
        const { errorCount, successCount, errorList } = res.data;
        if (errorCount > 0 && successCount === 0) {
          Swal.fire({
            icon: "error",
            html: "Không thể xóa: tất cả các lớp đang có học sinh!",
          });
        } else {
          const remainingClasses = (errorList || []).map((e: any) => e.content);
          const updated: ClassMap = { ...classes };
          if (remainingClasses.length === 0) {
            delete updated[grade];
          } else {
            updated[grade] = remainingClasses;
          }
          const ok = await saveClasses(updated);
          if (ok) {
            setClasses(updated);
            if (errorCount > 0) {
              Swal.fire({
                icon: "warning",
                html: `Xóa thành công <b>${successCount}</b> lớp. Không thể xóa <b>${errorCount}</b> lớp đang có học sinh.`,
              });
            } else {
              Swal.fire({
                icon: "success",
                title: "Xóa tất cả lớp thành công!",
                timer: 1200,
                showConfirmButton: false,
              });
            }
          }
        }
      } catch {
        Swal.fire({ icon: "error", title: "Xóa khối không thành công!" });
      }
    });
  };

  const gradeKeys = Object.keys(classes);

  // Flatten dữ liệu để hiển thị bảng
  const tableRows: {
    grade: string;
    className: string;
    rowSpan?: number;
    isFirst?: boolean;
  }[] = [];
  gradeKeys.forEach((grade) => {
    const list = classes[grade];
    if (list.length === 0) {
      tableRows.push({ grade, className: "", rowSpan: 1, isFirst: true });
    } else {
      list.forEach((cls, idx) => {
        tableRows.push({
          grade,
          className: cls,
          rowSpan: idx === 0 ? list.length : undefined,
          isFirst: idx === 0,
        });
      });
    }
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header thông tin trường */}
      <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
        <AcademicCapIcon className="h-6 w-6 shrink-0 text-indigo-600" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-400">
            Trường đang quản lý
          </p>
          <p className="text-base font-semibold text-indigo-800">
            {organizationName}
          </p>
        </div>
      </div>

      {/* ═══ Form thêm lớp mới ═══ */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 rounded-t-lg border-b border-gray-100 bg-gray-50 px-4 py-3">
          <PlusIcon className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-700">
            Thêm lớp học mới
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3 px-4 py-4">
          {/* Chọn khối */}
          <div className="flex min-w-[160px] flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Khối</label>
            {!isNewGrade ? (
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={selectedGrade}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setIsNewGrade(true);
                    setSelectedGrade("");
                  } else {
                    setSelectedGrade(e.target.value);
                  }
                }}
              >
                <option value="">-- Chọn khối --</option>
                {gradeKeys.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="__new__">+ Thêm khối mới...</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  className="block h-full w-full rounded-md border-0 px-4 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Nhập tên khối mới..."
                  value={newGradeName}
                  onChange={(e) => setNewGradeName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsNewGrade(false);
                    setNewGradeName("");
                  }}
                  className="whitespace-nowrap text-xs text-gray-400 hover:text-gray-600"
                >
                  Huỷ
                </button>
              </div>
            )}
          </div>

          {/* Tên lớp */}
          <div className="flex min-w-[160px] flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Tên lớp</label>
            <input
              className="block h-full w-full rounded-md border-0 px-4 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="VD: 1A, 2B..."
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddClass();
              }}
            />
          </div>

          <Button onClick={handleAddClass} className="h-fit">
            <PlusIcon className="mr-1 inline h-4 w-4" />
            Thêm lớp
          </Button>
        </div>
      </div>

      {/* ═══ Form thêm khối mới ═══ */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 rounded-t-lg border-b border-gray-100 bg-gray-50 px-4 py-3">
          <PlusIcon className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-700">
            Thêm khối học mới
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3 px-4 py-4">
          <div className="flex min-w-[200px] flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Tên khối
            </label>
            <input
              className="block h-full w-full rounded-md border-0 px-4 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="VD: Khối 1, Khối 2..."
              value={newGradeInput}
              onChange={(e) => setNewGradeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddGrade();
              }}
            />
          </div>
          <Button onClick={handleAddGrade} className="h-fit">
            <PlusIcon className="mr-1 inline h-4 w-4" />
            Thêm khối
          </Button>
        </div>
      </div>

      {/* ═══ Bảng danh sách lớp – Desktop ═══ */}
      <div className="hidden lg:block">
        <TableContainer component={Paper} className="rounded-lg shadow-sm">
          <Table aria-label="class management table">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#eef2ff" }}>
                <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>
                  STT
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 160 }}>
                  Khối
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Danh sách lớp
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 180 }}>
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{ py: 4, color: "#6b7280" }}
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : gradeKeys.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{ py: 4, color: "#6b7280" }}
                  >
                    Chưa có khối/lớp nào. Hãy thêm mới!
                  </TableCell>
                </TableRow>
              ) : (
                gradeKeys.map((grade, gradeIdx) => {
                  const list = classes[grade];
                  if (list.length === 0) {
                    return (
                      <TableRow key={grade} hover>
                        <TableCell align="center">{gradeIdx + 1}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          {grade}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: "#9ca3af", fontStyle: "italic" }}
                        >
                          Chưa có lớp nào
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`Xóa khối ${grade}`}>
                            <button
                              onClick={() => handleDeleteGrade(grade)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Xóa khối
                            </button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return list.map((cls, clsIdx) => (
                    <TableRow key={`${grade}-${cls}`} hover>
                      {clsIdx === 0 && (
                        <>
                          <TableCell
                            align="center"
                            rowSpan={list.length}
                            sx={{
                              borderRight: "1px solid #e5e7eb",
                              fontWeight: 500,
                            }}
                          >
                            {gradeIdx + 1}
                          </TableCell>
                          <TableCell
                            align="center"
                            rowSpan={list.length}
                            sx={{
                              borderRight: "1px solid #e5e7eb",
                              fontWeight: 600,
                              backgroundColor: "#f9fafb",
                            }}
                          >
                            {grade}
                          </TableCell>
                        </>
                      )}
                      <TableCell align="center">
                        <Chip
                          label={cls}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip title={`Xóa lớp ${cls}`}>
                            <button
                              onClick={() => handleDeleteClass(grade, cls)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Xóa lớp
                            </button>
                          </Tooltip>
                          {clsIdx === 0 && (
                            <Tooltip
                              title={`Xóa toàn bộ lớp trong khối ${grade}`}
                            >
                              <button
                                onClick={() => handleDeleteGrade(grade)}
                                className="inline-flex items-center gap-1 rounded-md border border-orange-200 px-2 py-1 text-xs text-orange-600 transition-colors hover:bg-orange-50"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Xóa khối
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ));
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* ═══ Mobile/Tablet Cards (<1024px) ═══ */}
      <div className="flex flex-col gap-3 lg:hidden">
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">Đang tải...</p>
        ) : gradeKeys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-sm text-gray-500">
            Chưa có khối/lớp nào. Hãy thêm mới!
          </div>
        ) : (
          gradeKeys.map((grade, gradeIdx) => {
            const list = classes[grade];
            return (
              <div
                key={grade}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                      {gradeIdx + 1}
                    </span>
                    <span className="text-sm font-semibold text-indigo-800">
                      Khối {grade}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGrade(grade)}
                    className="inline-flex items-center gap-1 rounded-md border border-orange-200 px-2 py-1 text-xs text-orange-600 transition-colors hover:bg-orange-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Xóa khối
                  </button>
                </div>
                {/* Card Body */}
                <div className="px-4 py-3">
                  {list.length === 0 ? (
                    <p className="text-xs italic text-gray-400">
                      Chưa có lớp nào trong khối này.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {list.map((cls) => (
                        <div
                          key={cls}
                          className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-sm"
                        >
                          <span className="font-medium text-gray-700">
                            {cls}
                          </span>
                          <button
                            onClick={() => handleDeleteClass(grade, cls)}
                            className="ml-1 text-red-400 transition-colors hover:text-red-600"
                            title={`Xóa lớp ${cls}`}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClassManagementModal;
