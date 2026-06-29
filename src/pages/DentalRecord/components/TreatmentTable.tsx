import React, { useEffect, useRef } from "react";
import Button from "@/components/Button";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import { v4 } from "uuid";
import SupplyModals from "./SupplyModals";
import { useState } from "react";
import Select from "@/components/Select";
import Input from "@/components/Input";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery } from "react-query";
import { api } from "@/api/api";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import Checkbox from "@/components/Checkbox";

interface Props {
  dataSource?: any;
  selectedExam?: any;
  odontogramRef?: any;
  onChange?: (value: any) => void;
}

interface compactValueType {
  id: string;
  service: string;
  diagnosis: string;
  dentistName: string;
  medication: string;
  medicationCode: number;
  tooth: string;
  createdDate: string;
}

interface diagnoseListToAddExamType {
  label: string;
  value: number;
}

interface dataType {
  diagnosis?: string;
  examId?: number;
  id?: number;
  quantity?: number;
  service?: string;
  status?: boolean;
  tooth?: string;
  diagnose?: string;
}

const service = [
  { value: "0", label: "Không" },
  { value: "1", label: "Trám 1 mặt" },
  { value: "2", label: "Trám ≥ 2 mặt" },
  { value: "3", label: "Mão" },
  { value: "4", label: "Veneer" },
  { value: "5", label: "Điều trị tủy" },
  { value: "6", label: "Nhổ răng" },
  { value: "F", label: "Sealants" },
  { value: "P", label: "Trám phòng ngừa" },
];

const compactDataDetail = (data: any) => {
  return data.map((item: any) => ({
    id: typeof item.id === "string" ? null : item.id,
    service: item?.service,
    diagnosis: item.diagnose ? item.diagnose : item.diagnosis,
    dentistName: item.doctorName ? item.doctorName : item.dentistName,
    medicationCode: item.medicationCode,
    quantity: 1,
    tooth: item.tooth,
  }));
};
const compactData = (data: any) => {
  return data.map((item: any) => ({
    service: item?.service,
    diagnosis: item.diagnose ? item.diagnose : item.diagnosis,
    dentistName: item.doctorName ? item.doctorName : item.dentistName,
    medicationCode: item.medicationCode,
    quantity: 1,
    tooth: item.tooth,
  }));
};

const columns: TableColumn[] = [
  {
    title: "STT",
    dataIndex: "STT",
  },
  {
    title: "Ngày điều trị",
    dataIndex: "createdDate",
  },
  {
    title: "Chẩn đoán",
    dataIndex: "diagnose",
  },
  {
    title: "Điều trị",
    dataIndex: "treatmentService",
  },
  {
    title: "Thuốc/VTYT",
    dataIndex: "medication",
  },
  {
    title: "Bác sĩ thực hiện",
    dataIndex: "doctorName",
  },
  {
    title: "",
    dataIndex: "action",
  },
];

const medicationList = [
  {
    value: 1,
    label: "Fuji 7",
    unit: "Hộp",
  },
  {
    value: 2,
    label: "Fuji 9",
    unit: "Hộp",
  },
  {
    value: 3,
    label: "Clinpro sealant",
    unit: "Hộp",
  },
  {
    value: 4,
    label: "Duraphat sealant",
    unit: "Hộp",
  },
  {
    value: 5,
    label: "Composite",
    unit: "Ống",
  },
  {
    value: 6,
    label: "Thuốc tê Lidocaine",
    unit: "Ống",
  },
  {
    value: 7,
    label: "Thuốc tê xoa",
    unit: "Hộp",
  },
  {
    value: 8,
    label: "Thuốc tê xit",
    unit: "Chai",
  },
  {
    value: 9,
    label: "V-Varnish",
    unit: "Que",
  },
  {
    value: 10,
    label: "Duraphat 22600 ppmF",
    unit: "Que",
  },
  {
    value: 11,
    label: "3M ESPE Varnish 5%",
    unit: "Que",
  },
];

