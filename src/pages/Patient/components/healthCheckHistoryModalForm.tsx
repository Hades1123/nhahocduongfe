import { api } from "@/api/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Divider from "@/components/Dividers";
import Odontogram from "@/pages/DentalRecord/components/Odontogram";
import TreatmentTable from "@/pages/DentalRecord/components/TreatmentTable";
import React, { useRef, useState } from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import UpdateHeathCheckHistory from "./updateHeathCheckHistory";
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
  const [triggerSubmit, triggerDelete] = useState(false);
  const [triggerUpdate, setTriggerUpdate] = useState(false);
  const [triggerSumitOdo, setTriggerSumitOdo] = useState(false);
  const plaqueRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [treatmentList, setTreatmentList] = useState([]);
  const [triggerTreatment, setTriggerTreatment] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [searchText, setSearchText] = useState<string>("");
  const [fromDate, setFromDate] = useState<any>();
  const [toDate, setToDate] = useState<any>();
  const [checked, setChecked] = useState<boolean>(false);

  const { data: patient } = useQuery(
    `/api/patient/${id}`,
    () => api.get(`/api/patient/${id}`).then((response) => response.data),
    { retry: false, refetchOnWindowFocus: false },
  );

  const deleteHandle = (e: any) => {
    // e.stopPropagation();
    setTimeout(() => {
      setOpen(true);
    });
  };

  const [mappingSource, setMappingSource] = useState<any[]>([
    "id",
    "patientName",
    "date",
    "organizationName",

    <Button onClick={(e) => deleteHandle(e)}>Xóa</Button>,
  ]);

  const {} = useQuery(
    `updateTeethRecord`,
    () =>
      api
        .post(`/api/patients/${id}/exams/${rowIndex.current}/teethRecord`, {
          record: odontogramRef.current,
        })
        .then((response) => response.data.record),
    { enabled: triggerSumitOdo, retry: false, refetchOnWindowFocus: false },
  );

  useQuery(
    `/api/patients/${id}/exams/${rowIndex.current}/plaqueRecord`,
    () =>
      api.post(
        `/api/patients/${id}/exams/${rowIndex.current}/plaqueRecord`,
        mapping(plaqueRef.current).plaqueRecord,
      ),
    {
      enabled: triggerSumitOdo,
      refetchOnWindowFocus: false,
    },
  );

  useQuery(
    `/api/patients/${id}/exams/${rowIndex.current}/tartarRecord`,
    () =>
      api.post(
        `/api/patients/${id}/exams/${rowIndex.current}/tartarRecord`,
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
        `/api/patients/${id}/exams/${rowIndex.current}/treatmentRecord`,
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

  const {} = useQuery(
    ["updateRecord"],
    () =>
      api
        .put(`/api/patients/${id}/exams`, {
          id: rowIndex.current,
          dentistId: 2,
          organizationId: patient.organization?.id
            ? patient.organization.id
            : 1,
          schoolClass: patient.schoolClass,
          date: formatDate(new Date()),
          year: new Date().getFullYear(),
          useVecniFlour: checked,
        })
        .then(async () => {
          await setTriggerSumitOdo(true);
          await setTriggerTreatment(true);
          await Swal.fire({
            icon: "success",
            html: "Chỉnh sửa phiếu khám thành công!",
          });
          navigate(0);
        })
        .catch(() =>
          Swal.fire({
            icon: "error",
            html: "Chỉnh sửa phiếu khám không thành công!",
          }),
        ),
    {
      enabled: triggerUpdate,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  useQuery(
    ["deleteRecord", rowIndex.current],
    () =>
      api
        .delete(`/api/exams/${rowIndex.current}`)
        .then(async () => {
          await Swal.fire({
            icon: "success",
            title: "Xoá thành công",
          });
          navigate(0);
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Xoá không thành công",
          });
        })
        .finally(() => triggerDelete(false)),
    {
      enabled: triggerSubmit,
      refetchOnWindowFocus: false,
    },
  );

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

  const handleRecordClicked = (record: any) => {
    setChecked(record.useVecniFlour);
    rowIndex.current = record.id;
    setSelectedRecordId(record.id);
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
        await setTriggerUpdate(true);
      }
    });
  };

  return (
    <>
      <div className="flex  flex-col gap-8  p-4 pb-2">
        <Card>
          <>
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-10 gap-2">
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
              <div className="grid grid-cols-2">
                <div className="flex gap-3">
                  <Input
                    placeholder="Nhập phiếu khám"
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <Button onClick={handleSearch}>Tìm kiếm</Button>
                </div>
                <div className="flex justify-end"></div>
              </div>
            </div>
            <div className="mb-2 flex content-end justify-end">
              <UpdateHeathCheckHistory onSuccess={handleRefresh} />
            </div>
            <PaginationTable
              ref={examsRef}
              url={`/api/patients/${id}/exams`}
              headRows={heads}
              dataPath="data"
              mappingSource={mappingSource}
              onRowSelected={handleRecordClicked}
              searchValues={searchValues}
            />
          </>
        </Card>
        <Card header="1. Tình trạng răng">
          {!selectedRecordId ? (
            <div className="pl-4">* Chọn phiếu khám để xem chi tiết.</div>
          ) : (
            <div className="flex flex-col gap-6">
              <Odontogram
                selectedTreatment={selectedRecordId}
                ref={odontogramRef}
              />
              <Divider />
              <h1 className="text-lg font-bold">
                2. Tình trạng vệ sinh răng miệng (OHI-S)
              </h1>
              <TeethOverall ref={plaqueRef} selectedExam={selectedRecordId} />
              <Divider />
              <h1 className="text-lg font-bold">3. Điều trị</h1>
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
            </div>
          )}
          <div className="mt-5 flex justify-end gap-4">
            {selectedRecordId && (
              <Button onClick={handleSubmit} variants="contained">
                Chỉnh sửa phiếu khám
              </Button>
            )}
          </div>
        </Card>
        <div className="flex justify-end gap-4">
          <Button onClick={handleBack} variants="outlined">
            Quay lại
          </Button>
        </div>
        <Confirm
          open={open}
          onClose={() => setOpen(false)}
          onAccept={() => {
            setOpen(false);
            triggerDelete(true);
          }}
          title="Xác nhận xoá"
          content="Bạn chắc chắn muốn xoá bệnh án này, thao tác này không thể hoàn tác."
        />
      </div>
    </>
  );
};

export default HealthCheckModal;
