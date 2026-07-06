import background from "@/assets/background.jpg";
import bg from "@/assets/bg.svg";
import logo from "@/assets/logo/logo.png";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { userApi } from "@/api/userApi";
import { useFormik } from "formik";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as Yup from "yup";

type Step = 1 | 2 | 3;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(300); // 5 phút đếm ngược
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Xử lý đếm ngược OTP
  useEffect(() => {
    if (step === 2) {
      setCountdown(300);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Bước 1: Nhập thông tin tài khoản
  const accountForm = useFormik({
    initialValues: { username: "", email: "", phoneNumber: "" },
    validationSchema: Yup.object({
      username: Yup.string()
        .required("Vui lòng nhập tên đăng nhập"),
      phoneNumber: Yup.string()
        .required("Vui lòng nhập số điện thoại"),
      email: Yup.string()
        .email("Email không hợp lệ")
        .required("Vui lòng nhập email đăng ký"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await userApi.forgotPassword(values.username, values.email, values.phoneNumber);
        setUsername(values.username);
        setEmail(values.email);
        setPhoneNumber(values.phoneNumber);
        Swal.fire({
          icon: "success",
          title: "Đã gửi mã OTP",
          text: "Vui lòng kiểm tra email của bạn để lấy mã OTP xác nhận.",
          timer: 2500,
        });
        setStep(2);
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Thất bại",
          text: err.response?.data?.message || "Thông tin tài khoản không chính xác.",
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Bước 2: Nhập OTP (mã 6 số)
  const otpForm = useFormik({
    initialValues: { otp: "" },
    validationSchema: Yup.object({
      otp: Yup.string()
        .matches(/^\d{6}$/, "Mã OTP phải gồm 6 chữ số")
        .required("Vui lòng nhập mã OTP"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const response = await userApi.verifyOtp(email, values.otp);
        setResetToken(response.data.resetToken);
        Swal.fire({
          icon: "success",
          title: "Xác thực thành công",
          text: "Mã OTP hợp lệ. Hãy tạo mật khẩu mới.",
          timer: 1500,
        });
        setStep(3);
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Lỗi xác thực",
          text: err.response?.data?.message || "Mã OTP không đúng hoặc hết hạn.",
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Gửi lại OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await userApi.forgotPassword(username, email, phoneNumber);
      setCountdown(300);
      Swal.fire({
        icon: "success",
        title: "Gửi lại thành công",
        text: "Mã OTP mới đã được gửi.",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err.response?.data?.message || "Không thể gửi lại OTP.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 3: Đặt mật khẩu mới
  const passwordForm = useFormik({
    initialValues: { password: "", rePassword: "" },
    validationSchema: Yup.object({
      password: Yup.string()
        .required("Vui lòng nhập mật khẩu mới")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
          "Mật khẩu ít nhất 8 ký tự: số, chữ thường, chữ HOA, và ký tự đặc biệt (!@#$%^&*)",
        ),
      rePassword: Yup.string()
        .oneOf([Yup.ref("password")], "Mật khẩu xác nhận không khớp")
        .required("Vui lòng xác nhận mật khẩu"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await userApi.resetPassword(resetToken, values.password);
        Swal.fire({
          icon: "success",
          title: "Hoàn tất",
          text: "Mật khẩu của bạn đã được thay đổi thành công.",
        });
        navigate("/login");
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: err.response?.data?.message || "Đã xảy ra lỗi khi đổi mật khẩu.",
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="grid h-full grid-cols-10 bg-gray-200">
      <div className="relative col-span-5 flex h-screen items-center justify-center">
        <div className="absolute left-1/2 top-1/2 max-w-lg -translate-x-1/2 -translate-y-1/2">
          <img src={bg} className="max-w-xl" />
        </div>
        <img src={background} className="h-full w-full" />
      </div>
      
      <div className="col-span-5 flex flex-col items-center justify-center gap-8 bg-white">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} className="mb-6 w-60" />
          <h1 className="text-3xl font-bold uppercase text-indigo-600">
            Khôi phục mật khẩu
          </h1>
          <p className="text-sm text-gray-500">
           {step === 1 && "Xác minh thông tin tài khoản để nhận mã OTP"}
            {step === 2 && `Mã OTP đã được gửi tới ${email}`}
            {step === 3 && "Thiết lập mật khẩu mới có độ bảo mật cao"}
          </p>
        </div>

        <div className="flex w-[450px] flex-col gap-6 text-lg">
          {/* STEP 1: NHẬP THÔNG TIN TÀI KHOẢN */}
          {step === 1 && (
            <form onSubmit={accountForm.handleSubmit} className="flex flex-col gap-4">
              <Input
                placeholder="Tên đăng nhập"
                inputClass="py-4 !text-base"
                value={accountForm.values.username}
                onChange={accountForm.handleChange}
                name="username"
                error={accountForm.errors.username}
              />
              <Input
                placeholder="Số điện thoại"
                inputClass="py-4 !text-base"
                value={accountForm.values.phoneNumber}
                onChange={accountForm.handleChange}
                name="phoneNumber"
                error={accountForm.errors.phoneNumber}
              />
              <Input
                placeholder="Email đăng ký"
                inputClass="py-4 !text-base"
                value={accountForm.values.email}
                onChange={accountForm.handleChange}
                name="email"
                error={accountForm.errors.email}
              />
              <Button
                isDisabled={!accountForm.isValid || !accountForm.dirty || isLoading}
                type="submit"
                className="h-14 text-lg"
              >
                {isLoading ? "Đang xử lý..." : "Gửi mã OTP"}
              </Button>
            </form>
          )}

          {/* STEP 2: NHẬP OTP */}
          {step === 2 && (
            <form onSubmit={otpForm.handleSubmit} className="flex flex-col gap-4">
              <Input
                placeholder="Mã OTP 6 số"
                inputClass="py-4 text-center tracking-[10px] font-bold !text-2xl"
                value={otpForm.values.otp}
                onChange={otpForm.handleChange}
                name="otp"
                maxLength={6}
                error={otpForm.errors.otp}
              />
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-gray-500">
                  Mã OTP hết hạn sau: <b className="text-red-500">{formatTime(countdown)}</b>
                </span>
                <button
                  type="button"
                  disabled={countdown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className={`font-semibold underline ${
                    countdown > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-700"
                  }`}
                >
                  Gửi lại mã
                </button>
              </div>
              <Button
                isDisabled={!otpForm.isValid || !otpForm.dirty || isLoading}
                type="submit"
                className="h-14 text-lg"
              >
                {isLoading ? "Đang xác thực..." : "Xác thực OTP"}
              </Button>
            </form>
          )}

          {/* STEP 3: NHẬP PASS MỚI */}
          {step === 3 && (
            <form onSubmit={passwordForm.handleSubmit} className="flex flex-col gap-4">
              <Input
                placeholder="Mật khẩu mới"
                type="password"
                inputClass="py-4 !text-base"
                value={passwordForm.values.password}
                onChange={passwordForm.handleChange}
                name="password"
                error={passwordForm.errors.password}
              />
              <Input
                placeholder="Xác nhận mật khẩu mới"
                type="password"
                inputClass="py-4 !text-base"
                value={passwordForm.values.rePassword}
                onChange={passwordForm.handleChange}
                name="rePassword"
                error={passwordForm.errors.rePassword}
              />
              <Button
                isDisabled={!passwordForm.isValid || !passwordForm.dirty || isLoading}
                type="submit"
                className="h-14 text-lg"
              >
                {isLoading ? "Đang lưu..." : "Đổi mật khẩu"}
              </Button>
            </form>
          )}

          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-base text-gray-500 hover:text-indigo-600 font-semibold underline"
            >
              Quay lại Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
