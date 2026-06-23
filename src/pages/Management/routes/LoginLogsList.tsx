import { TableColumn } from "@/components/Table/type";
import { useEffect, useState, useCallback } from "react";
import Card from "@/components/Card";
import Table from "@/components/Table";
import { userApi } from "@/api/userApi";

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
    title: "Địa chỉ IP",
    dataIndex: "ipAddress",
  },
  {
    title: "Thời gian đăng nhập",
    dataIndex: "loginTime",
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

  const fetchLogs = useCallback(async (page: number) => {
    try {
      const res = await userApi.getLoginLogs();
      if (res.status === 200) {
        const data = res.data;
        setTotalPage(Math.ceil(data.length / 10) || 1);
        setDataFetching(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      console.error("Failed to fetch login logs:", err);
    }
  }, []);

  useEffect(() => {
    fetchLogs(curPage);
  }, [curPage, fetchLogs]);

  const dataSource = dataFetching.map((data: any, idx: number) => {
    let formattedDate = "-";
    if (data.loginTime) {
      const date = new Date(data.loginTime);
      formattedDate = date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }

    return {
      stt: (curPage - 1) * 10 + idx + 1,
      username: data.username || "-",
      ipAddress: data.ipAddress || "-",
      loginTime: formattedDate,
      statusText: data.status === "SUCCESS" ? (
        <span className="text-green-600 font-medium">Thành công</span>
      ) : (
        <span className="text-red-600 font-medium">Thất bại</span>
      ),
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
              ? "relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer"
              : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
          }
        >
          {i + 1}
        </a>,
      );
    }
    return pageIdx;
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <Table columns={columns} dataSource={dataSource} />
      </Card>

      {totalPage > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <a
              onClick={() => (curPage === 1 ? {} : setCurPage((old) => old - 1))}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Previous
            </a>
            <a
              onClick={() => (curPage === totalPage ? {} : setCurPage((old) => old + 1))}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Next
            </a>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <a
                  onClick={() => (curPage === 1 ? {} : setCurPage((old) => old - 1))}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                >
                  <span className="sr-only">Previous</span>
                  &lt;
                </a>
                {paging()}
                <a
                  onClick={() => (curPage === totalPage ? {} : setCurPage((old) => old + 1))}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
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
