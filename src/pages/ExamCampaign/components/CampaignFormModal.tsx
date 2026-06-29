import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { api } from "@/api/api";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Modal from "@/components/Modal";
import Swal from "sweetalert2";
import { IExamCampaign, CampaignStatus } from "../type";

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  campaignId?: number;
  onSuccess?: () => void;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Tên đợt khám không được để trống"),
  campaignStatus: Yup.string().required("Trạng thái không được để trống"),
  startDate: Yup.string().required("Ngày bắt đầu không được để trống"),
  endDate: Yup.string()
    .required("Ngày kết thúc không được để trống")
    .test(
      "compare-dates",
      "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
      function (value) {
        const { startDate } = this.parent;
        if (!startDate || !value) return true;
        return new Date(value) >= new Date(startDate);
      },
    ),
  description: Yup.string(),
});

const statusOptions = [
  { value: "Sắp tới", label: "Sắp tới" },
  { value: "Đang diễn ra", label: "Đang diễn ra" },
  { value: "Đã xong", label: "Đã xong" },
  { value: "Đã hủy", label: "Đã hủy" },
];

const CampaignFormModal = ({
  isOpen,
  setIsOpen,
  campaignId,
  onSuccess,
}: Props) => {
  const isEdit = !!campaignId;

  const formik = useFormik<IExamCampaign>({
    initialValues: {
      name: "",
      campaignStatus: "Sắp tới",
      startDate: "",
      endDate: "",
      description: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          await api.put(`/api/exam-campaigns/${campaignId}`, values);
          Swal.fire({
            icon: "success",
            title: "Cập nhật đợt khám thành công!",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await api.post("/api/exam-campaigns", values);
          Swal.fire({
            icon: "success",
            title: "Thêm đợt khám mới thành công!",
            timer: 1500,
            showConfirmButton: false,
          });
        }
        setIsOpen(false);
        onSuccess && onSuccess();
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: msg,
        });
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEdit && campaignId) {
        api.get(`/api/exam-campaigns/${campaignId}`).then((res) => {
          const data = res.data;
          formik.setValues({
            name: data.name || "",
            campaignStatus: data.campaignStatus || "Sắp tới",
            startDate: data.startDate || "",
            endDate: data.endDate || "",
            description: data.description || "",
          });
        });
      } else {
        formik.resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, campaignId]);

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={isEdit ? "Cập nhật đợt khám" : "Thêm đợt khám mới"}
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            name="name"
            label="Tên đợt khám"
            placeholder="Nhập tên đợt khám"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name ? formik.errors.name : undefined}
            required
          />

          <Select<{ value: string; label: string }>
            name="campaignStatus"
            label="Trạng thái"
            placeholder="Chọn trạng thái"
            options={statusOptions}
            value={
              statusOptions.find(
                (opt) => opt.value === formik.values.campaignStatus,
              ) || statusOptions[0]
            }
            onChange={(selected) => {
              formik.setFieldValue(
                "campaignStatus",
                selected ? selected.value : "Sắp tới",
              );
            }}
            getOptionLabel={(option) => option.label}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            name="startDate"
            label="Ngày bắt đầu"
            type="date"
            value={formik.values.startDate}
            onChange={formik.handleChange}
            error={
              formik.touched.startDate ? formik.errors.startDate : undefined
            }
            required
          />

          <Input
            name="endDate"
            label="Ngày kết thúc"
            type="date"
            value={formik.values.endDate}
            onChange={formik.handleChange}
            error={formik.touched.endDate ? formik.errors.endDate : undefined}
            required
          />
        </div>

        <Input
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả chi tiết đợt khám"
          value={formik.values.description}
          onChange={formik.handleChange}
          error={
            formik.touched.description ? formik.errors.description : undefined
          }
        />

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variants="outlined"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            Hủy
          </Button>
          <Button type="submit">{isEdit ? "Cập nhật" : "Lưu"}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CampaignFormModal;
