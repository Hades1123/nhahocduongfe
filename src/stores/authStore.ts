import { api } from "@/api/api";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import jwt_decode from "jwt-decode";
import { isAxiosError } from "axios";

type AuthStore = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
};

const checkAuthStatus = () => {
  const accessToken = localStorage.getItem("accessToken");
  return !!accessToken;
};

const setAuthStatus = (isAuthenticated: boolean, accessToken?: string) => {
  useAuthStore.setState({ isAuthenticated });

  if (isAuthenticated && accessToken) {
    localStorage.setItem("accessToken", accessToken);
  }
};

const useAuthStore = create<AuthStore, any>(
  devtools((set) => ({
    isAuthenticated: checkAuthStatus(),
    login: async (username: string, password: string) => {
      try {
        const response = await api.post("/api/auth/login", {
          username,
          password,
        });
        const token = response.data?.token;
        const decode: any = jwt_decode(token);
        const { username: userName } = decode || {};
        set({ isAuthenticated: true }, false, "useAuthStore/login");
        setAuthStatus(true, token);

        localStorage.setItem("username", userName);
      } catch (error) {
        if (isAxiosError(error)) {
          throw new Error(error.response?.data?.error || "Đăng nhập thất bại");
        } else {
          throw new Error("Đăng nhập thất bại");
        }
      }
    },
    guestLogin: async () => {
      try {
        const response = await api.post("/api/auth/guest-login");
        const token = response.data?.token;
        const decode: any = jwt_decode(token);
        const { username: userName } = decode || {};
        set({ isAuthenticated: true }, false, "useAuthStore/guestLogin");
        setAuthStatus(true, token);

        localStorage.setItem("username", userName);
      } catch (error) {
        if (isAxiosError(error)) {
          throw new Error(error.response?.data?.error || "Đăng nhập thất bại");
        } else {
          throw new Error("Đăng nhập thất bại");
        }
      }
    },
    logout: async () => {
      // Gọi API backend để ghi nhận thời điểm logout
      try {
        await api.post("/api/auth/logout");
      } catch (e) {
        // Bỏ qua lỗi, vẫn xóa token client
      }
      set({ isAuthenticated: false }, false, "useAuthStore/logout");
      setAuthStatus(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("username");
    },
  })),
);

setAuthStatus(checkAuthStatus());

export default useAuthStore;
