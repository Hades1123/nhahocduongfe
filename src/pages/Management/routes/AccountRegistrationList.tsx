import { TableColumn } from "@/components/Table/type";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import {
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { Tooltip } from "@mui/material";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Table from "@/components/Table";
import Swal from "sweetalert2";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { DatePicker, DateRangePicker } from "rsuite";
import moment from "moment";
import { userApi } from "@/api/userApi";
import { useIsMobile } from "@/hooks/useIsMobile";

const accountTypeOptions = [
  { value: null, label: "Tất cả" },
  { value: "doctor", label: "Bác sĩ" },
  { value: "school", label: "Trường học" },
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
    title: "Loại tài khoản",
    dataIndex: "accountType",
  },
  {
    title: "Trường học",
    dataIndex: "schoolName",
  },
  {
    title: "Ngày đăng ký",
    dataIndex: "createdDate",
  },
  {
    title: "Thao tác",
    dataIndex: "action",
  },
];

const AccountRegistrationList = () => {
  const isMobile = useIsMobile();
  const [curPage, setCurPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [dataFetching, setDataFetching] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [createdDateRange, setCreatedDateRange] = useState<any>([null, null]);
  const [accountTypeFilter, setAccountTypeFilter] = useState<any>(
    accountTypeOptions[0],
  );
  //* State for mobile screen
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [reFetching, setReFetching] = useState<boolean>(false);
  const itemsPerPage = 10;
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  // Fetch waiting users from API
  const fetchRegistrations = useCallback(async () => {
    try {
      setTableLoading(true);
      const response = await userApi.getWaitingUsers();
      const users = response.data || [];
      setAllData(users);
    } catch (err) {
      console.error("Failed to fetch waiting users:", err);
      setAllData([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [reFetching, fetchRegistrations]);

  // Filter + paginate locally
  useEffect(() => {
    let filtered = allData;

    // Search filter
    if (searchQuery) {
      filtered = allData.filter(
        (item: any) =>
          (item.username || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          `${item.lastName || ""} ${item.firstName || ""}`
            .trim()
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (item.email || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (item.phoneNumber || "").includes(searchQuery),
      );
    }

    // Date range filter
    if (
      !isMobile &&
      createdDateRange &&
      createdDateRange[0] &&
      createdDateRange[1]
    ) {
      const startDate = moment(createdDateRange[0]).startOf("day");
      const endDate = moment(createdDateRange[1]).endOf("day");
      filtered = filtered.filter((item: any) => {
        if (!item.createdDate) return false;
        const created = moment(item.createdDate);
        return created.isBetween(startDate, endDate, null, "[]");
      });
    }

    // Date range for mobile screen
    if (isMobile && fromDate && toDate) {
      const startDate = moment(fromDate).startOf("day");
      const endDate = moment(toDate).endOf("day");
      filtered = filtered.filter((item: any) => {
        if (!item.createdDate) return false;
        const created = moment(item.createdDate);
        return created.isBetween(startDate, endDate, null, "[]");
      });
    }

    if (accountTypeFilter && accountTypeFilter.value) {
      // Account type filter
      filtered = filtered.filter((item: any) => {
        const typeKey = getAccountTypeKey(item);
        return typeKey === accountTypeFilter.value;
      });
    }

    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPage(total);

    const start = (curPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setDataFetching(filtered.slice(start, end));
  }, [
    allData,
    searchQuery,
    createdDateRange,
    accountTypeFilter,
    curPage,
    isMobile,
    fromDate,
    toDate,
  ]);

  const handleSearch = () => {
    setCurPage(1);
    setSearchQuery(searchText);
  };

  const handleDateRangeOk = (values: any) => {
    if (values) {
      setCreatedDateRange(values);
      setCurPage(1);
    }
  };

  const handleDateRangeClean = () => {
    setCreatedDateRange([null, null]);
    setCurPage(1);
  };

  //* clean date for mobile
  const handleCleanDateMobile = () => {
    setFromDate(null);
    setToDate(null);
    setCurPage(1);
  };

  const handleAccountTypeChange = (option: any) => {
    setAccountTypeFilter(option);
    setCurPage(1);
  };

  const handleApprove = (id: number, username: string) => {
    Swal.fire({
      html: "Bạn có muốn duyệt tài khoản " + `<b>${username}</b>` + " không?",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      confirmButtonText: "Duyệt",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        userApi
          .approve(id)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Duyệt tài khoản thành công!",
            }).then(() => setReFetching((prev) => !prev));
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              title: "Duyệt tài khoản thất bại!",
            });
          });
      }
    });
  };

  const handleReject = (id: number, username: string) => {
    Swal.fire({
      html:
        "Bạn có muốn từ chối và xóa tài khoản " +
        `<b>${username}</b>` +
        " không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        userApi
          .reject(id)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Từ chối và xóa tài khoản thành công!",
            }).then(() => setReFetching((prev) => !prev));
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              title: "Từ chối tài khoản thất bại!",
            });
          });
      }
    });
  };

  const getAccountTypeKey = (data: any): string | null => {
    const roleList = data.roleList || [];
    if (roleList.length === 0) {
      if (data.organization?.name) return "school";
      return null;
    }
    const hasSchoolRole = roleList.some(
      (r: any) =>
        r.code?.toUpperCase() === "GUEST" ||
        r.code?.toUpperCase() === "SCHOOL" ||
        r.name?.toLowerCase().includes("trường") ||
        r.name?.toLowerCase().includes("school"),
    );
    const hasDoctorRole = roleList.some(
      (r: any) =>
        r.code?.toUpperCase() === "DOCTOR" ||
        r.code?.toUpperCase() === "DENTIST" ||
        r.name?.toLowerCase().includes("bác sĩ") ||
        r.name?.toLowerCase().includes("nha sĩ") ||
        r.name?.toLowerCase().includes("nha khoa") ||
        r.name?.toLowerCase().includes("doctor") ||
        r.name?.toLowerCase().includes("dentist"),
    );
    if (hasSchoolRole) return "school";
    if (hasDoctorRole) return "doctor";
    return null;
  };

  const getAccountType = (data: any): string => {
    const roleList = data.roleList || [];
    if (roleList.length === 0) {
      // Fallback: nếu có organization thì đoán là Trường học
      if (data.organization?.name) return "Trường học";
      return "-";
    }
    // Kiểm tra role liên quan đến trường học (GUEST = Trường học)
    const hasSchoolRole = roleList.some(
      (r: any) =>
        r.code?.toUpperCase() === "GUEST" ||
        r.code?.toUpperCase() === "SCHOOL" ||
        r.name?.toLowerCase().includes("trường") ||
        r.name?.toLowerCase().includes("school"),
    );
    // Kiểm tra role liên quan đến bác sĩ / nha sĩ
    const hasDoctorRole = roleList.some(
      (r: any) =>
        r.code?.toUpperCase() === "DOCTOR" ||
        r.code?.toUpperCase() === "DENTIST" ||
        r.name?.toLowerCase().includes("bác sĩ") ||
        r.name?.toLowerCase().includes("nha sĩ") ||
        r.name?.toLowerCase().includes("nha khoa") ||
        r.name?.toLowerCase().includes("doctor") ||
        r.name?.toLowerCase().includes("dentist"),
    );
    if (hasSchoolRole) return "Trường học";
    if (hasDoctorRole) return "Bác sĩ";
    // Nếu không match pattern nào, hiển thị tên role đầu tiên
    return roleList[0]?.name || "-";
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const dataSource = dataFetching.map((data: any, idx: number) => ({
    stt: (curPage - 1) * itemsPerPage + idx + 1,
    username: data.username || "-",
    fullName: `${data.lastName || ""} ${data.firstName || ""}`.trim() || "-",
    email: data.email || "-",
    phoneNumber: data.phoneNumber || "-",
    accountType: getAccountType(data),
    schoolName:
      getAccountType(data) === "Trường học"
        ? data.organization?.name || "-"
        : "-",
    createdDate: formatDate(data.createdDate),
    action: (
      <span className="flex justify-center gap-4">
        <Tooltip title="Duyệt" placement="top">
          <CheckCircleIcon
            className="h-6 w-6 cursor-pointer text-green-600 hover:text-green-800"
            onClick={() => handleApprove(data.id, data.username)}
          />
        </Tooltip>
        <Tooltip title="Từ chối" placement="top">
          <XCircleIcon
            className="h-6 w-6 cursor-pointer text-red-600 hover:text-red-800"
            onClick={() => handleReject(data.id, data.username)}
          />
        </Tooltip>
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

  return (
    <div className="flex flex-col gap-8 sm:px-6">
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-center lg:gap-4">
        <Input
          className="w-full md:min-w-[450px] lg:max-w-[300px]"
          placeholder="Tìm tài khoản, họ tên, email, SĐT"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Select
          className="w-full md:min-w-[180px] lg:max-w-[200px]"
          options={accountTypeOptions}
          value={accountTypeFilter}
          onChange={handleAccountTypeChange}
        />
        {isMobile ? (
          <div>
            <div className="mb-2">
              <div>Từ ngày</div>
              <DatePicker
                style={{ width: "100%" }}
                value={fromDate}
                onChange={(value) => setFromDate(value)}
                onClean={handleCleanDateMobile}
              />
            </div>
            <div>
              <div>Đến ngày</div>
              <DatePicker
                style={{ width: "100%" }}
                value={toDate}
                onChange={(value) => setToDate(value)}
                onClean={handleCleanDateMobile}
              />
            </div>
          </div>
        ) : (
          <DateRangePicker
            style={{ width: "280px" }}
            placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
            format={"dd/MM/yyyy"}
            onChange={(e) => setCreatedDateRange(e)}
            onClean={handleDateRangeClean}
            onOk={handleDateRangeOk}
            placement="auto"
            value={createdDateRange}
          />
        )}
        <Button onClick={handleSearch}>Tìm kiếm</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={tableLoading}
        />
      </Card>

      {/* Pagination */}
      {totalPage > 1 && (
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
                {paging()}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountRegistrationList;
