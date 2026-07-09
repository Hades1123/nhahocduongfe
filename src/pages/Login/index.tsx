import background from "@/assets/background.jpg";
import bg from "@/assets/bg.svg";
import logo from "@/assets/logo/logo.png";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Input from "@/components/Input";
import useAuthStore from "@/stores/authStore";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import { isEmpty } from "lodash";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as Yup from "yup";

const Login = () => {
  const [showPass, setShowPass] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGuestLoading, setIsGuestLoading] = useState<boolean>(false);
  const { login, guestLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      await guestLogin();
      Swal.fire({
        icon: "success",
        title: "Đăng nhập Guest thành công!",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/dental-articles");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: (err as Error).message,
      });
    } finally {
      setIsGuestLoading(false);
    }
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string().required("Vui lòng nhập tên đăng nhập"),
    password: Yup.string().required("Vui lòng nhập mật khẩu"),
  });

  const formik = useFormik<ILoginForm>({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        await login(values.username, values.password);

        Swal.fire({
          icon: "success",
          title: "Đăng nhập thành công!",
        });

        navigate("/");
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: (err as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    validationSchema: validationSchema,
  });

  const handleShowPassword = () => {
    setShowPass(true);
  };

  const handleHidePassword = () => {
    setShowPass(false);
  };

  const { dirty, errors } = formik;

  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="grid h-screen min-h-[600px] grid-cols-1 bg-gray-200 lg:grid-cols-10">
        <div className="relative hidden h-full items-center justify-center lg:col-span-5 lg:flex">
          <div className="absolute left-1/2 top-1/2 max-w-lg -translate-x-1/2 -translate-y-1/2">
            <img src={bg} className="max-w-xl" />
          </div>
          <img src={background} className="h-full w-full object-cover" />
        </div>
        <div className="col-span-1 flex flex-col items-center justify-center gap-6 bg-white p-4 lg:col-span-5 lg:gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <img src={logo} className="mb-6 w-40 lg:mb-10 lg:w-60" />
            <h1 className="text-2xl font-bold uppercase text-indigo-600 lg:text-4xl">
              Hệ thống quản lý nha học đường
            </h1>
          </div>
          <div className="flex w-full max-w-[450px] flex-col gap-4 text-base sm:gap-6 lg:text-4xl">
            <Input
              placeholder="Tên đăng nhập"
              inputClass="py-4 !text-lg"
              className="max-h-44 "
              key={123}
              value={formik.values.username}
              onChange={formik.handleChange}
              name="username"
              error={formik.errors.username}
            />

            <Input
              placeholder="Mật khẩu"
              inputClass="py-4 !text-lg"
              className="max-h-44"
              type={showPass ? "text" : "password"}
              addOnAfter={
                !showPass ? (
                  <EyeSlashIcon
                    cursor="pointer"
                    onClick={handleShowPassword}
                    className="h-6 w-6"
                  />
                ) : (
                  <EyeIcon
                    cursor="pointer"
                    onClick={handleHidePassword}
                    className="h-6 w-6"
                  />
                )
              }
              value={formik.values.password}
              onChange={formik.handleChange}
              name="password"
              error={formik.errors.password}
            />
            <div className="flex items-center justify-between px-1">
              <Checkbox label="Nhớ mật khẩu" />
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="cursor-pointer text-base font-semibold text-indigo-600 underline hover:text-indigo-700"
              >
                Quên mật khẩu?
              </button>
            </div>
            <Button
              isDisabled={!isEmpty(errors) || !dirty || isLoading}
              type="submit"
              className="h-14 text-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </Button>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-base text-gray-600">
                Bạn chưa có tài khoản?
              </span>
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="cursor-pointer text-base font-semibold text-indigo-600 underline hover:text-indigo-700"
              >
                Đăng ký tại đây
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
export default Login;
