import { api } from "./api";
import { IUserInformation, IRole } from "@/pages/Management/type";

export interface UserSearchParams {
  searchText?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const userApi = {
  /** Tạo user mới — gọi POST /api/user/register */
  create: (data: Omit<IUserInformation, "id" | "rePassword">) => {
    const payload = {
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      birthDate: data.birthDate || null,
      organization: data.organizationId ? { id: data.organizationId } : null,
      roleList: data.roleIds?.length
        ? data.roleIds.map((id) => ({ id: String(id) }))
        : [],
    };
    return api.post("/api/user/register", payload);
  },

  /** Lấy danh sách user có phân trang + search */
  search: (params: UserSearchParams) => {
    const queryParams = new URLSearchParams();
    if (params.searchText) queryParams.append("searchText", params.searchText);
    if (params.page !== undefined)
      queryParams.append("page", String(params.page));
    if (params.size !== undefined)
      queryParams.append("size", String(params.size));
    if (params.sort) queryParams.append("sort", params.sort);
    return api.get<PageResponse<any>>(
      `/api/user/search?${queryParams.toString()}`,
    );
  },

  /** Lấy tất cả user */
  getAll: () => api.get<any[]>("/api/admin/users"),

  /** Khóa user */
  lock: (id: number) => api.put(`/api/admin/users/${id}/lock`),

  /** Mở khóa user */
  unlock: (id: number) => api.put(`/api/admin/users/${id}/unlock`),

  /** Lấy danh sách nhật ký đăng nhập */
  getLoginLogs: () => api.get<any[]>("/api/admin/login-logs"),

  /** Lấy user theo ID */
  getById: (id: number) => api.get(`/api/user/${id}`),

  /** Cập nhật user */
  update: (id: number, data: Partial<IUserInformation>) => {
    const payload: any = {};
    if (data.username) payload.username = data.username;
    if (data.password) payload.password = data.password;
    if (data.firstName) payload.firstName = data.firstName;
    if (data.lastName) payload.lastName = data.lastName;
    if (data.email) payload.email = data.email;
    if (data.phoneNumber) payload.phoneNumber = data.phoneNumber;
    if (data.birthDate) payload.birthDate = data.birthDate;
    if (data.organizationId !== undefined) {
      payload.organization = data.organizationId
        ? { id: data.organizationId }
        : null;
    }
    if (data.roleIds?.length) {
      payload.roleList = data.roleIds.map((rid) => ({ id: String(rid) }));
    }
    return api.put(`/api/user/${id}`, payload);
  },

  /** Xóa user (soft delete — set status = false) */
  delete: (id: number) => api.delete(`/api/user/${id}`),

  /** Lấy danh sách roles */
  getRoles: () => api.get<IRole[]>("/api/roles"),

  /** Lấy danh sách user đang chờ duyệt */
  getWaitingUsers: () => api.get<any[]>("/api/user/waiting"),

  /** Admin duyệt tài khoản */
  approve: (id: number) => api.put(`/api/user/${id}/approve`),

  /** Admin từ chối + xóa tài khoản */
  reject: (id: number) => api.delete(`/api/user/${id}/reject`),

  /** Đăng xuất — ghi nhận thời điểm logout */
  logout: () => api.post("/api/auth/logout"),

  /** Yêu cầu gửi mã OTP để đặt lại mật khẩu */
  forgotPassword: (username: string, email: string, phoneNumber: string) => 
    api.post("/api/auth/forgot-password", { username, email, phoneNumber }),

  /** Xác thực OTP và nhận token đặt lại mật khẩu */
  verifyOtp: (email: string, otp: string) => api.post("/api/auth/verify-otp", { email, otp }),

  /** Đặt lại mật khẩu mới bằng token */
  resetPassword: (resetToken: string, newPassword: string) => 
    api.post("/api/auth/reset-password", { resetToken, newPassword }),
};