const TreatmentTable = React.forwardRef<any, any>(
  (
    {
      dataSource: dataSourceProp = [],
      selectedExam,
      onChange,
      odontogramRef,
    }: Props,
    ref,
  ) => {
    const [openSupplyModal, setOpenSupplyModal] = useState<boolean>(false);
    const [valuess, setValues] = useState([]);
    const [treatmentList, setTreatmentList] = useState<any>([]);
    const url = useLocation().pathname.split("/");
    const [treatmentListDetail, setTreatmentListDetail] = useState([]);
    const [diagnoseListToAddExam, setDiagnoseListToAddExam] = useState<any>();
    const [toothForCreateExam, setToothForCreateExam] = useState<any>([]);
    const [diagnoseList, setDiagnoseList] = useState<any>();
    const [diagnoseListDetail, setDiagnoseListDetail] = useState<any>();
    const input = odontogramRef;
    const redColor = ["1", "2", "4", "5", "9"];

    React.useImperativeHandle(ref, () => valuess as any, [{}]);

    useEffect(() => {
      if (!odontogramRef) return;

      const convertOdontogramRefData = Object.entries(odontogramRef?.current);
      const toothOptions: any[] = [];
      convertOdontogramRefData.forEach((item) => {
        toothOptions.push({ label: item[0] as any });
      });

      setToothForCreateExam(toothOptions as any);
    }, [odontogramRef?.current]);

    const { data, refetch } = useQuery(
      `getTreatment/${selectedExam}`,
      () =>
        api
          .get(
            `/api/patients/${
              url[url.length - 2]
            }/exams/${selectedExam}/treatmentRecord`,
          )
          .then((response) => response.data),
      { enabled: !!selectedExam, refetchOnWindowFocus: false },
    );

    useEffect(() => {
      if (!data) return;
      const mappingDataSource = mappingData(data);
      setTreatmentListDetail(mappingDataSource);
    }, [data]);

    useEffect(() => {
      if (!data) return;
      setTreatmentList(data);
    }, [data]);

    // Delete treatement record of add treatment
    const deleteHandle = (code: compactValueType, data: any) => {
      setTreatmentList((prevList: any) =>
        prevList.filter((item: any) => item.id !== code.id),
      );

      const diagnoseListAfterDelete: any = [];

      diagnoseListAfterDelete.push({
        value: Number(data[0].tooth),
        label: data[0].diagnosis,
      });

      setDiagnoseListToAddExam((prevList: any) => [
        ...prevList,
        diagnoseListAfterDelete[0],
      ]);
    };

    const getServiceByCode = (code: string) => {
      return service.find((item) => item?.value === code?.toString())?.label;
    };

    const getProductByCode = (code: string) => {
      return medicationList.find(
        (item) => item.value.toString() === code?.toString(),
      )?.label;
    };

    const mappingData = (data: any) => {
      return data.map((item: any, idx: number) => ({
        id: item.id,
        STT: idx + 1,
        createdDate: item.createdDate,
        treatmentService: getServiceByCode(item.service),
        diagnose: item.diagnosis,
        doctorName: item.dentistName,
        service: item.service,
        medication: getProductByCode(item.medication),
        medicationCode: item.medicationCode,
        tooth: item.tooth,
        action: <Button onClick={() => deleteHandle(item, data)}>Xóa</Button>,
      }));
    };

    const validationTreatmentSchema = Yup.object().shape({
      diagnosis: Yup.object().required("Vui lòng chọn chẩn đoán!"),
      service: Yup.object().required("Vui lòng chọn dịch vụ điều trị!"),
    });

    if (selectedExam) {
      useEffect(() => {
        onChange && onChange(compactDataDetail(treatmentListDetail));
      }, [treatmentListDetail, valuess, selectedExam]);
    } else {
      useEffect(() => {
        onChange && onChange(compactData(treatmentList));
      }, [treatmentList, valuess]);
    }

    // Delete treatment record of view detail
    const handleDelete = (valueDelete: any) => {
      Swal.fire({
        html: "Bạn có muốn xoá phiếu điều trị này không?",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Xoá",
        cancelButtonText: "Huỷ",
        reverseButtons: true,
      }).then((response) => {
        if (response.isConfirmed) {
          refetch();
          setTreatmentListDetail((prevList) =>
            prevList.filter((item: any) => item.id !== valueDelete.id),
          );

          const diagnoseListDetailAfterDelete: any = [];

          diagnoseListDetailAfterDelete.push({
            value: Number(valueDelete.tooth),
            label: valueDelete.diagnose,
          });

          setDiagnoseListDetail((prevList: any) => [
            ...prevList,
            diagnoseListDetailAfterDelete[0],
          ]);
        }
      });
    };

    function padTo2Digits(num: number) {
      return num.toString().padStart(2, "0");
    }

    function formatDate(date: Date) {
      if (selectedExam) {
        return [
          padTo2Digits(date.getMonth() + 1),
          padTo2Digits(date.getDate()),
          date.getFullYear(),
        ].join("/");
      } else {
        return [
          padTo2Digits(date.getDate()),
          padTo2Digits(date.getMonth() + 1),
          date.getFullYear(),
        ].join("/");
      }
    }

    // View detail treatment list
    const mappingToViewData = treatmentListDetail?.map(
      (item: any, idx: number) => ({
        // id: item.id,
        STT: idx + 1,
        createdDate: new Date(item.createdDate).toLocaleDateString(),
        treatmentService: getServiceByCode(item?.service),
        tooth: item?.tooth,
        diagnose: item.diagnose ? item.diagnose : item.diagnosis,
        doctorName: item.doctorName ? item.doctorName : item.dentistName,
        medication: getProductByCode(item.medicationCode),
        action: <Button onClick={() => handleDelete(item)}>Xóa</Button>,
      }),
    );

    // After adding the treatment sheet
    // delete the added diagnosis from the diagnosis selectbox
    const handleClearDiagnoseList = (data: compactValueType) => {
      if (!selectedExam) {
        const dataAfterAdd = diagnoseListToAddExam.filter(
          (item: diagnoseListToAddExamType) => item.label !== data.diagnosis,
        );
        setDiagnoseListToAddExam(dataAfterAdd);
      } else {
        const dataAfterAdd = diagnoseListDetail.filter(
          (item: diagnoseListToAddExamType) => item.label !== data.diagnosis,
        );
        setDiagnoseListDetail(dataAfterAdd);
      }
    };

    const formik = useFormik({
      initialValues: {
        service: null,
        diagnosis: "",
        dentistName: "",
        medication: "",
        tooth: "",
      },
      validationSchema: validationTreatmentSchema,
      onSubmit: (values: any, { resetForm }) => {
        const compactValue: compactValueType = {
          id: v4(),
          service: values.service.value,
          diagnosis: values.diagnosis.label,
          dentistName: values.dentistName,
          medication: values.medication.value,
          medicationCode: values.medication.value,
          tooth: toothForCreateExam[0].label,
          createdDate: formatDate(new Date()),
        };

        const newValue = [...treatmentList, ...mappingData([compactValue])];
        const newValueOfSelectedExam = [
          ...treatmentListDetail,
          ...mappingData([compactValue]),
        ];
        if (selectedExam) {
          setTreatmentListDetail(newValueOfSelectedExam as any);
        } else {
          setTreatmentList(newValue as any);
        }
        handleClearDiagnoseList(compactValue);
        resetForm();
      },
    });

    const { values, setFieldValue, handleSubmit } = formik;
    // Get the values of toothProblem and toothPosition
    const convertOdontogramRef = Object?.keys(input?.current || {}).map(
      (key) => {
        const item = input?.current[key];
        if (redColor.includes(item.problem)) {
          const transformedItem = [
            key,
            getProblemLabel(item?.problem),
            getLocationLabel(item?.locations[0]),
            getLocationLabel(item?.locations[1]),
            getLocationLabel(item?.locations[2]),
            getLocationLabel(item?.locations[3]),
            getLocationLabel(item?.locations[4]),
          ];
          return transformedItem;
        } else {
          return [];
        }
      },
    );

    const dataAfterConvert = convertOdontogramRef.filter(
      (item) => item.length > 0,
    );

    function getProblemLabel(problem: string) {
      switch (problem) {
        case "0":
          return "Bình thường";
        case "1":
          return "Sâu";
        case "2":
          return "Trám sâu lại";
        case "3":
          return "Trám tốt";
        case "4":
          return "Mất do sâu";
        case "5":
          return "Mất lí do khác";
        case "6":
          return "Bít hố rãnh";
        case "7":
          return "Trụ, cầu";
        case "8":
          return "Chưa mọc";
        case "9":
          return "Loại trừ";
        default:
          return "";
      }
    }

    function getLocationLabel(location: string) {
      switch (location) {
        case "Nh":
          return "mặt nhai";
        case "N":
          return "mặt ngoài";
        case "T":
          return "mặt trong";
        case "G":
          return "mặt gần";
        case "X":
          return "mặt xa";
        default:
          return "";
      }
    }

    // Convert data into toothNumber + toothProblem + toothPosition format
    const diagnoseValue = dataAfterConvert.map((item) => {
      const value = parseInt(item[0]);
      const label = "Răng " + item.filter(Boolean).join(" ");

      return { value, label };
    });

    useEffect(() => {
      setDiagnoseList(diagnoseValue);
    }, [selectedExam, input?.current]);

    useEffect(() => {
      setDiagnoseListToAddExam(diagnoseValue);
    }, [odontogramRef.current]);

    useEffect(() => {
      convertToDesiredFormat(diagnoseList, data);
    }, [diagnoseList, data]);

    // Convert data into toothNumber + toothProblem + toothPosition format
    function convertToDesiredFormat(array1: any, array2: any) {
      if (selectedExam) {
        const valuesToKeep = array2?.map((item: dataType) => item.diagnosis);
        const object3 = array1?.filter(
          (item: diagnoseListToAddExamType) =>
            !valuesToKeep?.includes(item.label),
        );
        return object3;
      } else {
        const result: any = [];
        array2?.forEach((item2: any) => {
          const matchedItem = array1.find(
            (item1: any) => item1.label === item2.diagnosis,
          );
          if (matchedItem) {
            result.push({
              value: matchedItem.value,
              label: matchedItem.label,
            });
          }
        });
        return result;
      }
    }

    const resultArray = convertToDesiredFormat(diagnoseList, data);

    useEffect(() => {
      setDiagnoseListDetail(resultArray);
    }, [selectedExam, data, diagnoseList]);

    const mappingActionData = treatmentList.map((item: dataType) => ({
      ...item,
    }));

    return (
      <>
        <SupplyModals
          isOpen={openSupplyModal}
          setIsOpen={setOpenSupplyModal}
          onChange={setValues}
        />
        <div className="mb-4 grid grid-cols-4 items-center gap-4">
          <Select
            label="Chẩn đoán"
            value={values.diagnosis}
            onChange={(v) => setFieldValue("diagnosis", v)}
            placeholder="Chọn chẩn đoán"
            options={!selectedExam ? diagnoseListToAddExam : diagnoseListDetail}
            required
            error={formik.touched.diagnosis ? formik.errors.diagnosis : ""}
          />
          <Select
            label="Điều trị"
            value={values.service}
            onChange={(e) => setFieldValue("service", e)}
            placeholder="Chọn điều trị"
            options={service}
            required
            error={formik.touched.service ? formik.errors.service : ""}
          />
          <Select
            label="Thuốc/VTYT"
            options={medicationList}
            value={values.medication}
            onChange={(e) => setFieldValue("medication", e)}
            placeholder="Chọn thuốc/VTYT"
          />
          <div className="flex items-end gap-4">
            <Input
              name="dentistName"
              label="Bác sĩ thực hiện"
              value={values.dentistName}
              onChange={(e) => setFieldValue("dentistName", e.target.value)}
            />
            <Button type="button" onClick={handleSubmit as any}>
              Thêm
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={!selectedExam ? mappingActionData : mappingToViewData}
        />
      </>
    );
  },
);
export default TreatmentTable;
