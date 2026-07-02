import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { useParams } from "react-router-dom";
import moment from "moment";

interface Props {
  exam1Id: string | number;
  exam2Id: string | number;
}

export default function CompareTreatmentTable({ exam1Id, exam2Id }: Props) {
  const { id: patientId } = useParams();
  const [data1, setData1] = useState<any[]>([]);
  const [data2, setData2] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exam1Id || !exam2Id) return;

    const fetchTreatments = async () => {
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          api.get(`/api/patients/${patientId}/exams/${exam1Id}/treatmentRecord`),
          api.get(`/api/patients/${patientId}/exams/${exam2Id}/treatmentRecord`),
        ]);
        setData1(res1.data || []);
        setData2(res2.data || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phiếu điều trị:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTreatments();
  }, [exam1Id, exam2Id, patientId]);

  if (loading) {
    return <div className="text-center py-4">Đang tải phiếu điều trị...</div>;
  }

  // Merge the teeth that have treatments in either exam
  const allTeeth = new Set<string>();
  data1.forEach((t) => { if (t.tooth) allTeeth.add(t.tooth); });
  data2.forEach((t) => { if (t.tooth) allTeeth.add(t.tooth); });

  const teethArray = Array.from(allTeeth).sort((a, b) => parseInt(a) - parseInt(b));

  // If no treatments at all
  if (teethArray.length === 0) {
    return <div className="text-center py-4 text-gray-500">Không có dữ liệu điều trị ở cả 2 phiếu.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header Row */}
      <div className="grid grid-cols-12 gap-4 border-b pb-2 font-semibold text-gray-700 bg-gray-50 rounded-t-md p-3 text-sm md:text-base">
        <div className="col-span-2 text-center flex items-center justify-center">Răng</div>
        <div className="col-span-5 text-center border-l border-gray-200 pl-4 text-indigo-700">Phiếu cũ</div>
        <div className="col-span-5 text-center border-l border-gray-200 pl-4 text-teal-700">Phiếu mới</div>
      </div>

      {/* Body Rows */}
      {teethArray.map((tooth) => {
        // Find treatments for this tooth
        const treats1 = data1.filter((t) => t.tooth === tooth);
        const treats2 = data2.filter((t) => t.tooth === tooth);

        return (
          <div key={tooth} className="grid grid-cols-12 gap-4 border-b border-gray-100 py-3 px-3 hover:bg-gray-50 transition-colors">
            {/* Cột 1: Răng */}
            <div className="col-span-2 flex items-center justify-center font-bold text-lg text-gray-800">
              {tooth}
            </div>

            {/* Cột 2: Phiếu cũ */}
            <div className="col-span-5 border-l border-gray-200 pl-4 flex flex-col gap-2">
              {treats1.length > 0 ? (
                treats1.map((t, idx) => (
                  <div key={idx} className="bg-indigo-50 p-2 rounded-md text-sm border border-indigo-100 flex flex-col gap-1">
                    <div><span className="font-semibold text-indigo-800">Ngày:</span> {t.createdDate || "—"}</div>
                    <div><span className="font-semibold text-indigo-800">CĐ:</span> {t.diagnosis || t.diagnose || "—"}</div>
                    <div><span className="font-semibold text-indigo-800">ĐT:</span> {t.service || "—"}</div>
                    <div><span className="font-semibold text-indigo-800">Bác sĩ:</span> {t.dentistName || t.doctorName || "—"}</div>
                    <div><span className="font-semibold text-indigo-800">Thuốc:</span> {t.medication || "—"}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm italic text-center py-2">—</div>
              )}
            </div>

            {/* Cột 3: Phiếu mới */}
            <div className="col-span-5 border-l border-gray-200 pl-4 flex flex-col gap-2">
              {treats2.length > 0 ? (
                treats2.map((t, idx) => (
                  <div key={idx} className="bg-teal-50 p-2 rounded-md text-sm border border-teal-100 flex flex-col gap-1">
                    <div><span className="font-semibold text-teal-800">Ngày:</span> {t.createdDate || "—"}</div>
                    <div><span className="font-semibold text-teal-800">CĐ:</span> {t.diagnosis || t.diagnose || "—"}</div>
                    <div><span className="font-semibold text-teal-800">ĐT:</span> {t.service || "—"}</div>
                    <div><span className="font-semibold text-teal-800">Bác sĩ:</span> {t.dentistName || t.doctorName || "—"}</div>
                    <div><span className="font-semibold text-teal-800">Thuốc:</span> {t.medication || "—"}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm italic text-center py-2">—</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
