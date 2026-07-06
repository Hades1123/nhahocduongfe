import { userApi } from "@/api/userApi";
import { api } from "@/api/api";
import background from "@/assets/background.jpg";
import bg from "@/assets/bg.svg";
import logo from "@/assets/logo/logo.png";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Autocomplete from "@/components/Autocomplete";
import { IUserInformation, IRole } from "@/pages/Management/type";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import { isEmpty } from "lodash";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as Yup from "yup";

interface SignupFormData extends Omit<IUserInformation, "id"> {
  accountType: "BAC_SI" | "TRUONG_HOC" | "";
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "BAC_SI", label: "Bác sĩ" },
  { value: "TRUONG_HOC", label: "Trường học" },
];

const Signup = () => {
  const [showPass, setShowPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
    fetchOrganizations();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await userApi.getRoles();
      setRoles(response.data || []);
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  const fetchOrganizations = async () => {
    setOrgsLoading(true);
    setOrgsError(null);
    try {
      const response = await api.get(
        "/api/organization/search?size=1000&sort=name,asc",
      );
      const data = response.data?.content || response.data || [];
      console.log("Organizations loaded:", data.length, "schools");
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch organizations:", err);
      setOrgsError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách trường học",
      );
      setOrganizations([]);
    } finally {
      setOrgsLoading(false);
    }
  };

  const signupValidationSchema = Yup.object().shape({
    username: Yup.string()
      .required("Vui lòng nhập tên đăng nhập")
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    email: Yup.string()
      .email("Email không hợp lệ")
      .required("Vui lòng nhập email"),
    password: Yup.string()
      .required("Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    rePassword: Yup.string()
      .required("Vui lòng xác nhận mật khẩu")
      .oneOf([Yup.ref("password")], "Mật khẩu không khớp"),
    firstName: Yup.string().required("Vui lòng nhập họ"),
    lastName: Yup.string().required("Vui lòng nhập tên"),
    phoneNumber: Yup.string().required("Vui lòng nhập số điện thoại"),
    birthDate: Yup.string().required("Vui lòng chọn ngày sinh"),
    accountType: Yup.string().required("Vui lòng chọn loại tài khoản"),
    organizationId: Yup.number().when("accountType", {
      is: "TRUONG_HOC",
      then: (schema) =>
        schema
          .required("Vui lòng chọn trường học")
          .typeError("Vui lòng chọn trường học"),
      otherwise: (schema) => schema.nullable(),
    }),
  });

  const formik = useFormik<SignupFormData>({
    initialValues: {
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
      accountType: "",
    },
    validationSchema: signupValidationSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);

        // Map account type to corresponding role
        let mappedRoleIds = [...values.roleIds];
        if (values.accountType === "BAC_SI") {
          const dentistRole = roles.find(
            (r) => r.code?.toUpperCase() === "DENTIST",
          );
          if (dentistRole) {
            mappedRoleIds = [Number(dentistRole.id), ...mappedRoleIds];
          } else {
            Swal.fire({
              icon: "error",
              title: "Lỗi",
              text: "Role DENTIST chưa tồn tại trong hệ thống. Vui lòng liên hệ admin.",
            });
            setIsLoading(false);
            return;
          }
        } else if (values.accountType === "TRUONG_HOC") {
          const guestRole = roles.find(
            (r) => r.code?.toUpperCase() === "GUEST",
          );
          if (guestRole) {
            mappedRoleIds = [Number(guestRole.id), ...mappedRoleIds];
          } else {
            Swal.fire({
              icon: "error",
              title: "Lỗi",
              text: "Role GUEST chưa tồn tại trong hệ thống. Vui lòng liên hệ admin.",
            });
            setIsLoading(false);
            return;
          }
        }

        const signupData: Omit<IUserInformation, "id" | "rePassword"> = {
          username: values.username,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          birthDate: values.birthDate,
          organizationId: values.organizationId,
          roleIds: mappedRoleIds,
        };

        await userApi.create(signupData);

        Swal.fire({
          icon: "success",
          title: "Đã gửi yêu cầu đăng ký thành công!",
          text: "Vui lòng đợi admin xét duyệt tài khoản.",
        });

        navigate("/login");
      } catch (err: any) {
        let errorMsg = err?.response?.data?.detail || err?.response?.data?.message || "Tài khoản hoặc email đã tồn tại";
        if (errorMsg === "Weak password") {
          errorMsg = "Mật khẩu quá yếu! Mật khẩu phải có ít nhất 6 ký tự, bao gồm ít nhất 1 chữ cái in HOA, 1 chữ cái in thường và 1 chữ số.";
        }
        Swal.fire({
          icon: "error",
          title: "Đăng ký thất bại",
          text: errorMsg,
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleShowPassword = () => setShowPass(true);
  const handleHidePassword = () => setShowPass(false);
  const handleShowConfirmPass = () => setShowConfirmPass(true);
  const handleHideConfirmPass = () => setShowConfirmPass(false);

  const { dirty, errors } = formik;
  const isSchoolSelected = formik.values.accountType === "TRUONG_HOC";

  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="grid h-screen min-h-[600px] grid-cols-1 bg-gray-200 lg:grid-cols-10">
        {/* Left side - Background */}
        <div className="relative hidden h-full items-center justify-center lg:col-span-5 lg:flex">
          <div className="absolute left-1/2 top-1/2 max-w-lg -translate-x-1/2 -translate-y-1/2">
            <img src={bg} className="max-w-xl" />
          </div>
          <img src={background} className="h-full w-full object-cover" />
        </div>

        {/* Right side - Signup Form */}
        <div className="col-span-1 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-white p-4 py-8 lg:col-span-5">
          <div className="flex flex-col items-center gap-4 text-center">
            <img src={logo} className="w-32 lg:w-40" />
            <h1 className="text-xl font-bold uppercase text-indigo-600 lg:text-3xl">
              Đăng ký tài khoản
            </h1>
          </div>

          <div className="flex w-full max-w-[450px] flex-col gap-4">
            {/* Username */}
            <Input
              placeholder="Tên đăng nhập"
              inputClass="py-3 !text-base"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="username"
              error={formik.touched.username && formik.errors.username}
            />

            {/* Email */}
            <Input
              placeholder="Email"
              inputClass="py-3 !text-base"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="email"
              error={formik.touched.email && formik.errors.email}
            />

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Họ"
                inputClass="py-3 !text-base"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="firstName"
                error={formik.touched.firstName && formik.errors.firstName}
              />

              <Input
                placeholder="Tên"
                inputClass="py-3 !text-base"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="lastName"
                error={formik.touched.lastName && formik.errors.lastName}
              />
            </div>

            {/* Phone Number & Birth Date */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Số điện thoại"
                inputClass="py-3 !text-base"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="phoneNumber"
                error={formik.touched.phoneNumber && formik.errors.phoneNumber}
              />

              <Input
                placeholder="Ngày sinh"
                inputClass="py-3 !text-base"
                type="date"
                value={formik.values.birthDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                name="birthDate"
                error={formik.touched.birthDate && formik.errors.birthDate}
              />
            </div>

            {/* Password */}
            <Input
              placeholder="Mật khẩu"
              inputClass="py-3 !text-base"
              type={showPass ? "text" : "password"}
              addOnAfter={
                !showPass ? (
                  <EyeSlashIcon
                    cursor="pointer"
                    onClick={handleShowPassword}
                    className="h-5 w-5"
                  />
                ) : (
                  <EyeIcon
                    cursor="pointer"
                    onClick={handleHidePassword}
                    className="h-5 w-5"
                  />
                )
              }
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="password"
              error={formik.touched.password && formik.errors.password}
            />

            {/* Confirm Password */}
            <Input
              placeholder="Xác nhận mật khẩu"
              inputClass="py-3 !text-base"
              type={showConfirmPass ? "text" : "password"}
              addOnAfter={
                !showConfirmPass ? (
                  <EyeSlashIcon
                    cursor="pointer"
                    onClick={handleShowConfirmPass}
                    className="h-5 w-5"
                  />
                ) : (
                  <EyeIcon
                    cursor="pointer"
                    onClick={handleHideConfirmPass}
                    className="h-5 w-5"
                  />
                )
              }
              value={formik.values.rePassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name="rePassword"
              error={formik.touched.rePassword && formik.errors.rePassword}
            />

            {/* Account Type Selector */}
            <div>
              <label className="mb-1 block text-sm font-semibold leading-6 text-gray-900">
                Loại tài khoản <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      formik.setFieldValue("accountType", opt.value)
                    }
                    className={`flex-1 rounded-lg border px-4 py-3 text-center text-sm font-medium transition-colors ${
                      formik.values.accountType === opt.value
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {formik.touched.accountType && formik.errors.accountType && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.accountType}
                </p>
              )}
            </div>

            {/* School Autocomplete - only enabled when "Trường học" is selected */}
            <Autocomplete
              name="organizationId"
              label="Trường học"
              placeholder={
                !isSchoolSelected
                  ? "Vui lòng chọn loại tài khoản \"Trường học\" trước"
                  : orgsLoading
                  ? "Đang tải danh sách trường học..."
                  : orgsError
                  ? "Lỗi tải dữ liệu, hãy thử lại sau"
                  : "Nhập tên trường để tìm kiếm..."
              }
              options={organizations}
              value={
                formik.values.organizationId
                  ? organizations.find(
                      (org: any) => org.id === formik.values.organizationId,
                    ) || null
                  : null
              }
              onChange={(selected: any) => {
                formik.setFieldValue(
                  "organizationId",
                  selected ? selected.id : null,
                );
                formik.setFieldTouched("organizationId", true, false);
              }}
              getOptionLabel={(option: any) => option.name || ""}
              disabled={!isSchoolSelected || orgsLoading}
              required={isSchoolSelected}
              loading={orgsLoading}
              error={
                orgsError ||
                (formik.touched.organizationId && formik.errors.organizationId)
              }
            />

            {/* Submit Button */}
            <Button
              isDisabled={!isEmpty(errors) || !dirty || isLoading}
              type="submit"
              className="mt-2 h-12 text-base"
            >
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>

            {/* Back to Login */}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">Đã có tài khoản?</span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="cursor-pointer text-sm font-semibold text-indigo-600 underline hover:text-indigo-700"
              >
                Đăng nhập tại đây
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Signup;
