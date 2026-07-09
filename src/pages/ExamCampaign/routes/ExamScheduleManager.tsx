import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import { dentistApi, Dentist } from "@/api/dentistApi";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import {
  ArrowLeftIcon,
  TrashIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import { IExamCampaign, IExamSchedule } from "../type";

const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────
   Dentist option type
   ───────────────────────────────────────────── */
interface DentistOption {
  value: number;
  label: string;
  fullName: string;
  phoneNumber: string;
}

/* ─────────────────────────────────────────────
   Table columns
   ───────────────────────────────────────────── */
const columns: TableColumn[] = [
  { title: "STT", dataIndex: "stt" },
  { title: "Trường", dataIndex: "organizationName" },
  { title: "Lớp", dataIndex: "schoolClass" },
  { title: "Ngày khám", dataIndex: "examDate" },
  { title: "Bác sĩ", dataIndex: "dentistDisplay" },
  { title: "Thao tác", dataIndex: "action", isAction: true },
];

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
const ExamScheduleManager = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  // ── Form states ──
  const [campaign, setCampaign] = useState<IExamCampaign | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(
    null,
  );
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolOption, setSelectedSchoolOption] = useState<any>(null);
  const [classOptions, setClassOptions] = useState<any[]>([]);
  const [selectedClassOption, setSelectedClassOption] = useState<any>(null);
  const [examDate, setExamDate] = useState("");

  // ── Dentist states ──
  const [dentistOptions, setDentistOptions] = useState<DentistOption[]>([]);
  const [selectedDentists, setSelectedDentists] = useState<DentistOption[]>([]);

  // ── Schedule list & pagination ──
  const [schedules, setSchedules] = useState<IExamSchedule[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);

  /* ============================================
     Data fetching
     ============================================ */
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

  /** Fetch danh sách bác sĩ từ bảng nhahocduong_dentist + user info */
  const fetchDentists = async () => {
    try {
      const res = await dentistApi.getAll();
      const list: Dentist[] = Array.isArray(res.data) ? res.data : [];
      console.log("Fetched dentists:", list);
      const options: DentistOption[] = list.map((d: Dentist) => {
        const displayLabel = d.phoneNumber
          ? `${d.fullName} - ${d.phoneNumber}`
          : d.fullName;
        return {
          value: d.dentistId,
          label: displayLabel,
          fullName: d.fullName,
          phoneNumber: d.phoneNumber || "",
        };
      });
      setDentistOptions(options);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async () => {
    try {
      setTableLoading(true);
      const res = await api.get<IExamSchedule[]>(
        `/api/exam-campaigns/${campaignId}/schedules`,
      );
      setSchedules(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      fetchProvinces();
      fetchSchools();
      fetchDentists();
      fetchSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  /* ============================================
     Derived filtering
     ============================================ */
  useEffect(() => {
    if (selectedProvince && selectedProvince.value) {
      const code = selectedProvince.value.code;
      const filtered = allSchools.filter((schoolOption) => {
        const schoolArea = schoolOption.value.areaCode || "";
        return schoolArea.startsWith(code) || schoolArea === code;
      });
      setSchools(filtered);
    } else {
      setSchools(allSchools);
    }
  }, [selectedProvince, allSchools]);

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
    } else {
      setClassOptions([]);
    }
  }, [selectedSchoolOption]);

  /* ============================================
     Dentist helpers
     ============================================ */
  const handleRemoveDentist = (item: DentistOption) => {
    setSelectedDentists((prev) => prev.filter((d) => d.value !== item.value));
  };

  /** Compact label cho Select: trả về fullName của dentist */
  const getDentistCompactLabel = (opt: DentistOption): string => {
    return opt.fullName;
  };

  const handleEditClick = (schedule: IExamSchedule) => {
    setEditingScheduleId(schedule.id || null);

    // Find school
    const schoolOpt = allSchools.find(
      (s) => s.value.id === schedule.organizationId,
    );

    // Find province
    if (schoolOpt && schoolOpt.value.areaCode) {
      const provOpt = provinces.find(
        (p) =>
          schoolOpt.value.areaCode.startsWith(p.value.code) ||
          schoolOpt.value.areaCode === p.value.code,
      );
      setSelectedProvince(provOpt || null);
    } else {
      setSelectedProvince(null);
    }

    setSelectedSchoolOption(schoolOpt || null);
    setSelectedClassOption(
      schedule.schoolClass
        ? { value: schedule.schoolClass, label: schedule.schoolClass }
        : null,
    );
    setExamDate(schedule.examDate || "");

    // Find dentists
    const selectedDents = (schedule.dentistIds || [])
      .map((id) => {
        return dentistOptions.find((opt) => opt.value === id);
      })
      .filter(Boolean) as DentistOption[];
    setSelectedDentists(selectedDents);
  };

  /* ============================================
     CRUD: Save schedule
     ============================================ */
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
        id: editingScheduleId || undefined,
        campaignId: Number(campaignId),
        organizationId: selectedSchoolOption.value.id,
        schoolClass: selectedClassOption.value,
        examDate: examDate,
        dentistIds: selectedDentists.map((d) => d.value),
      };

      await api.post(`/api/exam-campaigns/${campaignId}/schedules`, payload);
      Swal.fire({
        icon: "success",
        title: editingScheduleId
          ? "Cập nhật lịch khám thành công!"
          : "Lưu lịch khám thành công!",
        timer: 1500,
        showConfirmButton: false,
      });

      // Reset form
      setEditingScheduleId(null);
      setExamDate("");
      setSelectedClassOption(null);
      setSelectedDentists([]);
      fetchSchedules();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể lưu lịch khám!";
      Swal.fire({ icon: "error", title: "Lỗi", text: msg });
    }
  };

  /* ============================================
     CRUD: Delete schedule
     ============================================ */
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
          Swal.fire({ icon: "error", title: "Lỗi", text: msg });
        }
      }
    });
  };

  /* ============================================
     Build data source
     ============================================ */
  const fullDataSource = schedules.map((data, idx) => {
    //! Luôn map từ dentistIds sang dentistOptions để lấy tên + SĐT mới nhất
    //! Này chỉ hiển thị tên thôi cần gì làm dài dòng như vậy
    // const names: string[] = (data.dentistIds || []).map((id) => {
    //   const d = dentistOptions.find((opt) => opt.value === id);
    //   return d ? d.fullName : String(id);
    // });
    const names = data.dentistNames ?? [];
    const dentistDisplay =
      names.length === 0 ? (
        "—"
      ) : names.length === 1 ? (
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {names[0]}
        </span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {names.map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {name}
            </span>
          ))}
        </div>
      );

    return {
      stt: idx + 1,
      organizationName: data.organizationName || "—",
      schoolClass: data.schoolClass,
      examDate: data.examDate,
      dentistDisplay,
      action: (
        <div
          className="flex items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <PencilSquareIcon
            className="h-5 w-5 cursor-pointer text-blue-600 hover:text-blue-800"
            onClick={() => handleEditClick(data)}
            title="Chỉnh sửa"
          />
          <TrashIcon
            className="h-5 w-5 cursor-pointer text-red-600 hover:text-red-800"
            onClick={() =>
              handleDeleteSchedule(
                data.id!,
                data.schoolClass,
                data.organizationName || "",
              )
            }
            title="Xóa"
          />
        </div>
      ),
    };
  });

  /* ============================================
     Client-side pagination
     ============================================ */
  const totalPages = Math.max(1, Math.ceil(fullDataSource.length / PAGE_SIZE));
  const paginatedData = fullDataSource.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Reset page về 1 khi danh sách thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [schedules.length]);

  /* ============================================
     RENDER
     ============================================ */
  return (
    <div className="mt-5 flex flex-col gap-5 sm:px-6">
      {/* ── Header ── */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {/* ═══════════════ LEFT: Scheduling Form ═══════════════ */}
        <div className="lg:col-span-1 xl:col-span-1">
          <Card className="h-fit">
            <h2 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
              {editingScheduleId ? "Thay đổi lịch khám" : "Thêm lịch khám mới"}
            </h2>
            <form onSubmit={handleSaveSchedule} className="flex flex-col gap-4">
              <Select<any>
                label="Tỉnh/Thành phố"
                placeholder="Chọn tỉnh/thành phố"
                options={provinces}
                value={selectedProvince}
                onChange={(val) => {
                  setSelectedProvince(val);
                  setSelectedSchoolOption(null);
                  setSelectedClassOption(null);
                }}
              />

              <Select<any>
                label="Trường học"
                placeholder="Chọn trường học"
                options={schools}
                value={selectedSchoolOption}
                onChange={(val) => {
                  setSelectedSchoolOption(val);
                  setSelectedClassOption(null);
                }}
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

              {/* ── Dentist multi-select (compactMulti mode) ── */}
              <Select<DentistOption>
                label="Bác sĩ"
                placeholder="Chọn bác sĩ"
                options={dentistOptions}
                value={selectedDentists}
                onChange={(val) => setSelectedDentists(val || [])}
                multiple
                compactMulti
                getCompactLabel={getDentistCompactLabel}
                onRemoveItem={handleRemoveDentist}
              />

              <div className="mt-2 flex flex-col justify-end gap-2 sm:flex-row">
                {editingScheduleId && (
                  <button
                    type="button"
                    className="w-full whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
                    onClick={() => {
                      setEditingScheduleId(null);
                      setExamDate("");
                      setSelectedClassOption(null);
                      setSelectedDentists([]);
                    }}
                  >
                    Hủy
                  </button>
                )}
                <Button type="submit" className="w-full sm:w-auto">
                  {editingScheduleId ? "Lưu thay đổi" : "Lưu lịch"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* ═══════════════ RIGHT: Schedule List ═══════════════ */}
        <div className="lg:col-span-2 xl:col-span-3">
          <Card>
            <h2 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-900">
              Danh sách lịch khám của đợt
            </h2>
            <Table
              columns={columns}
              dataSource={paginatedData}
              loading={tableLoading}
              emptyText="Chưa có lịch khám nào được lập cho đợt khám này."
            />

            {/* {fullDataSource.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Chưa có lịch khám nào được lập cho đợt khám này.
              </div>
            )} */}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamScheduleManager;
