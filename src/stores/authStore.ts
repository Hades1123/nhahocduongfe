import { api } from "@/api/api";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import jwt_decode from "jwt-decode";
import { isAxiosError } from "axios";

type AuthStore = {
  accessToken: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (username: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
};

type TokenResponse = {
  accessToken?: string;
  token?: string;
};

type JwtClaims = {
  username?: string;
};

const setAuthSession = (
  accessToken: string | null,
  username?: string | null,
) => {
  useAuthStore.setState({
    accessToken,
    username: username ?? null,
    isAuthenticated: !!accessToken,
  });
};

const storeTokens = (responseData: TokenResponse) => {
  const accessToken = responseData?.accessToken ?? responseData?.token ?? "";

  if (accessToken) {
    setAuthSession(accessToken);
  }

  return accessToken;
};

const useAuthStore = create<AuthStore>()(
  devtools((set) => ({
    accessToken: null,
    username: null,
    isAuthenticated: false,
    isBootstrapping: false,
    setAccessToken: (token: string | null) => setAuthSession(token),
    login: async (username: string, password: string) => {
      try {
        const response = await api.post("/api/auth/login", {
          username,
          password,
        });
        const token = storeTokens(response.data);
        const decode = jwt_decode<JwtClaims>(token);
        const userName = decode?.username ?? null;
        setAuthSession(token, userName);
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
        const token = storeTokens(response.data);
        const decode = jwt_decode<JwtClaims>(token);
        const userName = decode?.username ?? null;
        setAuthSession(token, userName);
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
      setAuthSession(null, null);
    },
    initializeAuth: async () => {
      set({ isBootstrapping: true }, false, "useAuthStore/initializeAuth:start");

      try {
        const response = await api.post("/api/auth/refresh");
        const token = storeTokens(response.data);

        if (token) {
          const decode = jwt_decode<JwtClaims>(token);
          setAuthSession(token, decode?.username ?? null);
          return;
        }

        setAuthSession(null, null);
      } catch (error) {
        setAuthSession(null, null);
      } finally {
        set({ isBootstrapping: false }, false, "useAuthStore/initializeAuth:end");
      }
    },
  })),
);

export default useAuthStore;
