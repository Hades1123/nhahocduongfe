import useAuthStore from "@/stores/authStore";
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const decodeJwt = (token: string) => {
  if (!token) return null;
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(""),
  );

  return JSON.parse(jsonPayload);
};
// const API_URL = "https://nhahocduong.gpmn.net/";
const API_URL = import.meta.env.VITE_API_URL;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {},
  timeout: 15000,
  withCredentials: true,
});

const authApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {},
  timeout: 15000,
  withCredentials: true,
});

// Add JWT token to headers
const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

const clearAuthSession = () => {
  setAuthToken(null);
  useAuthStore.setState({
    accessToken: null,
    username: null,
    isAuthenticated: false,
  });
};

const redirectToLogin = () => {
  window.open("/login", "_self");
};

const isAuthEndpoint = (url?: string) =>
  !!url &&
  ["/api/auth/login", "/api/auth/guest-login", "/api/auth/refresh", "/api/auth/logout"].some(
    (endpoint) => url.includes(endpoint),
  );

let refreshTokenRequest: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  if (!refreshTokenRequest) {
    refreshTokenRequest = authApi
      .post("/api/auth/refresh")
      .then((response) => {
        const nextAccessToken =
          response.data?.accessToken ?? response.data?.token ?? "";

        if (!nextAccessToken) {
          return null;
        }

        useAuthStore.setState({
          accessToken: nextAccessToken,
          isAuthenticated: true,
        });
        setAuthToken(nextAccessToken);

        return nextAccessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshTokenRequest = null;
      });
  }

  return refreshTokenRequest;
};

// Add request interceptors
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      return config;
    }

    config.headers["Authorization"] = `Bearer ${accessToken}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isForbidden = error.response?.status === 403;

    if (
      !isForbidden ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      clearAuthSession();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

    return api(originalRequest);
  },
);

export { api, setAuthToken };
