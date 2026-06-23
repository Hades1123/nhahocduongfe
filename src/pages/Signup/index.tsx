import { userApi } from "@/api/userApi";
import background from "@/assets/background.jpg";
import bg from "@/assets/bg.svg";
import logo from "@/assets/logo/logo.png";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { IUserInformation, IRole } from "@/pages/Management/type";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import { isEmpty } from "lodash";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as Yup from "yup";

interface SignupFormData extends Omit<IUserInformation, "id"> {}

const Signup = () => {
  const [showPass, setShowPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await userApi.getRoles();
      setRoles(response.data || []);
    } catch (err) {
      console.error("Failed to fetch roles", err);
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
    },
    validationSchema: signupValidationSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        const signupData: Omit<IUserInformation, "id" | "rePassword"> = {
          username: values.username,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          birthDate: values.birthDate,
          organizationId: values.organizationId,
          roleIds: values.roleIds,
        };

        await userApi.create(signupData);

        Swal.fire({
          icon: "success",
          title: "Đăng ký thành công!",
          text: "Vui lòng đăng nhập với tài khoản mới của bạn",
        });

        navigate("/login");
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Đăng ký thất bại",
          text:
            err?.response?.data?.message || "Tài khoản hoặc email đã tồn tại",
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

  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="grid h-full grid-cols-10 bg-gray-200">
        {/* Left side - Background */}
        <div className="relative col-span-5 flex h-screen items-center justify-center">
          <div className="absolute left-1/2 top-1/2 max-w-lg -translate-x-1/2 -translate-y-1/2">
            <img src={bg} className="max-w-xl" />
          </div>
          <img src={background} className="h-full w-full" />
        </div>

        {/* Right side - Signup Form */}
        <div className="col-span-5 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-white py-8">
          <div className="flex flex-col items-center gap-4">
            <img src={logo} className="w-40" />
            <h1 className="text-3xl font-bold uppercase text-indigo-600">
              Đăng ký tài khoản
            </h1>
          </div>

          <div className="flex w-[450px] flex-col gap-4">
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
