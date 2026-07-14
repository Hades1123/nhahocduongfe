import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import {
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import Swal from "sweetalert2";
import CampaignFormModal from "../components/CampaignFormModal";
import { IExamCampaign, CampaignStatus } from "../type";
import { twMerge } from "tailwind-merge";

const columns: TableColumn[] = [
  { title: "STT", dataIndex: "stt" },
  { title: "Tên đợt khám", dataIndex: "name" },
  { title: "Trạng thái", dataIndex: "campaignStatusPill" },
  { title: "Ngày bắt đầu", dataIndex: "startDate" },
  { title: "Ngày kết thúc", dataIndex: "endDate" },
  { title: "Mô tả", dataIndex: "description" },
  { title: "Thao tác", dataIndex: "action", isAction: true },
];

const ExamCampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<IExamCampaign[]>([]);
  const [searchText, setSearchText] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<
    number | undefined
  >(undefined);

  // Table state
  const [tableLoading, setTableLoading] = useState<boolean>(false);

  const fetchCampaigns = async () => {
    setTableLoading(true);
    try {
      const res = await api.get<IExamCampaign[]>("/api/exam-campaigns");
      setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải danh sách đợt khám!",
      });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = () => {
    setSelectedCampaignId(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedCampaignId(id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    Swal.fire({
      title: "Xác nhận xóa?",
      html: `Bạn có chắc chắn muốn xóa đợt khám <b>${name}</b> không?`,
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
          await api.delete(`/api/exam-campaigns/${id}`);
          Swal.fire({
            icon: "success",
            title: "Đã xóa đợt khám thành công!",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchCampaigns();
        } catch (err: any) {
          const msg = err?.response?.data?.message || "Không thể xóa đợt khám!";
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: msg,
          });
        }
      }
    });
  };

  const getStatusPill = (status: CampaignStatus) => {
    let classes = "";
    switch (status) {
      case "Sắp tới":
        classes = "bg-yellow-50 text-yellow-800 ring-yellow-600/20";
        break;
      case "Đang diễn ra":
        classes = "bg-green-50 text-green-700 ring-green-600/20";
        break;
      case "Đã xong":
        classes = "bg-blue-50 text-blue-700 ring-blue-700/10";
        break;
      case "Đã hủy":
        classes = "bg-red-50 text-red-700 ring-red-600/10";
        break;
      default:
        classes = "bg-gray-50 text-gray-600 ring-gray-500/10";
    }

    return (
      <span
        className={twMerge(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
          classes,
        )}
      >
        {status}
      </span>
    );
  };

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchText.toLowerCase()),
  );

  const dataSource = filteredCampaigns.map((data, idx) => ({
    stt: idx + 1,
    name: data.name,
    campaignStatusPill: getStatusPill(data.campaignStatus),
    startDate: data.startDate,
    endDate: data.endDate,
    description: data.description || "—",
    action: (
      <span
        className="flex items-center justify-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Lập lịch" placement="top">
          <CalendarDaysIcon
            className="h-6 w-6 cursor-pointer text-indigo-600 hover:text-indigo-800"
            onClick={() => navigate(`/exam-campaign/${data.id}/schedule`)}
          />
        </Tooltip>
        <Tooltip title="Chỉnh sửa" placement="top">
          <PencilSquareIcon
            className="h-6 w-6 cursor-pointer text-blue-600 hover:text-blue-800"
            onClick={() => handleEdit(data.id!)}
          />
        </Tooltip>
        <Tooltip title="Xóa" placement="top">
          <TrashIcon
            className="h-6 w-6 cursor-pointer text-red-600 hover:text-red-800"
            onClick={() => handleDelete(data.id!, data.name)}
          />
        </Tooltip>
      </span>
    ),
  }));

  return (
    <div className="mt-5 flex flex-col gap-5 sm:px-6">
      {/* Header and Controls */}
      <div className="flex flex-col items-start justify-between gap-4 p-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Danh sách đợt khám
        </h1>
        <div className="grid grid-cols-2 gap-4 md:flex md:gap-2">
          <Button
            onClick={() => navigate("/exam-campaign/tracking")}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Theo dõi trạng thái
          </Button>
          <Button
            onClick={() => navigate("/exam-campaign/re-exams")}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            Lịch tái khám
          </Button>
          <Button onClick={handleCreate}>Thêm đợt khám mới</Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex max-w-md gap-3">
        <Input
          placeholder="Tìm kiếm đợt khám..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Campaign Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={tableLoading}
        />
        {dataSource.length === 0 && !tableLoading && (
          <div className="py-8 text-center text-gray-500 dark:text-slate-400">
            Không tìm thấy đợt khám nào.
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <CampaignFormModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        campaignId={selectedCampaignId}
        onSuccess={fetchCampaigns}
      />
    </div>
  );
};

export default ExamCampaignList;
