import { api } from "./api";

export interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface YearTransitionRequest {
  newYearName: string;
  startDate: string;
  endDate: string;
}

export interface TransitionResult {
  sessionId: string;
  oldYearId: number;
  newYearId: number;
  newYearName: string;
  promotedCount: number;
  graduatedCount: number;
  warnings: string[];
  success: boolean;
  message: string;
}

export const academicYearApi = {
  getAll: () => api.get<AcademicYear[]>("/api/academic-years").then(res => res.data),

  getById: (id: number) => api.get<AcademicYear>(`/api/academic-years/${id}`).then(res => res.data),

  getCurrentYear: () => api.get<AcademicYear>("/api/academic-years/current").then(res => res.data),

  create: (data: Partial<AcademicYear>) =>
    api.post<AcademicYear>("/api/academic-years", data).then(res => res.data),

  update: (id: number, data: Partial<AcademicYear>) =>
    api.put<AcademicYear>(`/api/academic-years/${id}`, data).then(res => res.data),

  delete: (id: number) => api.delete(`/api/academic-years/${id}`),

  validate: (currentYearId: number) =>
    api.post<string[]>(`/api/academic-years/validate/${currentYearId}`).then(res => res.data),

  transition: (request: YearTransitionRequest) =>
    api.post<TransitionResult>("/api/academic-years/transition", request).then(res => res.data),

  rollback: (sessionId: string) =>
    api.post<TransitionResult>(`/api/academic-years/rollback/${sessionId}`).then(res => res.data),
};
