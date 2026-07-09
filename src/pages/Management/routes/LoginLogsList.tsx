import { TableColumn } from "@/components/Table/type";
import { useEffect, useState, useCallback } from "react";
import Card from "@/components/Card";
import Table from "@/components/Table";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { DateRangePicker, DatePicker } from "rsuite";
import moment from "moment";
import { userApi } from "@/api/userApi";
import { useIsMobile } from "@/hooks/useIsMobile";

const statusOptions = [
  { value: null, label: "Trạng thái (tất cả)" },
  { value: "logged_in", label: "Đã đăng nhập" },
  { value: "logged_out", label: "Đã đăng xuất" },
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
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
  },
  {
    title: "Thời gian đăng nhập",
    dataIndex: "loginTime",
  },
  {
    title: "Thời gian đăng xuất",
    dataIndex: "logoutTime",
  },
  {
    title: "Trạng thái",
    dataIndex: "statusText",
  },
];

const LoginLogsList = () => {
  const [curPage, setCurPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [dataFetching, setDataFetching] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [loginTimeRange, setLoginTimeRange] = useState<any>([null, null]);
  const [statusFilter, setStatusFilter] = useState<any>(statusOptions[0]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const isMobile = useIsMobile();

  const fetchLogs = useCallback(
    async (page: number, search?: string, dateRange?: any, status?: any, from?: Date | null, to?: Date | null, mobile?: boolean) => {
      try {
        setTableLoading(true);
        const res = await userApi.getLoginLogs();
        if (res.status === 200) {
          let data = res.data;
          if (search) {
            const s = search.toLowerCase();
            data = data.filter(
              (log: any) =>
                (log.username || "").toLowerCase().includes(s) ||
                (log.phoneNumber || "").toLowerCase().includes(s),
            );
          }
          if (mobile) {
            if (from) {
              const startDate = moment(from).startOf("day");
              data = data.filter((log: any) => {
                if (!log.loginTime) return false;
                const loginDate = moment(log.loginTime);
                return loginDate.isSameOrAfter(startDate);
              });
            }
            if (to) {
              const endDate = moment(to).endOf("day");
              data = data.filter((log: any) => {
                if (!log.loginTime) return false;
                const loginDate = moment(log.loginTime);
                return loginDate.isSameOrBefore(endDate);
              });
            }
          } else {
            if (dateRange && dateRange[0] && dateRange[1]) {
              const startDate = moment(dateRange[0]).startOf("day");
              const endDate = moment(dateRange[1]).endOf("day");
              data = data.filter((log: any) => {
                if (!log.loginTime) return false;
                const loginDate = moment(log.loginTime);
                return loginDate.isBetween(startDate, endDate, null, "[]");
              });
            }
          }
          if (status && status.value) {
            if (status.value === "logged_in") {
              data = data.filter((log: any) => !log.logoutTime);
            } else if (status.value === "logged_out") {
              data = data.filter((log: any) => log.logoutTime);
            }
          }
          setTotalPage(Math.ceil(data.length / 10) || 1);
          setDataFetching(data.slice((page - 1) * 10, page * 10));
        }
      } catch (err) {
        console.error("Failed to fetch login logs:", err);
      } finally {
        setTableLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchLogs(curPage, searchText, loginTimeRange, statusFilter, fromDate, toDate, isMobile);
  }, [curPage, fetchLogs, fromDate, toDate, isMobile]);

  const handleSearch = () => {
    setCurPage(1);
    fetchLogs(1, searchText, loginTimeRange, statusFilter, fromDate, toDate, isMobile);
  };

  const handleStatusChange = (option: any) => {
    setStatusFilter(option);
    setCurPage(1);
    fetchLogs(1, searchText, loginTimeRange, option, fromDate, toDate, isMobile);
  };

  const handleDateRangeOk = (values: any) => {
    if (values) {
      setLoginTimeRange(values);
      setCurPage(1);
      fetchLogs(1, searchText, values, statusFilter, fromDate, toDate, isMobile);
    }
  };

  const handleDateRangeClean = () => {
    setLoginTimeRange([null, null]);
    setCurPage(1);
    fetchLogs(1, searchText, [null, null], statusFilter, fromDate, toDate, isMobile);
  };

  const handleCleanDateMobile = () => {
    setFromDate(null);
    setToDate(null);
    setCurPage(1);
  };

  const dataSource = dataFetching.map((data: any, idx: number) => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    const renderStatus = () => {
      if (data.logoutTime) {
        return <span className="font-medium text-red-500">Đã đăng xuất</span>;
      }
      return <span className="font-medium text-green-600">Đã đăng nhập</span>;
    };

    return {
      stt: (curPage - 1) * 10 + idx + 1,
      username: data.username || "-",
      phoneNumber: data.phoneNumber || "-",
      loginTime: formatDate(data.loginTime),
      logoutTime: formatDate(data.logoutTime),
      statusText: renderStatus(),
    };
  });

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
              ? "relative z-10 inline-flex cursor-pointer items-center bg-indigo-600 dark:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              : "relative inline-flex cursor-pointer items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
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
          placeholder="Nhập tên tài khoản hoặc SĐT"
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
          <div className="w-full lg:w-auto">
            <DateRangePicker
              style={{ width: "100%", maxWidth: "280px" }}
              placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
              format={"dd/MM/yyyy"}
              onChange={(e) => setLoginTimeRange(e)}
              onClean={handleDateRangeClean}
              onOk={handleDateRangeOk}
              placement="auto"
              value={loginTimeRange}
            />
          </div>
        )}
        <Button onClick={handleSearch} className="w-full lg:w-auto">Tìm kiếm</Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={tableLoading}
        />
      </Card>

      {totalPage > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white dark:bg-slate-800 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <a
              onClick={() =>
                curPage === 1 ? {} : setCurPage((old) => old - 1)
              }
              className="relative inline-flex cursor-pointer items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Previous
            </a>
            <a
              onClick={() =>
                curPage === totalPage ? {} : setCurPage((old) => old + 1)
              }
              className="relative ml-3 inline-flex cursor-pointer items-center rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
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
                  className="relative inline-flex cursor-pointer items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-slate-500 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  <span className="sr-only">Previous</span>
                  &lt;
                </a>
                {paging()}
                <a
                  onClick={() =>
                    curPage === totalPage ? {} : setCurPage((old) => old + 1)
                  }
                  className="relative inline-flex cursor-pointer items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-slate-500 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  <span className="sr-only">Next</span>
                  &gt;
                </a>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginLogsList;
