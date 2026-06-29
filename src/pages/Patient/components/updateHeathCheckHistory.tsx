import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "react-query";
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
const UpdateHealthCheckModal = React.forwardRef<any, any>(
  ({ isShow, onClose, onSuccess }: Props, ref) => {
    const url = useLocation().pathname.split("/");

    const odontogramRef = useRef<any>(null);
    const treatmentRef = useRef(null);
    const plaqueRef = useRef(null);

    const [triggerSumitOdo, setTriggerSumitOdo] = useState<boolean>(false);
    const [triggerExam, setTriggerSumitExam] = useState<boolean>(false);
    const [triggerTreatment, setTriggerTreatment] = useState<boolean>(false);
    const [treatmentList, setTreatmentList] = useState([]);
    const [checked, setChecked] = useState<boolean>(false);
    const [odontogramData, setOdontoGramData] = useState<any>();

    const idExam = useRef();

    const { data: teethRecordData } = useQuery(
      `createTeethRecord`,
      () =>
        api
          .post(
            `/api/patients/${url[url.length - 2]}/exams/${
              idExam.current
            }/teethRecord`,
            {
              record: odontogramRef.current,
            },
          )
          .then((response) => response.data.record),
      { enabled: triggerSumitOdo, retry: false, refetchOnWindowFocus: false },
    );

    const { data: patient } = useQuery(
      `/api/patient/${url[url.length - 2]}`,
      () =>
        api
          .get(`/api/patient/${url[url.length - 2]}`)
          .then((response) => response.data),
      { retry: false, refetchOnWindowFocus: false },
    );

    useQuery(
      `/api/patients/${url[url.length - 2]}/exams/${
        idExam.current
      }/plaqueRecord`,
      () =>
        api.post(
          `/api/patients/${url[url.length - 2]}/exams/${
            idExam.current
          }/plaqueRecord`,
          mapping(plaqueRef.current).plaqueRecord,
        ),
      {
        enabled: triggerSumitOdo,
        refetchOnWindowFocus: false,
      },
    );

    useQuery(
      `/api/patients/${url[url.length - 2]}/exams/${
        idExam.current
      }/tartarRecord`,
      () =>
        api.post(
          `/api/patients/${url[url.length - 2]}/exams/${
            idExam.current
          }/tartarRecord`,
          mapping(plaqueRef.current).tartarRecord,
        ),
      {
        enabled: triggerSumitOdo,
        refetchOnWindowFocus: false,
      },
    );

    useQuery(
      "treatmentRecord",
      () =>
        api.post(
          `/api/patients/${url[url.length - 2]}/exams/${
            idExam.current
          }/treatmentRecord`,
          treatmentList,
        ),
      {
        enabled: triggerTreatment,
        refetchOnWindowFocus: false,
      },
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

    const { isLoading: createExamLoading } = useQuery(
      `createExam`,
      () =>
        api
          .post(`/api/patients/${url[url.length - 2]}/exams`, {
            dentistId: 2,
            organizationId: patient.organization?.id
              ? patient.organization?.id
              : 1,
            schoolClass: patient.schoolClass,
            date: formatDate(new Date()),
            year: new Date().getFullYear(),
            useVecniFlour: checked,
          })
          .then(async (response) => {
            idExam.current = response.data.id;
            await setTriggerSumitOdo(true);
            await setTriggerTreatment(true);
            Swal.fire({
              icon: "success",
              html: "Tạo phiếu khám thành công!",
            });
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              html: "Tạo phiếu khám không thành công!",
            });
          }),
      { enabled: triggerExam, refetchOnWindowFocus: false, retry: false },
    );

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
          await setTriggerSumitExam(true);
        }
      });
    };

    const handleChange = () => {
      setChecked(!checked);
    };

    !createExamLoading && teethRecordData && idExam.current && onClose();

    !createExamLoading &&
      teethRecordData &&
      idExam.current &&
      idExam.current &&
      onSuccess &&
      onSuccess();

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
                  // onChange={formik.handleChange}
                  onChange={handleChange}
                  checked={checked}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={onClose}
                    className="mr-2"
                    variants="outlined"
                  >
                    Huỷ
                  </Button>
                  <Button onClick={handleSubmit}>Lưu</Button>
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
