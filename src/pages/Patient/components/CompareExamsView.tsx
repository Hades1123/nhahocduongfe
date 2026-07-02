import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import Card from "@/components/Card";
import Divider from "@/components/Dividers";
import Odontogram from "@/pages/DentalRecord/components/Odontogram";
import TeethOverall from "@/pages/DentalRecord/components/TeethOverall";
import moment from "moment";
import CompareTreatmentTable from "./CompareTreatmentTable";
import ImageUploadBox from "@/components/ImageUploadBox";

interface Props {
  patientId: string | number;
  examIds: string[]; // should be exactly 2 ids
}

export default function CompareExamsView({ patientId, examIds }: Props) {
  const [exam1, setExam1] = useState<any>(null);
  const [exam2, setExam2] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examIds.length !== 2) return;

    const fetchExams = async () => {
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          api.get(`/api/patients/${patientId}/exams/${examIds[0]}`),
          api.get(`/api/patients/${patientId}/exams/${examIds[1]}`),
        ]);

        const data1 = res1.data;
        const data2 = res2.data;

        // Sort by date (oldest first)
        const date1 = moment(data1.date, "YYYY-MM-DD");
        const date2 = moment(data2.date, "YYYY-MM-DD");

        if (date1.isBefore(date2)) {
          setExam1(data1);
          setExam2(data2);
        } else {
          setExam1(data2);
          setExam2(data1);
        }
      } catch (error) {
        console.error("Error fetching exams for comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [patientId, examIds]);

  if (loading || !exam1 || !exam2) {
    return <div className="p-4 text-center">Đang tải dữ liệu so sánh...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="text-center">
            <h2 className="text-lg font-bold text-indigo-700 bg-indigo-50 py-2 rounded-t-md">
               Phiếu cũ ({exam1.date})
            </h2>
         </div>
         <div className="text-center">
            <h2 className="text-lg font-bold text-teal-700 bg-teal-50 py-2 rounded-t-md">
               Phiếu mới ({exam2.date})
            </h2>
         </div>
      </div>

      <Card header="1. Tình trạng răng">
        <div className="flex flex-col gap-8">
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2">Phiếu cũ ({exam1.date})</h3>
              <div className="pointer-events-none opacity-90">
                 <Odontogram selectedTreatment={exam1.id} />
              </div>
           </div>
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2">Phiếu mới ({exam2.date})</h3>
              <div className="pointer-events-none opacity-90">
                 <Odontogram selectedTreatment={exam2.id} />
              </div>
           </div>
        </div>
      </Card>

      <Card header="2. Tình trạng vệ sinh răng miệng (OHI-S)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2 text-center">Phiếu cũ ({exam1.date})</h3>
              <div className="pointer-events-none">
                 <TeethOverall selectedExam={exam1.id} />
              </div>
           </div>
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2 text-center">Phiếu mới ({exam2.date})</h3>
              <div className="pointer-events-none">
                 <TeethOverall selectedExam={exam2.id} />
              </div>
           </div>
        </div>
      </Card>

      <Card header="3. Điều trị">
        <CompareTreatmentTable exam1Id={exam1.id} exam2Id={exam2.id} />
      </Card>

      <Card header="4. Đánh giá mức độ bệnh lý">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2">Phiếu cũ ({exam1.date})</h3>
              <p className="whitespace-pre-wrap">{exam1.pathologyAssessment || "Không có nội dung"}</p>
           </div>
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2">Phiếu mới ({exam2.date})</h3>
              <p className="whitespace-pre-wrap">{exam2.pathologyAssessment || "Không có nội dung"}</p>
           </div>
        </div>
      </Card>

      <Card header="5. Ghi chú điều trị">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2">Phiếu cũ ({exam1.date})</h3>
              <p className="whitespace-pre-wrap">{exam1.treatmentNote || "Không có nội dung"}</p>
           </div>
           <div className="border border-gray-200 p-4 rounded-md">
              <h3 className="font-semibold text-gray-600 mb-2">Phiếu mới ({exam2.date})</h3>
              <p className="whitespace-pre-wrap">{exam2.treatmentNote || "Không có nội dung"}</p>
           </div>
        </div>
      </Card>

      <Card header="6. Ảnh thực tế hàm trên và hàm dưới">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="border border-gray-200 p-4 rounded-md flex flex-col gap-4">
              <h3 className="font-semibold text-gray-600 mb-2 text-center">Phiếu cũ ({exam1.date})</h3>
              <div className="pointer-events-none">
                 <ImageUploadBox
                    label="Ảnh hàm trên"
                    folder="upper"
                    imageUrl={exam1.imageUpperUrl}
                    imageTime={exam1.imageUpperTime}
                    onUploaded={async () => {}}
                    onDeleted={async () => {}}
                 />
                 <div className="mt-4"></div>
                 <ImageUploadBox
                    label="Ảnh hàm dưới"
                    folder="lower"
                    imageUrl={exam1.imageLowerUrl}
                    imageTime={exam1.imageLowerTime}
                    onUploaded={async () => {}}
                    onDeleted={async () => {}}
                 />
              </div>
           </div>
           <div className="border border-gray-200 p-4 rounded-md flex flex-col gap-4">
              <h3 className="font-semibold text-gray-600 mb-2 text-center">Phiếu mới ({exam2.date})</h3>
              <div className="pointer-events-none">
                 <ImageUploadBox
                    label="Ảnh hàm trên"
                    folder="upper"
                    imageUrl={exam2.imageUpperUrl}
                    imageTime={exam2.imageUpperTime}
                    onUploaded={async () => {}}
                    onDeleted={async () => {}}
                 />
                 <div className="mt-4"></div>
                 <ImageUploadBox
                    label="Ảnh hàm dưới"
                    folder="lower"
                    imageUrl={exam2.imageLowerUrl}
                    imageTime={exam2.imageLowerTime}
                    onUploaded={async () => {}}
                    onDeleted={async () => {}}
                 />
              </div>
           </div>
        </div>
      </Card>
    </div>
  );
}
