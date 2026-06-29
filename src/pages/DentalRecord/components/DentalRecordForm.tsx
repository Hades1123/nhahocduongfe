import Button from "@/components/Button";
import Input from "@/components/Input";
import Table from "@/components/Table";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Odontogram from "./Odontogram";
import Select from "@/components/Select";
import TreatmentTable from "./TreatmentTable";
import { useEffect, useRef, useState } from "react";
import ListPatientModal from "./ListPatientModal";
import SupplyModals from "./SupplyModals";
import Card from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import RadioButton from "@/components/RadioButton";
import PatientInfo from "../forms/PatientInfo";
import TeethOverall from "./TeethOverall";

interface Props {}

const columns = [
  {
    title: "STT",
    dataIndex: "stt",
  },
  {
    title: "Phiếu khám",
    dataIndex: "pk",
  },
  {
    title: "Nơi khám",
    dataIndex: "nk",
  },
  {
    title: "Bác sĩ khám",
    dataIndex: "bsk",
  },
  {
    title: "Chẩn đoán",
    dataIndex: "cd",
  },
];

const data = [
  {
    stt: 1,
    pk: 21,
    nk: "HCM",
    bsk: "Bác sĩ Vũ",
    cd: "Sâu răng",
  },
];

const DentalRecordForm = (props: Props) => {
  const [openPatientsModal, setOpenPatientsModal] = useState<boolean>(false);
  const patientInfoFormRef = useRef(null);

  return (
    <>
      <ListPatientModal
        isOpen={openPatientsModal}
        setIsOpen={setOpenPatientsModal}
      />
      <div className="flex  flex-col gap-8">
        <Card>
          <div className="grid grid-cols-4 gap-10">
            <Input label="Phiếu khám" disabled value="112233" />
            <Input label="Ngày khám" type="date" />
            <Select label="Nơi khám" />
            <Input label="Bác sĩ khám" />
          </div>
        </Card>

        <Card header="I. Thông tin bệnh nhân">
          <div className="flex flex-col gap-2">
            <PatientInfo
              ref={patientInfoFormRef}
              onSearchPatient={() => setOpenPatientsModal(true)}
            />
          </div>
        </Card>
        <Card header="II. Tiền sử bệnh">
          <div className="flex flex-col gap-2">
            1. Bệnh mãn tính
            <div className="grid grid-cols-8 gap-10">
              <Checkbox label="Cao huyết áp" />
              <Checkbox label="Bệnh thận" />
              <Checkbox label="Tiểu đường" />
              <Checkbox label="Tim mạch" />
              <Checkbox label="Viêm khớp" />
              <Checkbox label="Bệnh dạ dày" />
              <Checkbox label="Bệnh viêm khớp dạng thấp" />
              <Checkbox label="Bệnh lý khác" />
            </div>
            2. Bệnh lý
            <div className="grid grid-cols-4 gap-10">
              <Select label="Khuyết men bẩm sinh" />
              <Select label="Nhiễm Fluor (Fluorosis)" />
              <Select label="Bệnh về máu" />
              <Select label="Bệnh bẩm sinh khác" />
            </div>
            <div className="grid grid-cols-4 gap-10">
              <div className="col-span-4">
                <Input label="Ghi chú" />
              </div>
            </div>
          </div>
        </Card>
        <Card header="III. Quá trình khám bệnh" className="flex flex-col gap-4">
          <h1 className="text-lg font-bold">1. Tình trạng răng</h1>
          <Odontogram />

          <h1 className="text-lg font-bold">2. Điều trị</h1>
          <div className="grid grid-cols-5 gap-10">
            <Select label="Nhóm dịch vụ" />
            <Select label="Dịch vụ" />
            <Input label="Bác sĩ thực hiện" />
            <Input label="Chẩn đoán" />
            <div className=" self-end">
              <Button>Thêm</Button>
            </div>
          </div>

          <TreatmentTable />
          <div className="grid grid-cols-4 gap-4">
            <Select label="Xử trí" />
            <Select label="TYT/TTYT" />
          </div>
        </Card>
        <div className="flex justify-end gap-4">
          <Button variants="outlined">Huỷ</Button>
          <Button variants="outlined">In bệnh án</Button>
          <Button>Lưu</Button>
        </div>
      </div>
    </>
  );
};
export default DentalRecordForm;
