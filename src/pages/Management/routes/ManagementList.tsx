import { api } from "@/api/api";
import { TableColumn } from "@/components/Table/type";
import {
  PencilSquareIcon,
  XMarkIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Tooltip } from "@mui/material";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import Table from "@/components/Table";
import Swal from "sweetalert2";
import OrganizationForm from "../components/OrganizationForm";
import ClassManagementModal from "../components/ClassManagementModal";
import Input from "@/components/Input";
import { getLocalUserInfo } from "@/utils/storage";

interface Props {}

const columns: TableColumn[] = [
  {
    title: "STT",
    dataIndex: "stt",
  },
  {
    title: "Mã trường",
    dataIndex: "code",
  },
  {
    title: "Tên trường",
    dataIndex: "name",
  },
  {
    title: "Tỉnh/ Thành phố",
    dataIndex: "address",
  },
  {
    title: "Quản lý lớp",
    dataIndex: "classAction",
  },
  {
    title: "Thao tác",
    dataIndex: "action",
  },
];

const ManagementList = (props: Props) => {
  const [curPage, setCurPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [selectedOrganization, setSelectedOrganization] = useState();
  const [isOpenForm, setIsOpenForm] = useState<boolean>(false);
  const [listProvince, setListProvince] = useState<any>([]);
  const [province, setProvince] = useState<any>();
  const [dataFetching, setDataFetching] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchText, setSearchText] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<{
    areaCode?: string;
    searchText?: string;
  }>({});
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  // State quản lý modal lớp học
  const [isOpenClassModal, setIsOpenClassModal] = useState<boolean>(false);
  const [selectedOrgForClass, setSelectedOrgForClass] = useState<{
    id: any;
    name: string;
  } | null>(null);

  const userInfor = getLocalUserInfo();
  const organizationType = userInfor?.organization?.type;

  const handleOpenClassModal = (id: any, name: string) => {
    setSelectedOrgForClass({ id, name });
    setIsOpenClassModal(true);
  };

  const dataSource = dataFetching.map((data: any, idx) => ({
    stt: idx + 1,
    code: data.code,
    name: data.name,
    address: data.address,
    classAction: (
      <span className="flex justify-center">
        <Tooltip title="Quản lý lớp học" placement="top">
          <button
            onClick={() => handleOpenClassModal(data.id, data.name)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            <AcademicCapIcon className="h-4 w-4" />
            Quản lý lớp
          </button>
        </Tooltip>
      </span>
    ),
    action: (
      <span className="flex justify-center gap-4">
        <Tooltip title="Chỉnh sửa" placement="top">
          <PencilSquareIcon
            className="h-6 w-6 cursor-pointer"
            onClick={() => handleUpdate(data.id)}
          />
        </Tooltip>
        {!organizationType ? (
          <Tooltip title="Xóa" placement="top">
            <XMarkIcon
              className="h-6 w-6 cursor-pointer"
              color="red"
              onClick={() => handleRemoveOrganization(data.id, data.name)}
            />
          </Tooltip>
        ) : null}
      </span>
    ),
  }));

  function formatList(list: any) {
    return list.map((item: any) => {
      let result = item.name;
      const listRemove = [
        "Tỉnh ",
        "Thành phố ",
        "Thị xã ",
        "Quận ",
        "Huyện ",
        "Phường ",
        "Xã ",
      ];
      listRemove.map((element) => {
        result = result.replace(element, "");
      });

      return {
        value: result,
        label: result,
        item: item,
      };
    });
  }

  useEffect(() => {
    api.get("/api/areas/lookup?region=SOUTH").then((result) => {
      if (result) {
        const list = formatList(result.data);
        setListProvince([
          { value: "None", label: "Tất cả", item: { code: null } },
          ...list,
        ]);
      }
    });
  }, []);

  // Tự động lọc khi chọn Tỉnh/Thành
  useEffect(() => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      if (province?.item?.code) {
        newFilters.areaCode = province.item.code;
      } else {
        delete newFilters.areaCode;
      }
      return newFilters;
    });
    setCurPage(1);
  }, [province]);

  const handleSearch = (e: any) => {
    const newFilters: { areaCode?: string; searchText?: string } = {};
    if (province?.item?.code) newFilters.areaCode = province.item.code;
    if (searchText) newFilters.searchText = searchText;
    setActiveFilters(newFilters);
    setCurPage(1);
  };

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPage <= 7) {
      return Array.from({ length: totalPage }, (_, i) => i + 1);
    }
    const delta = 2;
    const pages: (number | "...")[] = [];
    const left = curPage - delta;
    const right = curPage + delta;

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = Math.max(2, left); i <= Math.min(totalPage - 1, right); i++) {
      pages.push(i);
    }
    if (right < totalPage - 1) pages.push("...");
    pages.push(totalPage);
    return pages;
  };

  useEffect(() => {
    const queryParams = new URLSearchParams();
    queryParams.append("page", (curPage - 1).toString());
    queryParams.append("sort", "code,asc");
    if (activeFilters.areaCode)
      queryParams.append("areaCode", activeFilters.areaCode);
    if (activeFilters.searchText)
      queryParams.append("searchText", activeFilters.searchText);
    setTableLoading(true);
    api
      .get(`/api/organization/search`, { params: queryParams })
      .then((response) => {
        setTotalPage(response.data.totalPages);
        setDataFetching(response.data.content);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setTableLoading(false);
      });
  }, [curPage, activeFilters, refreshKey]);

  const handleRemoveOrganization = (id: any, name: string) => {
    Swal.fire({
      html: "Bạn có muốn xoá trường học " + `<b>${name}</b>` + " không?",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .delete(`/api/organizations/${id}`)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Xoá trường học thành công?",
            }).then(() => setRefreshKey((k) => k + 1));
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              title: "Xóa trường học không thành công?",
            });
          });
      }
    });
  };

  const handleUpdate = (id: any) => {
    setSelectedOrganization(id);
    setIsEdit(true);
    setIsOpenForm(true);
  };
  return (
    <>
      {isOpenForm && (
        <Modal
          isOpen={isOpenForm}
          setIsOpen={setIsOpenForm}
          onClose={() => setRefreshKey((k) => k + 1)}
          title={!isEdit ? "Thêm mới trường" : "Chỉnh sửa trường"}
        >
          <OrganizationForm
            organizationId={selectedOrganization}
            isEdit={isEdit}
            onSuccess={() => {
              setIsOpenForm(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        </Modal>
      )}

      {isOpenClassModal && selectedOrgForClass && (
        <Modal
          isOpen={isOpenClassModal}
          setIsOpen={setIsOpenClassModal}
          title={`Quản lý Lớp học – ${selectedOrgForClass.name}`}
        >
          <ClassManagementModal
            organizationId={selectedOrgForClass.id}
            organizationName={selectedOrgForClass.name}
            onClose={() => setIsOpenClassModal(false)}
          />
        </Modal>
      )}
      <div className="flex flex-col gap-8 px-3 sm:px-6">
        {!organizationType ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Tỉnh/Thành"
                placeholder="Chọn tỉnh/thành"
                options={listProvince}
                value={province}
                onChange={(e) => setProvince(e)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Nhập tên trường/ mã trường"
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button onClick={handleSearch}>Tìm kiếm</Button>
              </div>
              <div className="flex sm:justify-end">
                <Button
                  onClick={() => {
                    setSelectedOrganization(undefined);
                    setIsEdit(false);
                    setIsOpenForm(true);
                  }}
                >
                  Thêm trường mới
                </Button>
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
        {/* paging */}
        {!organizationType ? (
          <div className="flex cursor-pointer items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <a
                onClick={() =>
                  curPage === 1 ? {} : setCurPage((old) => old - 1)
                }
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </a>
              <a
                onClick={() =>
                  curPage === totalPage ? {} : setCurPage((old) => old + 1)
                }
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
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
                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                      >
                        …
                      </span>
                    ) : (
                      <a
                        key={page}
                        onClick={() => setCurPage(page as number)}
                        aria-current={curPage === page ? "page" : undefined}
                        className={
                          curPage === page
                            ? "relative z-10 inline-flex cursor-pointer items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            : "relative inline-flex cursor-pointer items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }
                      >
                        {page}
                      </a>
                    ),
                  )}
                  <a
                    onClick={() =>
                      curPage === totalPage ? {} : setCurPage((old) => old + 1)
                    }
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
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
        ) : null}

        {/* end paging */}
      </div>
    </>
  );
};
export default ManagementList;
