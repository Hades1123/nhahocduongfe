import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import { ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import { IExamCampaign, IExamSchedule } from "../type";

const columns: TableColumn[] = [
  { title: "STT", dataIndex: "stt" },
  { title: "Trường", dataIndex: "organizationName" },
  { title: "Lớp", dataIndex: "schoolClass" },
  { title: "Ngày khám", dataIndex: "examDate" },
  { title: "Thao tác", dataIndex: "action", isAction: true },
];

const ExamScheduleManager = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<IExamCampaign | null>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolOption, setSelectedSchoolOption] = useState<any>(null);
  const [classOptions, setClassOptions] = useState<any[]>([]);
  const [selectedClassOption, setSelectedClassOption] = useState<any>(null);
  const [examDate, setExamDate] = useState("");
  const [schedules, setSchedules] = useState<IExamSchedule[]>([]);

  // Fetch campaign info
  const fetchCampaign = async () => {
    try {
      const res = await api.get<IExamCampaign>(
        `/api/exam-campaigns/${campaignId}`,
      );
      setCampaign(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải thông tin đợt khám!",
      });
    }
  };

  // Fetch provinces
  const fetchProvinces = async () => {
    try {
      const res = await api.get("/api/areas/lookup?region=SOUTH");
      const list = res.data || [];
      const options = list
        .map((prov: any) => ({
          value: prov,
          label: prov.name.replace(
            /^(Tỉnh|Thành phố|Quận|Huyện|Phường|Xã)\s+/,
            "",
          ),
        }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label));
      setProvinces(options);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch schools using organization search
  const fetchSchools = async () => {
    try {
      const res = await api.get(
        "/api/organization/search?size=1000&sort=name,asc",
      );
      const list = res.data?.content || [];
      const options = list.map((school: any) => ({
        value: school,
        label: school.name,
      }));
      setAllSchools(options);
      setSchools(options);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải danh sách trường học!",
      });
    }
  };

  // Fetch current schedules for this campaign
  const fetchSchedules = async () => {
    try {
      const res = await api.get<IExamSchedule[]>(
        `/api/exam-campaigns/${campaignId}/schedules`,
      );
      setSchedules(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      fetchProvinces();
      fetchSchools();
      fetchSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Filter schools based on selected province
  useEffect(() => {
    if (selectedProvince && selectedProvince.value) {
      const code = selectedProvince.value.code;
      const filtered = allSchools.filter((schoolOption) => {
        const schoolArea = schoolOption.value.areaCode || "";
        return schoolArea.startsWith(code) || schoolArea === code;
      });
      setSchools(filtered);
      setSelectedSchoolOption(null);
    } else {
      setSchools(allSchools);
      setSelectedSchoolOption(null);
    }
  }, [selectedProvince, allSchools]);

  // Load classes of selected school
  useEffect(() => {
    if (selectedSchoolOption && selectedSchoolOption.value) {
      const school = selectedSchoolOption.value;
      const classesMap = school.classes || {};
      const flatClasses: string[] = Object.values(
        classesMap,
      ).flat() as string[];
      const sortedClasses = Array.from(
        new Set(flatClasses.filter(Boolean)),
      ).sort();
      const options = sortedClasses.map((cls) => ({
        value: cls,
        label: cls,
      }));
      setClassOptions(options);
      setSelectedClassOption(null);
    } else {
      setClassOptions([]);
      setSelectedClassOption(null);
    }
  }, [selectedSchoolOption]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolOption) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng chọn trường học!",
      });
      return;
    }
    if (!selectedClassOption) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng chọn lớp học!",
      });
      return;
    }
    if (!examDate) {
      Swal.fire({
        icon: "warning",
        title: "Cảnh báo",
        text: "Vui lòng chọn ngày khám!",
      });
      return;
    }

    try {
      const payload: IExamSchedule = {
        campaignId: Number(campaignId),
        organizationId: selectedSchoolOption.value.id,
        schoolClass: selectedClassOption.value,
        examDate: examDate,
      };

      await api.post(`/api/exam-campaigns/${campaignId}/schedules`, payload);
      Swal.fire({
        icon: "success",
        title: "Lưu lịch khám thành công!",
        timer: 1500,
        showConfirmButton: false,
      });
      setExamDate("");
      setSelectedClassOption(null);
      fetchSchedules();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể lưu lịch khám!";
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: msg,
      });
    }
  };

  const handleDeleteSchedule = (
    scheduleId: number,
    className: string,
    schoolName: string,
  ) => {
    Swal.fire({
      title: "Xác nhận xóa lịch?",
      html: `Bạn có chắc chắn muốn xóa lịch khám cho lớp <b>${className}</b> - <b>${schoolName}</b> không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(
            `/api/exam-campaigns/${campaignId}/schedules/${scheduleId}`,
          );
          Swal.fire({
            icon: "success",
            title: "Xóa lịch khám thành công!",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchSchedules();
        } catch (err: any) {
          const msg =
            err?.response?.data?.message || "Không thể xóa lịch khám!";
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: msg,
          });
        }
      }
    });
  };

  const dataSource = schedules.map((data, idx) => ({
    stt: idx + 1,
    organizationName: data.organizationName || "—",
    schoolClass: data.schoolClass,
    examDate: data.examDate,
    action: (
      <span
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <TrashIcon
          className="h-6 w-6 cursor-pointer text-red-600 hover:text-red-800"
          onClick={() =>
            handleDeleteSchedule(
              data.id!,
              data.schoolClass,
              data.organizationName || "",
            )
          }
        />
      </span>
    ),
  }));

  return (
    <div className="mt-5 flex flex-col gap-5 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/exam-campaign")}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lập lịch đợt khám: {campaign?.name || "..."}
          </h1>
          <p className="text-sm text-gray-500">
            Thời gian đợt khám: {campaign?.startDate} đến {campaign?.endDate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Scheduling Form */}
        <Card className="h-fit lg:col-span-1">
          <h2 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
            Thêm lịch khám mới
          </h2>
          <form onSubmit={handleSaveSchedule} className="flex flex-col gap-4">
            <Select<any>
              label="Tỉnh/Thành phố"
              placeholder="Chọn tỉnh/thành phố"
              options={provinces}
              value={selectedProvince}
              onChange={(val) => setSelectedProvince(val)}
            />

            <Select<any>
              label="Trường học"
              placeholder="Chọn trường học"
              options={schools}
              value={selectedSchoolOption}
              onChange={(val) => setSelectedSchoolOption(val)}
              disabled={!schools.length}
              required
            />

            <Select<any>
              label="Lớp học"
              placeholder="Chọn lớp học"
              options={classOptions}
              value={selectedClassOption}
              onChange={(val) => setSelectedClassOption(val)}
              disabled={!selectedSchoolOption}
              required
            />

            <Input
              label="Ngày khám"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />

            <div className="mt-4 flex justify-end">
              <Button type="submit" className="w-full">
                Lưu lịch
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Side: List of Schedules */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
            Danh sách lịch khám của đợt
          </h2>
          <Table columns={columns} dataSource={dataSource} />
          {dataSource.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              Chưa có lịch khám nào được lập cho đợt khám này.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ExamScheduleManager;
