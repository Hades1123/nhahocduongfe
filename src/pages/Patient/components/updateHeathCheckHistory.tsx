import React, { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "react-query";
import { useLocation } from "react-router-dom";
import { api } from "@/api/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Divider from "@/components/Dividers";
import Modal from "@/components/Modal";
import Odontogram from "@/pages/DentalRecord/components/Odontogram";
import TeethOverall from "@/pages/DentalRecord/components/TeethOverall";
import TreatmentTable from "@/pages/DentalRecord/components/TreatmentTable";
import Swal from "sweetalert2";
import Checkbox from "@/components/Checkbox";
import ImageUploadBox from "@/components/ImageUploadBox";

interface Props {
  isShow: boolean;
  onClose: () => void;
  onSuccess: () => {};
}

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
const UpdateHealthCheckModal = React.forwardRef<any, Props>(
  ({ isShow, onClose, onSuccess }, ref) => {
    const url = useLocation().pathname.split("/");

    const odontogramRef = useRef<any>(null);
    const treatmentRef = useRef(null);
    const plaqueRef = useRef(null);

    const [treatmentList, setTreatmentList] = useState([]);
    const [checked, setChecked] = useState<boolean>(false);
    const [odontogramData, setOdontoGramData] = useState<any>();

    // ── Section 4, 5, 6 state ──
    const [pathologyAssessment, setPathologyAssessment] = useState<string>("");
    const [treatmentNote, setTreatmentNote] = useState<string>("");
    const [imageUpperUrl, setImageUpperUrl] = useState<string | null>(null);
    const [imageUpperTime, setImageUpperTime] = useState<string | null>(null);
    const [imageLowerUrl, setImageLowerUrl] = useState<string | null>(null);
    const [imageLowerTime, setImageLowerTime] = useState<string | null>(null);

    const idExam = useRef();

    const teethMutation = useMutation((examId: any) =>
      api.post(`/api/patients/${url[url.length - 2]}/exams/${examId}/teethRecord`, {
        record: odontogramRef.current,
      })
    );

    const plaqueMutation = useMutation((examId: any) =>
      api.post(
        `/api/patients/${url[url.length - 2]}/exams/${examId}/plaqueRecord`,
        mapping(plaqueRef.current).plaqueRecord,
      )
    );

    const tartarMutation = useMutation((examId: any) =>
      api.post(
        `/api/patients/${url[url.length - 2]}/exams/${examId}/tartarRecord`,
        mapping(plaqueRef.current).tartarRecord,
      )
    );

    const treatmentMutation = useMutation((examId: any) =>
      api.post(
        `/api/patients/${url[url.length - 2]}/exams/${examId}/treatmentRecord`,
        treatmentList,
      )
    );

    const createExamMutation = useMutation((payload: any) =>
      api.post(`/api/patients/${url[url.length - 2]}/exams`, payload)
    );

    const isSubmitting =
      createExamMutation.isLoading ||
      teethMutation.isLoading ||
      plaqueMutation.isLoading ||
      tartarMutation.isLoading ||
      treatmentMutation.isLoading;

    const { data: patient } = useQuery(
      `/api/patient/${url[url.length - 2]}`,
      () =>
        api
          .get(`/api/patient/${url[url.length - 2]}`)
          .then((response) => response.data),
      { retry: false, refetchOnWindowFocus: false },
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

    const handleSubmit = () => {
      Swal.fire({
        icon: "info",
        html: `Bạn có muốn thêm phiếu điều trị không?`,
        showCancelButton: true,
        focusConfirm: false,
        confirmButtonText: "Tiếp tục",
        cancelButtonText: "Huỷ",
        reverseButtons: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const payload = {
              dentistId: 2,
              organizationId: patient?.organization?.id ? patient.organization.id : 1,
              schoolClass: patient?.schoolClass,
              date: formatDate(new Date()),
              year: new Date().getFullYear(),
              useVecniFlour: checked,
            };

            const response = await createExamMutation.mutateAsync(payload);
            const newExamId = response.data.id;
            idExam.current = newExamId;

            await Promise.all([
              teethMutation.mutateAsync(newExamId),
              plaqueMutation.mutateAsync(newExamId),
              tartarMutation.mutateAsync(newExamId),
              treatmentMutation.mutateAsync(newExamId),
            ]);

            // ── PATCH: Sections 4 & 5 ──
            if (pathologyAssessment || treatmentNote) {
              await api.patch(`/api/exams/${newExamId}/assessment`, {
                pathologyAssessment: pathologyAssessment || null,
                treatmentNote: treatmentNote || null,
              });
            }

            // ── PATCH: Section 6 ──
            if (imageUpperUrl || imageLowerUrl) {
              await api.patch(`/api/exams/${newExamId}/images`, {
                imageUpperUrl: imageUpperUrl || null,
                imageUpperTime: imageUpperTime || null,
                imageLowerUrl: imageLowerUrl || null,
                imageLowerTime: imageLowerTime || null,
              });
            }

            await Swal.fire({
              icon: "success",
              html: "Tạo phiếu khám thành công!",
            });
            onSuccess && onSuccess();
            onClose();
          } catch (error) {
            Swal.fire({
              icon: "error",
              html: "Tạo phiếu khám không thành công!",
            });
          }
        }
      });
    };

    const handleChange = () => {
      setChecked(!checked);
    };

    return (
      <>
        <Modal isOpen={isShow} onClose={onClose} title="Tạo mới phiếu khám">
          <div className="flex  flex-col ">
            <Card header="1. Tình trạng răng">
              <div className="flex flex-col gap-6">
                <Odontogram ref={odontogramRef} onChange={setOdontoGramData} />
                <Divider />
                <h1 className="text-lg font-bold">
                  2. Tình trạng vệ sinh răng miệng (OHI-S)
                </h1>
                <TeethOverall ref={plaqueRef} />
                <Divider />
                <h1 className="text-lg font-bold">3. Phiếu điều trị</h1>
                <TreatmentTable
                  ref={treatmentRef}
                  onChange={setTreatmentList}
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
                <h1 className="text-lg font-bold">
                  4. Đánh giá mức độ bệnh lý
                </h1>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nội dung đánh giá
                  </label>
                  <textarea
                    value={pathologyAssessment}
                    onChange={(e) => setPathologyAssessment(e.target.value)}
                    placeholder="Nhập đánh giá mức độ bệnh lý..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                {/* ── Section 5: Ghi chú điều trị ── */}
                <Divider />
                <h1 className="text-lg font-bold">5. Ghi chú điều trị</h1>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nội dung ghi chú
                  </label>
                  <textarea
                    value={treatmentNote}
                    onChange={(e) => setTreatmentNote(e.target.value)}
                    placeholder="Nhập ghi chú điều trị..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                {/* ── Section 6: Ảnh thực tế hàm trên và hàm dưới ── */}
                <Divider />
                <h1 className="text-lg font-bold">
                  6. Ảnh thực tế hàm trên và hàm dưới
                </h1>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <ImageUploadBox
                    label="Ảnh hàm trên"
                    folder="upper"
                    imageUrl={imageUpperUrl}
                    imageTime={imageUpperTime}
                    onUploaded={async (publicUrl, uploadedAt) => {
                      setImageUpperUrl(publicUrl);
                      setImageUpperTime(uploadedAt);
                    }}
                    onDeleted={async () => {
                      setImageUpperUrl(null);
                      setImageUpperTime(null);
                    }}
                  />
                  <ImageUploadBox
                    label="Ảnh hàm dưới"
                    folder="lower"
                    imageUrl={imageLowerUrl}
                    imageTime={imageLowerTime}
                    onUploaded={async (publicUrl, uploadedAt) => {
                      setImageLowerUrl(publicUrl);
                      setImageLowerTime(uploadedAt);
                    }}
                    onDeleted={async () => {
                      setImageLowerUrl(null);
                      setImageLowerTime(null);
                    }}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={onClose}
                    className="mr-2"
                    variants="outlined"
                  >
                    Huỷ
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Lưu"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Modal>
      </>
    );
  },
);

const UpdateHealthCheckButton = ({ onSuccess }: any) => {
  const [show, setShow] = useState(false);

  function downloadFile(blob: any, fileName: any) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleExportExams = () => {
    let fileName = "Exams.xlsx";

    api
      .get("/api/exams/excel/raw", {
        responseType: "blob",
      })
      .then((response) => {
        downloadFile(response.data, fileName);
      });
  };

  return (
    <>
      {show && (
        <UpdateHealthCheckModal
          isShow={show}
          onClose={() => setShow(false)}
          onSuccess={onSuccess}
        />
      )}
      <div className="flex gap-3">
        <Button onClick={handleExportExams}>Xuất phiếu khám</Button>
        <Button onClick={() => setShow(true)}>Tạo mới</Button>
      </div>
    </>
  );
};

export default UpdateHealthCheckButton;
