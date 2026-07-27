import Button from "@/components/Button";
import Input from "@/components/Input";
import { useFormik } from "formik";
import { useEffect, useState, useRef } from "react";
import { isEmpty } from "lodash";
import { decodeJwt } from "@/api/api";
import { userApi } from "@/api/userApi";
import Swal from "sweetalert2";
import * as Yup from "yup";
import useAuthStore from "@/stores/authStore";

interface Props {
  onSuccess?: () => void;
}

const ChangePasswordForm = ({ onSuccess }: Props) => {
  const [userInfo, setUserInfo] = useState<{
    id: number;
    username: string;
    email: string;
    phoneNumber: string;
  } | null>(null);

  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Lấy thông tin user hiện tại khi mở Modal
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) return;

      try {
        const decoded = decodeJwt(token);
        const userId = decoded?.sub;
        if (userId) {
          const response = await userApi.getById(Number(userId));
          setUserInfo({
            id: response.data.id,
            username: response.data.username,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user đăng nhập:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Xử lý countdown gửi lại OTP
  useEffect(() => {
    if (countdown > 0) {
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
  }, [countdown]);

  // Che chắn email để bảo mật (ví dụ: admin@gmail.com -> ad***@gmail.com)
  const maskEmail = (emailStr: string) => {
    if (!emailStr) return "";
    const [name, domain] = emailStr.split("@");
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.substring(0, 2)}***@${domain}`;
  };

  // Gửi mã OTP
  const handleSendOtp = async () => {
    if (!userInfo) return;
    setIsSendingOtp(true);
    try {
      await userApi.changePasswordSendOtp(userInfo.username, userInfo.email, userInfo.phoneNumber);
      setIsOtpSent(true);
      setCountdown(60); // 60 giây gửi lại
      Swal.fire({
        icon: "success",
        title: "Đã gửi mã OTP",
        text: `Mã OTP xác thực đã được gửi tới email ${maskEmail(userInfo.email)}.`,
        timer: 3000,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err.response?.data?.message || "Không thể gửi OTP. Vui lòng kiểm tra cấu hình SMTP.",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .matches(/^\d{6}$/, "Mã OTP phải gồm đúng 6 chữ số")
      .required("Vui lòng nhập mã OTP"),
    password: Yup.string()
      .required("Vui lòng nhập mật khẩu mới")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm số, chữ thường, chữ HOA, và ký tự đặc biệt (!@#$%^&*)",
      ),
    rePassword: Yup.string()
      .oneOf([Yup.ref("password")], "Mật khẩu xác nhận không khớp")
      .required("Vui lòng xác nhận mật khẩu mới"),
  });

  const formik = useFormik({
    initialValues: {
      otp: "",
      password: "",
      rePassword: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      if (!userInfo) return;
      setIsLoading(true);
      try {
        // 1. Xác thực OTP để lấy resetToken
        const verifyRes = await userApi.verifyOtp(userInfo.email, values.otp);
        const resetToken = verifyRes.data.resetToken;

        // 2. Thực hiện đổi mật khẩu bằng resetToken
        await userApi.resetPassword(resetToken, values.password);

        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đổi mật khẩu thành công!",
        });
        if (onSuccess) onSuccess();
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Thất bại",
          text: err.response?.data?.message || "Đã xảy ra lỗi khi thực hiện đổi mật khẩu.",
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const { dirty, errors } = formik;

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {userInfo && (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-md border text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Tên tài khoản:</span>
            <span>{userInfo.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Email liên kết:</span>
            <span>{maskEmail(userInfo.email)}</span>
          </div>
        </div>
      )}

      {/* Button gửi OTP */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Cần xác nhận mã OTP trước khi thay đổi mật khẩu
        </span>
        <Button
          type="button"
          onClick={handleSendOtp}
          isDisabled={!userInfo || countdown > 0 || isSendingOtp}
          className="h-10 px-4 text-xs !bg-indigo-600 hover:!bg-indigo-700"
        >
          {isSendingOtp
            ? "Đang gửi..."
            : countdown > 0
            ? `Gửi lại sau (${countdown}s)`
            : isOtpSent
            ? "Gửi lại OTP"
            : "Gửi mã OTP"}
        </Button>
      </div>

      {/* Ô nhập OTP */}
      <div className="grid grid-cols-3 items-center gap-4">
        <div className="font-semibold text-sm text-gray-700">Mã xác thực OTP:</div>
        <div className="col-span-2">
          <Input
            value={formik.values.otp}
            onChange={formik.handleChange}
            name="otp"
            placeholder="Nhập mã OTP 6 chữ số"
            maxLength={6}
            disabled={!isOtpSent}
            error={formik.errors.otp}
          />
        </div>
      </div>

      {/* Ô nhập mật khẩu mới */}
      <div className="grid grid-cols-3 items-center gap-4">
        <div className="font-semibold text-sm text-gray-700">Mật khẩu mới:</div>
        <div className="col-span-2">
          <Input
            value={formik.values.password}
            onChange={formik.handleChange}
            name="password"
            type="password"
            placeholder="Nhập mật khẩu mới"
            error={formik.errors.password}
          />
        </div>
      </div>

      {/* Ô nhập lại mật khẩu mới */}
      <div className="grid grid-cols-3 items-center gap-4">
        <div className="font-semibold text-sm text-gray-700">Xác nhận mật khẩu:</div>
        <div className="col-span-2">
          <Input
            value={formik.values.rePassword}
            onChange={formik.handleChange}
            name="rePassword"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            error={formik.errors.rePassword}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex justify-end">
        <Button
          isDisabled={!isEmpty(errors) || !dirty || isLoading || !isOtpSent}
          type="submit"
          className="h-12 px-6 text-sm"
        >
          {isLoading ? "Đang xử lý..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
