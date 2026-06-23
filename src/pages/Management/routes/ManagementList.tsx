import { api } from "@/api/api";
import { TableColumn } from "@/components/Table/type";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Tooltip } from "@mui/material";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import Select from "@/components/Select";
import Table from "@/components/Table";
import Swal from "sweetalert2";
import OrganizationForm from "../components/OrganizationForm";
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
  const [reFetching, setReFetching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const userInfor = getLocalUserInfo();
  const organizationType = userInfor?.organization?.type;

  useEffect(() => {
    api
      .get("/api/organization/search?sort=updatedDate,desc")
      .then((res) => {
        if (res.status === 200) {
          setTotalPage(res.data.totalPages);
          setDataFetching(res.data.content);
          setReFetching(false);
        }
      })
      .catch((err) => {
        throw err;
      });
  }, [reFetching]);

  const dataSource = dataFetching.map((data: any, idx) => ({
    stt: idx + 1,
    code: data.code,
    name: data.name,
    address: data.address,
    action: (
      <span className="flex justify-center gap-4">
        <Tooltip title="Chỉnh sửa" placement="top">
          <PencilSquareIcon
            className="h-6 w-6"
            onClick={() => handleUpdate(data.id)}
          />
        </Tooltip>
        {!organizationType ? (
          <Tooltip title="Xóa" placement="top">
            <XMarkIcon
              className="h-6 w-6"
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
        setListProvince(list);
      }
    });
  }, []);

  const handleSearch = (e: any) => {
    const queryParams = new URLSearchParams();
    if (province) {
      queryParams.append(
        "areaCode",
        province?.item.code ? province?.item.code : "",
      );
    }
    if (searchText) {
      queryParams.append("searchText", searchText);
    }
    api
      .get(`/api/organization/search`, { params: queryParams })
      .then((res) => {
        if (res.status === 200) {
          setTotalPage(res.data.totalPages);
          setDataFetching(res.data.content);
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  const paging = () => {
    var pageIdx = [];
    for (let i = 0; i < totalPage; i++) {
      pageIdx.push(
        <a
          onClick={() => setCurPage(i + 1)}
          aria-current="page"
          className={
            curPage === i + 1
              ? "relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
          }
        >
          {i + 1}
        </a>,
      );
    }
    return pageIdx;
  };

  useEffect(() => {
    api.get(`/api/organization/search?page=${curPage - 1}`).then((response) => {
      setTotalPage(response.data.totalPages);
      setDataFetching(response.data.content);
    });
  }, [curPage]);

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
            }).then(() => setReFetching(true));
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
          onClose={() => setReFetching(true)}
          title={!isEdit ? "Thêm mới trường" : "Chỉnh sửa trường"}
        >
          <OrganizationForm
            organizationId={selectedOrganization}
            isEdit={isEdit}
            onSuccess={() => {
              setIsOpenForm(false);
              setReFetching(true);
            }}
          />
        </Modal>
      )}
      <div className="flex flex-col gap-8 sm:px-6">
        {!organizationType ? (
          <>
            <div className="grid grid-cols-4 gap-4">
              <Select
                label="Tỉnh/Thành"
                placeholder="Chọn tỉnh/thành"
                options={listProvince}
                value={province}
                onChange={(e) => setProvince(e)}
              />
            </div>
            <div className="grid grid-cols-2">
              <div className="flex gap-3">
                <Input
                  placeholder="Nhập tên trường/ mã trường"
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button onClick={handleSearch}>Tìm kiếm</Button>
              </div>
              <div className="flex justify-end">
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
          <Table columns={columns} dataSource={dataSource} />
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
                        fill-rule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </a>
                  {paging()}
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
                        fill-rule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clip-rule="evenodd"
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
