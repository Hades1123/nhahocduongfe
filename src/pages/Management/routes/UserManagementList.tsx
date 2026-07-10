import { TableColumn } from "@/components/Table/type";
import {
  PencilSquareIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useCallback } from "react";
import { Tooltip } from "@mui/material";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import Table from "@/components/Table";
import Swal from "sweetalert2";
import UserInformationForm from "../components/UserInformationForm";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { getLocalUserInfo } from "@/utils/storage";
import { userApi } from "@/api/userApi";

const statusOptions = [
  { value: null, label: "Trạng thái (tất cả)" },
  { value: "active", label: "Hoạt động" },
  { value: "locked", label: "Đã khóa" },
];

const columns: TableColumn[] = [
  {
    title: "STT",
    dataIndex: "stt",
  },
  {
    title: "Tài khoản",
    dataIndex: "username",
  },
  {
    title: "Họ và tên",
    dataIndex: "fullName",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
  },
  {
    title: "Trạng thái",
    dataIndex: "statusText",
  },
  {
    title: "Thao tác",
    dataIndex: "action",
  },
];

const UserManagementList = () => {
  const [curPage, setCurPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [isOpenForm, setIsOpenForm] = useState<boolean>(false);
  const [dataFetching, setDataFetching] = useState<any[]>([]);
  const [reFetching, setReFetching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<any>(statusOptions[0]);
  const userInfor = getLocalUserInfo();
  const organizationType = userInfor?.organization?.type;
  const [tableLoading, setTableLoading] = useState<boolean>(false);

  const fetchUsers = useCallback(
    async (page: number, search?: string, status?: any) => {
      try {
        setTableLoading(true);
        const res = await userApi.getAll();
        if (res.status === 200) {
          let data = res.data;
          if (search) {
            const s = search.toLowerCase();
            data = data.filter(
              (u: any) =>
                (u.username || "").toLowerCase().includes(s) ||
                (u.email || "").toLowerCase().includes(s) ||
                (u.phoneNumber || "").toLowerCase().includes(s) ||
                `${u.lastName || ""} ${u.firstName || ""}`
                  .toLowerCase()
                  .includes(s),
            );
          }
          if (status && status.value) {
            if (status.value === "active") {
              data = data.filter((u: any) => u.status !== false);
            } else if (status.value === "locked") {
              data = data.filter((u: any) => u.status === false);
            }
          }
          setTotalPage(Math.ceil(data.length / 10) || 1);
          setDataFetching(data.slice((page - 1) * 10, page * 10));
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setTableLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchUsers(curPage, searchText, statusFilter);
  }, [curPage, reFetching, fetchUsers]);

  const handleSearch = () => {
    setCurPage(1);
    fetchUsers(1, searchText, statusFilter);
  };

  const handleStatusChange = (option: any) => {
    setStatusFilter(option);
    setCurPage(1);
    fetchUsers(1, searchText, option);
  };

  const dataSource = dataFetching.map((data: any, idx: number) => ({
    stt: (curPage - 1) * 10 + idx + 1,
    username: data.username || "-",
    fullName: `${data.lastName || ""} ${data.firstName || ""}`.trim() || "-",
    email: data.email || "-",
    phoneNumber: data.phoneNumber || "-",
    statusText: data.status !== false ? "Hoạt động" : "Đã khóa",
    action: (
      <span className="flex justify-center gap-4">
        <Tooltip title="Chỉnh sửa" placement="top">
          <PencilSquareIcon
            className="h-6 w-6 cursor-pointer text-blue-600 hover:text-blue-800"
            onClick={() => handleUpdate(data.id)}
          />
        </Tooltip>
        {!organizationType && data.status !== false && (
          <Tooltip title="Khóa" placement="top">
            <LockClosedIcon
              className="h-6 w-6 cursor-pointer text-red-600 hover:text-red-800"
              onClick={() => handleLockUser(data.id, data.username)}
            />
          </Tooltip>
        )}
        {!organizationType && data.status === false && (
          <Tooltip title="Mở khóa" placement="top">
            <LockOpenIcon
              className="h-6 w-6 cursor-pointer text-green-600 hover:text-green-800"
              onClick={() => handleUnlockUser(data.id, data.username)}
            />
          </Tooltip>
        )}
      </span>
    ),
  }));

  const paging = () => {
    const pageIdx = [];
    for (let i = 0; i < totalPage; i++) {
      pageIdx.push(
        <a
          key={i}
          onClick={() => setCurPage(i + 1)}
          aria-current="page"
          className={
            curPage === i + 1
              ? "relative z-10 inline-flex items-center bg-indigo-600 dark:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0"
          }
        >
          {i + 1}
        </a>,
      );
    }
    return pageIdx;
  };

  const handleLockUser = (id: number, username: string) => {
    Swal.fire({
      html: "Bạn có muốn khóa người dùng " + `<b>${username}</b>` + " không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Khóa",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        userApi
          .lock(id)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Khóa người dùng thành công!",
            }).then(() => setReFetching((prev) => !prev));
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              title: "Khóa người dùng không thành công!",
            });
          });
      }
    });
  };

  const handleUnlockUser = (id: number, username: string) => {
    Swal.fire({
      html:
        "Bạn có muốn mở khóa người dùng " + `<b>${username}</b>` + " không?",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Mở khóa",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        userApi
          .unlock(id)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Mở khóa người dùng thành công!",
            }).then(() => setReFetching((prev) => !prev));
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              title: "Mở khóa người dùng không thành công!",
            });
          });
      }
    });
  };

  const handleUpdate = (id: number) => {
    setSelectedUserId(id);
    setIsEdit(true);
    setIsOpenForm(true);
  };

  const handleCreate = () => {
    setSelectedUserId(undefined);
    setIsEdit(false);
    setIsOpenForm(true);
  };

  const handleFormSuccess = () => {
    setIsOpenForm(false);
    setReFetching((prev) => !prev);
  };

  return (
    <>
      <Modal
        isOpen={isOpenForm}
        setIsOpen={setIsOpenForm}
        onClose={() => setReFetching((prev) => !prev)}
        title={!isEdit ? "Tạo người dùng mới" : "Chỉnh sửa thông tin"}
        width={700}
      >
        <UserInformationForm
          userId={selectedUserId}
          isEdit={isEdit}
          onSuccess={handleFormSuccess}
        />
      </Modal>

      <div className="flex flex-col gap-8 sm:px-6">
        {!organizationType ? (
          <>
            <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
                <Input
                  className="w-full md:min-w-[450px] lg:max-w-[300px]"
                  placeholder="Nhập tài khoản, họ tên, email, SĐT"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <Select
                  className="w-full md:min-w-[180px] lg:max-w-[200px]"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={handleStatusChange}
                />
                <Button onClick={handleSearch} className="w-full lg:w-auto">Tìm kiếm</Button>
              </div>
              <div className="flex mt-2 lg:mt-0 lg:justify-end">
                <Button onClick={handleCreate} className="w-full lg:w-auto">Tạo mới người dùng</Button>
              </div>
            </div>
          </>
        ) : null}
        <Card>
          <Table
            columns={columns}
            dataSource={dataSource}
            loading={tableLoading}
          />
        </Card>

        {/* Pagination */}
        {!organizationType && totalPage > 1 && (
          <div className="flex cursor-pointer items-center justify-between border-t border-gray-200 bg-transparent px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <a
                onClick={() =>
                  curPage === 1 ? {} : setCurPage((old) => old - 1)
                }
                className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Previous
              </a>
              <a
                onClick={() =>
                  curPage === totalPage ? {} : setCurPage((old) => old + 1)
                }
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Next
              </a>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <a
                    onClick={() =>
                      curPage === 1 ? {} : setCurPage((old) => old - 1)
                    }
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-slate-500 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  {paging()}
                  <a
                    onClick={() =>
                      curPage === totalPage ? {} : setCurPage((old) => old + 1)
                    }
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-slate-500 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagementList;
