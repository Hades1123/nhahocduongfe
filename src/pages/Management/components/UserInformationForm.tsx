import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { useEffect } from "react";
import { useFormik } from "formik";
import { useQuery } from "react-query";
import { IUserInformation, IRole } from "../type";
import { userApi } from "@/api/userApi";
import Swal from "sweetalert2";
import * as Yup from "yup";

interface Props {
  isEdit: boolean;
  userId?: number;
  onSuccess?: () => void;
}

const validationSchema = Yup.object({
  username: Yup.string().required("Tài khoản không được để trống"),
  password: Yup.string().when("isEdit", {
    is: false,
    then: (schema) =>
      schema
        .required("Mật khẩu không được để trống")
        .min(6, "Mật khẩu ít nhất 6 ký tự")
        .matches(/(?=.*\d)/, "Mật khẩu phải có ít nhất 1 chữ số")
        .matches(/(?=.*[a-z])/, "Mật khẩu phải có ít nhất 1 chữ thường")
        .matches(/(?=.*[A-Z])/, "Mật khẩu phải có ít nhất 1 chữ hoa"),
    otherwise: (schema) => schema,
  }),
  rePassword: Yup.string().when("password", {
    is: (password: string) => password && password.length > 0,
    then: (schema) =>
      schema
        .required("Xác nhận mật khẩu không được để trống")
        .oneOf([Yup.ref("password")], "Mật khẩu xác nhận không khớp"),
    otherwise: (schema) => schema,
  }),
  firstName: Yup.string().required("Họ không được để trống"),
  lastName: Yup.string().required("Tên không được để trống"),
  email: Yup.string()
    .email("Email không hợp lệ")
    .required("Email không được để trống"),
  phoneNumber: Yup.string(),
  birthDate: Yup.string(),
});

const init: IUserInformation & { isEdit: boolean } = {
  username: "",
  password: "",
  rePassword: "",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  birthDate: "",
  organizationId: null,
  roleIds: [],
  isEdit: false,
};

const UserInformationForm = ({ isEdit = false, userId, onSuccess }: Props) => {
  // Fetch roles for dropdown
  const { data: roles = [] } = useQuery<IRole[]>(
    "getRolesForForm",
    async () => {
      const res = await userApi.getRoles();
      return res.data;
    },
    { refetchOnWindowFocus: false },
  );

  // Fetch user data if editing
  const { data: existingUser } = useQuery(
    ["getUserById", userId],
    async () => {
      if (!userId) return null;
      const res = await userApi.getById(userId);
      return res.data;
    },
    {
      enabled: isEdit && !!userId,
      refetchOnWindowFocus: false,
    },
  );

  const formik = useFormik({
    initialValues: { ...init, isEdit },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        if (isEdit && userId) {
          // Update existing user
          await userApi.update(userId, values);
          Swal.fire({
            icon: "success",
            title: "Cập nhật người dùng thành công!",
          });
        } else {
          // Create new user
          await userApi.create(values);
          Swal.fire({
            icon: "success",
            title: "Tạo người dùng mới thành công!",
          });
        }
        onSuccess && onSuccess();
      } catch (err: any) {
        const message =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Có lỗi xảy ra, vui lòng thử lại";
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: message,
        });
      }
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingUser && isEdit) {
      formik.setValues({
        ...init,
        isEdit: true,
        username: existingUser.username || "",
        firstName: existingUser.firstName || "",
        lastName: existingUser.lastName || "",
        email: existingUser.email || "",
        phoneNumber: existingUser.phoneNumber || "",
        birthDate: existingUser.birthDate || "",
        organizationId: existingUser.organization?.id || null,
        roleIds: existingUser.roleList?.map((r: any) => Number(r.id)) || [],
      });
    }
  }, [existingUser]);

  const roleOptions = roles.map((r) => ({
    value: Number(r.id),
    label: r.name,
  }));

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="username"
          label="Tài khoản"
          placeholder="Nhập tài khoản"
          value={formik.values.username}
          onChange={formik.handleChange}
          error={formik.touched.username ? formik.errors.username : undefined}
          required
          disabled={isEdit}
        />
        <Input
          name="lastName"
          label="Họ"
          placeholder="Nhập họ"
          value={formik.values.lastName}
          onChange={formik.handleChange}
          error={formik.touched.lastName ? formik.errors.lastName : undefined}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="firstName"
          label="Tên"
          placeholder="Nhập tên"
          value={formik.values.firstName}
          onChange={formik.handleChange}
          error={formik.touched.firstName ? formik.errors.firstName : undefined}
          required
        />
        <Input
          name="email"
          label="Email"
          placeholder="Nhập email"
          type="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          error={formik.touched.email ? formik.errors.email : undefined}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="phoneNumber"
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          value={formik.values.phoneNumber}
          onChange={formik.handleChange}
          error={
            formik.touched.phoneNumber ? formik.errors.phoneNumber : undefined
          }
        />
        <Input
          name="birthDate"
          label="Ngày sinh"
          type="date"
          value={formik.values.birthDate}
          onChange={formik.handleChange}
          error={formik.touched.birthDate ? formik.errors.birthDate : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="password"
          label={isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
          placeholder="Nhập mật khẩu"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password ? formik.errors.password : undefined}
          required={!isEdit}
        />
        <Input
          name="rePassword"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          type="password"
          value={formik.values.rePassword}
          onChange={formik.handleChange}
          error={
            formik.touched.rePassword ? formik.errors.rePassword : undefined
          }
          required={!isEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select<{ value: number; label: string }>
          name="roleIds"
          label="Vai trò"
          placeholder="Chọn vai trò"
          options={roleOptions}
          value={roleOptions.filter((r) =>
            formik.values.roleIds.includes(r.value),
          )}
          onChange={(selected) => {
            const ids = Array.isArray(selected)
              ? selected.map((s) => s.value)
              : selected
              ? [selected.value]
              : [];
            formik.setFieldValue("roleIds", ids);
          }}
          getOptionLabel={(option) => option.label}
          multiple
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit">{isEdit ? "Cập nhật" : "Lưu"}</Button>
      </div>
    </form>
  );
};

export default UserInformationForm;
