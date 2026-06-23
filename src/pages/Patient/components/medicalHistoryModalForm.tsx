import { api } from "@/api/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import Modal from "@/components/Modal";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import Swal from "sweetalert2";

interface Props {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setChronicConditions: React.Dispatch<React.SetStateAction<any>>;
  chronicConditions?: any[];
}

const MedicalHistoryModal = ({
  isOpen,
  setIsOpen,
  setChronicConditions,
  chronicConditions,
}: Props) => {
  const {
    data: diseases,
    isLoading,
    error,
  } = useQuery(
    "diseases",
    () =>
      api.get(`/api/diseases`).then((response) => {
        return response.data;
      }),
    { refetchOnWindowFocus: false },
  );

  const formik = useFormik({
    initialValues: { chronicConditions: chronicConditions },
    onSubmit: (values) => {},
  });

  useEffect(() => {
    if (formik) {
      formik.setFieldValue("chronicConditions", chronicConditions);
    }
  }, []);

  const handleSave = () => {
    Swal.fire({
      html: "Bạn có muốn thêm tiền sử bệnh không?",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Thêm",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((response) => {
      if (response.isConfirmed) {
        setChronicConditions(formik.values.chronicConditions);
        setIsOpen(false);
      }
    });
  };

  if (isLoading) return "Loading...";
  return (
    <>
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Tiền sử bệnh">
        <form>
          <div className="flex flex-col gap-8 sm:px-6 ">
            <div className="flex flex-col gap-4">
              <Card>
                <h1 className="font-bold">I. Bệnh mãn tính</h1>
                <div className="grid grid-cols-4 flex-wrap gap-5 p-5">
                  {diseases?.map((item: any) => {
                    return (
                      <Checkbox
                        name="chronicConditions"
                        key={item.id}
                        label={item.name}
                        value={item.id}
                        onChange={formik.handleChange}
                        // onChange={handleChange}
                        checked={formik.values.chronicConditions?.includes(
                          String(item.id),
                        )}
                      />
                    );
                  })}
                </div>
              </Card>
              <div className="flex items-center justify-end gap-6">
                <Button variants="outlined" onClick={() => setIsOpen(false)}>
                  Đóng
                </Button>
                <Button onClick={handleSave}>Lưu</Button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default MedicalHistoryModal;
