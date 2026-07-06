import { api } from "./api";

export interface Dentist {
  dentistId: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
}

export const dentistApi = {
  /** Lấy danh sách tất cả bác sĩ kèm thông tin User (tên + SĐT) */
  getAll: () => api.get<Dentist[]>("/api/dentists"),
};
