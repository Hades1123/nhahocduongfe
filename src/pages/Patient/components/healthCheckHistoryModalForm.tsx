import { api } from "@/api/api";
import { reportApi } from "@/api/reportApi";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Divider from "@/components/Dividers";
import EditableTextarea from "@/components/EditableTextarea";
import ImageUploadBox from "@/components/ImageUploadBox";
import Odontogram from "@/pages/DentalRecord/components/Odontogram";
import TreatmentTable from "@/pages/DentalRecord/components/TreatmentTable";
import React, { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import UpdateHeathCheckHistory from "./updateHeathCheckHistory";
import CompareExamsView from "./CompareExamsView";
import Confirm from "@/components/ConfirmDialog";
import Swal from "sweetalert2";
import TeethOverall from "@/pages/DentalRecord/components/TeethOverall";
import PaginationTable from "@/components/PaginationTable";
import Input from "@/components/Input";
import Checkbox from "@/components/Checkbox";

interface Props {}

const heads = ["Phiếu khám", "Học sinh", "Ngày khám", "Nơi khám", "Thao tác"];

const mapping = (values: any) => {
  const plaqueRecord = {
    "17-16n": values.teethLeft1?.value || "0",
    "11n": values.teethLeft2?.value || "0",
    "26-27n": values.teethLeft3?.value || "0",
    "47-46t": values.teethLeft4?.value || "0",
    "31n": values.teethLeft5?.value || "0",
    "36-37t": values.teethLeft6?.value || "0",
  };

  const tartarRecord = {
    "17-16n": values.teethRight1?.value || "0",
    "11n": values.teethRight2?.value || "0",
    "26-27n": values.teethRight3?.value || "0",
    "47-46t": values.teethRight4?.value || "0",
    "31n": values.teethRight5?.value || "0",
    "36-37t": values.teethRight6?.value || "0",
  };

  return { plaqueRecord, tartarRecord };
};

const HealthCheckModal = (props: Props) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const examsRef = useRef<any>(null);
  const odontogramRef = useRef<any>(null);
  const treatmentTableRef = useRef<any>(null);
  const rowIndex = useRef<any>(null);
  const plaqueRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [examIdToDelete, setExamIdToDelete] = useState<any>(null);
  const [treatmentList, setTreatmentList] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [searchText, setSearchText] = useState<string>("");
  const [fromDate, setFromDate] = useState<any>();
  const [toDate, setToDate] = useState<any>();
  const [checked, setChecked] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // ── Compare Exams state ──
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompareExams, setSelectedCompareExams] = useState<any[]>([]);

  const handleToggleCompare = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCompareMode(e.target.checked);
    setSelectedCompareExams([]);
    setSelectedRecordId("");
  };

  const handleCompareSelection = (key: any, row: any) => {
    setSelectedCompareExams((prev) => {
      const isSelected = prev.some((item) => item.id === row.id);
      if (isSelected) {
        return prev.filter((item) => item.id !== row.id);
      } else {
        if (prev.length < 2) {
          return [...prev, row];
        }
        return prev;
      }
    });
  };

  // ── Sections 4, 5, 6 state ──
  const [examDetail, setExamDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { data: patient } = useQuery(
    `/api/patient/${id}`,
    () => api.get(`/api/patient/${id}`).then((response) => response.data),
    { retry: false, refetchOnWindowFocus: false },
  );

  const deleteHandle = (row: any) => {
    setExamIdToDelete(row.id);
    setOpen(true);
  };

  const [mappingSource] = useState<any[]>([
    "id",
    "patientName",
    "date",
    "organizationName",
    <div />,
  ]);

  const teethMutation = useMutation(() =>
    api.post(`/api/patients/${id}/exams/${rowIndex.current}/teethRecord`, {
      record: odontogramRef.current,
    }),
  );

  const plaqueMutation = useMutation(() =>
    api.post(
      `/api/patients/${id}/exams/${rowIndex.current}/plaqueRecord`,
      mapping(plaqueRef.current).plaqueRecord,
    ),
  );

  const tartarMutation = useMutation(() =>
    api.post(
      `/api/patients/${id}/exams/${rowIndex.current}/tartarRecord`,
      mapping(plaqueRef.current).tartarRecord,
    ),
  );

  const treatmentMutation = useMutation(() =>
    api.post(
      `/api/patients/${id}/exams/${rowIndex.current}/treatmentRecord`,
      treatmentList,
    ),
  );

  function padTo2Digits(num: number) {
    return num.toString().padStart(2, "0");
  }

  function formatDate(date: Date) {
    return [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-");
  }

  const updateExamMutation = useMutation((payload: any) =>
    api.put(`/api/patients/${id}/exams`, payload),
  );

  const deleteExamMutation = useMutation((examId: any) =>
    api.delete(`/api/exams/${examId}`),
  );

  const isSubmitting =
    updateExamMutation.isLoading ||
    teethMutation.isLoading ||
    plaqueMutation.isLoading ||
    tartarMutation.isLoading ||
    treatmentMutation.isLoading;

  const handleBack = () => {
    Swal.fire({
      html: "Bạn có muốn quay lại thông tin học sinh không?",
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: "Quay lại",
      cancelButtonText: "Hủy",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(`/patient/detail/${id}`);
      }
    });
  };

  const handleChange = () => {
    setChecked(!checked);
  };

  const handleRecordClicked = async (record: any) => {
    setChecked(record.useVecniFlour);
    rowIndex.current = record.id;
    setSelectedRecordId(record.id);

    // Fetch exam detail để lấy dữ liệu sections 4, 5, 6
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/patients/${id}/exams/${record.id}`);
      setExamDetail(res.data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết phiếu khám:", err);
      setExamDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefresh = () => {
    examsRef.current.refetch();
  };

  const [searchValues, setSearchValues] = useState<any>();

  const handleSearch = (e: any) => {
    examsRef.current.refetch();
    const queryParams = new URLSearchParams();
    if (fromDate) {
      queryParams.append("fromDate", fromDate);
    }
    if (toDate) {
      queryParams.append("toDate", toDate);
    }
    if (searchText) {
      queryParams.append("id", searchText);
    }
    setSearchValues(
      `/search?fromDate=${fromDate ? fromDate : ""}&toDate=${
        toDate ? toDate : ""
      }&id=${searchText}`,
    );
  };

  const handleSubmit = () => {
    Swal.fire({
      icon: "info",
      html: "Bạn muốn chỉnh sửa phiếu khám không?",
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: "Tiếp tục",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 1. Update main exam record
          const payload = {
            id: rowIndex.current,
            dentistId: 2,
            organizationId: patient.organization?.id
              ? patient.organization.id
              : 1,
            schoolClass: patient.schoolClass,
            date: formatDate(new Date()),
            year: new Date().getFullYear(),
            useVecniFlour: checked,
          };
          await updateExamMutation.mutateAsync(payload);

          // 2. Wait for all sub-records to complete before showing success
          await Promise.all([
            teethMutation.mutateAsync(),
            plaqueMutation.mutateAsync(),
            tartarMutation.mutateAsync(),
            treatmentMutation.mutateAsync(),
          ]);

          await Swal.fire({
            icon: "success",
            html: "Chỉnh sửa phiếu khám thành công!",
          });
          queryClient.invalidateQueries(`/api/patients/${id}/exams`);
          if (examsRef.current) {
            examsRef.current.refetch();
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            html: "Chỉnh sửa phiếu khám không thành công!",
          });
        }
      }
    });
  };

  // ── PATCH: Cập nhật đánh giá bệnh lý & ghi chú điều trị (mục 4 & 5) ──
  const handleSaveAssessment = async (
    field: "pathologyAssessment" | "treatmentNote",
    newValue: string,
  ) => {
    if (!selectedRecordId) return;
    const body: any = {};
    body[field] = newValue;
    await api.patch(`/api/exams/${selectedRecordId}/assessment`, body);
    // Refresh exam detail
    setExamDetail((prev: any) => ({ ...prev, [field]: newValue }));
    queryClient.invalidateQueries([
      `/api/patients/${id}/exams/${selectedRecordId}`,
    ]);
  };

  // ── PATCH: Cập nhật ảnh (mục 6) ──
  const handleImageUploaded = async (
    side: "upper" | "lower",
    publicUrl: string,
    uploadedAt: string,
  ) => {
    if (!selectedRecordId) return;
    const body: any = {};
    if (side === "upper") {
      body.imageUpperUrl = publicUrl;
      body.imageUpperTime = uploadedAt;
    } else {
      body.imageLowerUrl = publicUrl;
      body.imageLowerTime = uploadedAt;
    }
    await api.patch(`/api/exams/${selectedRecordId}/images`, body);
    // Refresh exam detail
    setExamDetail((prev: any) => ({
      ...prev,
      ...(side === "upper"
        ? { imageUpperUrl: publicUrl, imageUpperTime: uploadedAt }
        : { imageLowerUrl: publicUrl, imageLowerTime: uploadedAt }),
    }));
  };

  // ── DELETE: Xóa ảnh (mục 6) ──
  const handleImageDeleted = async (side: "upper" | "lower") => {
    if (!selectedRecordId) return;
    await api.delete(`/api/exams/${selectedRecordId}/images/${side}`);
    // Refresh exam detail
    setExamDetail((prev: any) => ({
      ...prev,
      ...(side === "upper"
        ? { imageUpperUrl: null, imageUpperTime: null }
        : { imageLowerUrl: null, imageLowerTime: null }),
    }));
  };

  return (
    <>
      <div className="flex flex-col gap-8 px-3 pb-2 pt-4 sm:px-6">
        <Card>
          <>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              {/* Date filters */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
                <Input
                  label="Từ ngày"
                  type="date"
                  onChange={(e: any) => setFromDate(e.target.value)}
                />
                <Input
                  label="Đến ngày"
                  type="date"
                  onChange={(e: any) => setToDate(e.target.value)}
                />
              </div>
              {/* Vertical divider (desktop only) */}
              <div className="hidden h-8 w-px self-end bg-gray-200 sm:mb-2 sm:block" />
              {/* Search */}
              <div className="flex flex-1 gap-3">
                <Input
                  className="flex-1"
                  placeholder="Nhập phiếu khám"
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button onClick={handleSearch}>Tìm kiếm</Button>
              </div>
            </div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isCompareMode}
                    onChange={handleToggleCompare}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-slate-100">
                    So sánh phiếu khám
                  </span>
                </label>
                {isCompareMode && (
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    (Đã chọn {selectedCompareExams.length}/2 phiếu)
                  </span>
                )}
              </div>
              <div className="flex content-end justify-end">
                {!isCompareMode && (
                  <UpdateHeathCheckHistory onSuccess={handleRefresh} />
                )}
              </div>
            </div>
            <PaginationTable
              ref={examsRef}
              url={`/api/patients/${id}/exams`}
              headRows={heads}
              dataPath="data"
              mappingSource={mappingSource}
              onRowSelected={isCompareMode ? undefined : handleRecordClicked}
              searchValues={searchValues}
              selectable={isCompareMode}
              selectedKeys={selectedCompareExams.map((r) => r.id)}
              onSelectChange={handleCompareSelection}
              maxSelect={2}
              renderAction={(row: any) =>
                isCompareMode ? null : (
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        reportApi.downloadExamReportPdf(row.patientId || id);
                      }}
                    >
                      Xuất PDF
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHandle(row);
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                )
              }
            />
          </>
        </Card>
        {isCompareMode ? (
          selectedCompareExams.length === 2 ? (
            <CompareExamsView
              patientId={id || ""}
              examIds={selectedCompareExams.map((e) => String(e.id))}
            />
          ) : (
            <div className="rounded-lg border dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-8 text-center text-gray-500 dark:text-slate-400">
              Vui lòng chọn đủ 2 phiếu khám để so sánh.
            </div>
          )
        ) : (
          <Card header="1. Tình trạng răng">
            {!selectedRecordId ? (
              <div className="pl-4 dark:text-slate-400">* Chọn phiếu khám để xem chi tiết.</div>
            ) : (
              <div className="flex flex-col gap-6">
                <Odontogram
                  selectedTreatment={selectedRecordId}
                  ref={odontogramRef}
                />
                <Divider />
                <h1 className="text-lg font-bold dark:text-slate-100">
                  2. Tình trạng vệ sinh răng miệng (OHI-S)
                </h1>
                <TeethOverall ref={plaqueRef} selectedExam={selectedRecordId} />
                <Divider />
                <h1 className="text-lg font-bold dark:text-slate-100">3. Điều trị</h1>
                <TreatmentTable
                  onChange={setTreatmentList}
                  selectedExam={selectedRecordId}
                  ref={treatmentTableRef}
                  odontogramRef={odontogramRef}
                />
                <Checkbox
                  name="veneerFlour"
                  label="Bôi Veneer Flour"
                  onChange={handleChange}
                  checked={checked}
                />

                {/* ── Section 4: Đánh giá mức độ bệnh lý ── */}
                <Divider />
                <h1 className="text-lg font-bold dark:text-slate-100">
                  4. Đánh giá mức độ bệnh lý
                </h1>
                <EditableTextarea
                  label="Nội dung đánh giá"
                  value={examDetail?.pathologyAssessment}
                  placeholder="Nhập đánh giá mức độ bệnh lý..."
                  loading={detailLoading}
                  onSave={(newValue) =>
                    handleSaveAssessment("pathologyAssessment", newValue)
                  }
                />

                {/* ── Section 5: Ghi chú điều trị ── */}
                <Divider />
                <h1 className="text-lg font-bold dark:text-slate-100">5. Ghi chú điều trị</h1>
                <EditableTextarea
                  label="Nội dung ghi chú"
                  value={examDetail?.treatmentNote}
                  placeholder="Nhập ghi chú điều trị..."
                  loading={detailLoading}
                  onSave={(newValue) =>
                    handleSaveAssessment("treatmentNote", newValue)
                  }
                />

                {/* ── Section 6: Ảnh thực tế hàm trên và hàm dưới ── */}
                <Divider />
                <h1 className="text-lg font-bold dark:text-slate-100">
                  6. Ảnh thực tế hàm trên và hàm dưới
                </h1>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <ImageUploadBox
                    label="Ảnh hàm trên"
                    folder="upper"
                    imageUrl={examDetail?.imageUpperUrl}
                    imageTime={examDetail?.imageUpperTime}
                    loading={detailLoading}
                    onUploaded={(url, time) =>
                      handleImageUploaded("upper", url, time)
                    }
                    onDeleted={() => handleImageDeleted("upper")}
                  />
                  <ImageUploadBox
                    label="Ảnh hàm dưới"
                    folder="lower"
                    imageUrl={examDetail?.imageLowerUrl}
                    imageTime={examDetail?.imageLowerTime}
                    loading={detailLoading}
                    onUploaded={(url, time) =>
                      handleImageUploaded("lower", url, time)
                    }
                    onDeleted={() => handleImageDeleted("lower")}
                  />
                </div>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-4">
              {selectedRecordId && (
                <Button
                  onClick={handleSubmit}
                  variants="contained"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Chỉnh sửa phiếu khám"}
                </Button>
              )}
            </div>
          </Card>
        )}
        <div className="flex justify-end gap-4">
          <Button onClick={handleBack} variants="outlined">
            Quay lại
          </Button>
        </div>
        <Confirm
          open={open}
          onClose={() => setOpen(false)}
          onAccept={async () => {
            setOpen(false);
            if (examIdToDelete) {
              try {
                await deleteExamMutation.mutateAsync(examIdToDelete);
                await Swal.fire({ icon: "success", title: "Xoá thành công" });
                queryClient.invalidateQueries(`/api/patients/${id}/exams`);
                if (examsRef.current) examsRef.current.refetch();
              } catch (error) {
                Swal.fire({ icon: "error", title: "Xoá không thành công" });
              }
            }
          }}
          title="Xác nhận xoá"
          content="Bạn chắc chắn muốn xoá bệnh án này, thao tác này không thể hoàn tác."
        />
      </div>
    </>
  );
};

export default HealthCheckModal;
