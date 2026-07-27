import { api } from "./api";
import { exportFile } from "@/utils/utils";

export const reportApi = {
  /** Xuất PDF phiếu khám của học sinh */
  downloadExamReportPdf: async (examId: number) => {
    const res = await api.get(`/api/exams/${examId}/report/pdf`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `phieu_kham_${examId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /** Xuất Excel tổng hợp tất cả các trường */
  downloadAllSchoolsExcel: async () => {
    const res = await api.get("/api/schools/export/excel", {
      responseType: "blob",
    });
    exportFile(res.data, "Tong_hop_cac_truong", "xlsx");
  },

  /** Xuất Excel danh sách học sinh của một trường */
  downloadSchoolStudentsExcel: async (schoolId: number, schoolName?: string) => {
    const res = await api.get(
      `/api/schools/${schoolId}/students/export/excel?schoolName=${encodeURIComponent(schoolName || "")}`,
      { responseType: "blob" },
    );
    exportFile(res.data, `DS_HocSinh_${schoolName || schoolId}`, "xlsx");
  },
};
