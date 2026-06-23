import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import { useFormik } from "formik";
import { useEffect } from "react";

interface Props {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toothNumber?: number;
  value: any;
  onSubmit?: (value: any) => void;
}

const options = {
  problem: [
    { value: "0", label: "Bình thường" },
    { value: "1", label: "Sâu" },
    { value: "2", label: "Trám sâu lại" },
    { value: "3", label: "Trám tốt" },
    { value: "4", label: "Mất do sâu" },
    { value: "5", label: "Mất lí do khác" },
    { value: "6", label: "Bít hố rãnh" },
    { value: "7", label: "Trụ, cầu" },
    { value: "8", label: "Chưa mọc" },
    { value: "9", label: "Loại trừ" },
  ],
  treatment: [
    { value: "0", label: "Không" },
    { value: "1", label: "Trám 1 mặt" },
    { value: "2", label: "Trám ≥ 2 mặt" },
    { value: "3", label: "Mão" },
    { value: "4", label: "Veneer" },
    { value: "5", label: "Điều trị tủy" },
    { value: "6", label: "Nhổ răng" },
    { value: "F", label: "Sealants" },
    { value: "P", label: "Trám phòng ngừa" },
  ],
  locations: [
    { value: "Nh", label: "Mặt nhai" },
    { value: "N", label: "Mặt ngoài" },
    { value: "T", label: "Mặt trong" },
    { value: "G", label: "Mặt gần" },
    { value: "X", label: "Mặt xa" },
  ],
};

const mappingValue = (value: any) => {
  if (!value) return {};

  const treatment = options.treatment.find(
    (item) => item.value === value.treatment,
  );
  const problem = options.problem.find((item) => item.value === value.problem);

  const locations = options.locations.filter((item: any) =>
    value.locations?.find((loc: any) => loc === item.value),
  );

  return { treatment, problem, locations };
};

const ToothModal = ({
  isOpen,
  setIsOpen,
  toothNumber,
  value,
  onSubmit,
}: Props) => {
  const { setFieldValue, values, setValues, handleSubmit } = useFormik({
    initialValues: {
      problem: { value: "0", label: "Bình thường" },
      locations: [],
    },
    onSubmit: (values) => {
      onSubmit && onSubmit(values);
      setIsOpen(false);
    },
  });

  useEffect(() => {
    if (!value) return;

    const compactData = mappingValue(value) as any;

    setValues(compactData);
  }, [value]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={`Tình trạng răng số ${toothNumber}`}
      >
        <div className="flex flex-col gap-8 sm:px-6">
          <div className="flex flex-col gap-4">
            <h1 className="font-bold">1. Tình trạng răng</h1>
            <div className="grid grid-cols-2 gap-8">
              <Select
                name="problem"
                options={options.problem}
                label="Tình trạng răng"
                onChange={(v) => setFieldValue("problem", v)}
                value={values.problem}
              />
              <Select
                options={options.locations}
                label="Mặt răng"
                name="locations"
                multiple
                onChange={(v) => setFieldValue("locations", v)}
                value={values.locations}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-6 border-t border-slate-300 pt-4">
            <Button variants="outlined" onClick={() => setIsOpen(false)}>
              Đóng
            </Button>
            {<Button onClick={handleSubmit as any}>Lưu</Button>}
          </div>
        </div>
      </Modal>
    </>
  );
};
export default ToothModal;
