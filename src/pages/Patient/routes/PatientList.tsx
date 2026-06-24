import { api } from "@/api/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import { PaginationTable } from "@/components/Pagination";
import Select from "@/components/Select";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import { getLocalUserInfo } from "@/utils/storage";
import {
  PencilSquareIcon,
  XMarkIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DateRangePicker } from "rsuite";
import moment from "moment";
import { exportFile } from "@/utils/utils";

interface Props {}

const columns: TableColumn[] = [
  {
    title: "STT",
    dataIndex: "STT",
  },
  {
    title: "Mã HS",
    dataIndex: "studentCode",
  },
  {
    title: "Họ và tên",
    dataIndex: "name",
  },
  {
    title: "Giới tính",
    dataIndex: "gender",
  },
  {
    title: "Ngày sinh",
    dataIndex: "DOB",
  },
  {
    title: "Mã định danh",
    dataIndex: "identifyNumber",
  },
  {
    title: "Tỉnh/ Thành",
    dataIndex: "province",
  },
  {
    title: "Trường",
    dataIndex: "school",
  },
  {
    title: "Lớp",
    dataIndex: "class",
  },
  {
    title: "BHYT",
    dataIndex: "BHYT",
  },
  {
    title: "Thao tác",
    dataIndex: "handle",
  },
];

interface IpatientList {
  id: number;
  STT: number;
  studentCode: string;
  name: string;
  gender: string;
  DOB: Date;
  identifyNumber: any;
  province: string;
  school: string;
  class: string;
  BHYT: any;
}

const PatientList = (props: Props) => {
  const navigate = useNavigate();
  const [dataFetching, setDataFetching] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [classOptions, setClassOptions] = useState<any>();
  const [schoolOptions, setSchoolOptions] = useState<any>();
  const [searchText, setSearchText] = useState("");
  const [school, setSchool] = useState<any>();
  const [classes, setClasses] = useState<any>();
  const [medicalDayRange, setMedicalDayRange] = useState<any>([
    new Date(),
    new Date(),
  ]);
  const [curPage, setCurPage] = useState(1);
  const [totalPage, setTotalPage] = useState<number>(0);
  const [reFetching, setReFetching] = useState<boolean>(false);
  const [listProvince, setListProvince] = useState<any>([]);
  const [province, setProvince] = useState<any>();
  const userInfor = getLocalUserInfo();
  const organizationType = userInfor?.organization?.type;

  function flattenObject(obj: any) {
    const flattenedArray = [];

    // Iterate over each key-value pair in the object
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // If the value is an array, concatenate it with the flattened array
        if (Array.isArray(value)) {
          flattenedArray.push(...value);
        }
      }
    }
    return flattenedArray;
  }

  const handleCreateButton = () => {
    navigate("/patient/create");
  };

  function downloadFile(blob: any, fileName: any) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleExportExportExampleFile = async () => {
    let fileName = "Import_Example_Hocsinh.xlsx";

    api
      .get("/api/patient/excel/template", {
        responseType: "blob",
      })
      .then((response) => {
        downloadFile(response.data, fileName);
      });
  };

  const handleImport = () => {
    const input = document.createElement("INPUT");
    input.setAttribute("type", "file");
    document.body.appendChild(input);
    input.click();
    input.onchange = function (e?: any) {
      if (e.target?.files[0]) {
        api
          .post(
            "/api/patient/excel",
            { file: e.target?.files[0] },
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          )
          .then((response) => {
            console.log("response: ", response);
            Swal.fire({
              icon: "success",
              title: "Nhập file thành công!",
            });
          })
          .catch((e) => {
            Swal.fire({
              icon: "error",
              title: "Nhập file thất bại!",
            });
          });
      }
    };
    document.body.removeChild(input);
  };

  const handleExport = () => {
    let fileName = "Export_Hocsinh.xlsx";

    api
      .get("/api/patient/excel", {
        responseType: "blob",
      })
      .then((response) => {
        downloadFile(response.data, fileName);
      });
  };

  useEffect(() => {
    api.get(`/api/organization/search?size=1000`).then((response) => {
      // console.log("school:", response.data.content);
      setOrganizations(response.data.content);
    });
  }, []);

  function formatList(list: any) {
    return list
      .map((item: any) => {
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
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
  }

  useEffect(() => {
    api.get("/api/areas/lookup").then((result) => {
      if (result) {
        const list = formatList(result.data);
        setListProvince(list);
      }
    });
  }, []);

  useEffect(() => {
    if (reFetching) {
      api
        .get("/api/patient/search?sort=id,desc")
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
    }
  }, [reFetching]);

  const schoolData = dataFetching.map((item: any) => item.organization?.name);

  useEffect(() => {
    if (organizations.length > 0) {
      setClasses("");
      const formatSchool = organizations?.map((school: any, index: number) => {
        return {
          value: school,
          label: school.name,
        };
      });
      setSchoolOptions([{ value: "", label: "Tất cả" }, ...formatSchool]);
    }
  }, [organizations]);

  useEffect(() => {
    if (school && school.value) {
      setClasses("");
      let formatClass = school.value.classes?.["1"].map((schoolClass: any) => {
        return {
          value: schoolClass,
          label: schoolClass,
        };
      });
      formatClass = formatClass || [];
      setClassOptions([{ value: "", label: "Tất cả" }, ...formatClass]);
    } else setClassOptions([]);
  }, [school]);

  if (organizationType) {
    useEffect(() => {
      setClasses("");
      let temp = flattenObject(userInfor.organization.classes);
      temp = [temp.join(","), ...temp].map((schoolClass, index) => {
        if (index === 0) {
          return {};
        } else {
          return {
            value: schoolClass,
            label: schoolClass,
          };
        }
      });
      setClassOptions(temp);
    }, [organizationType]);
  }

  const filterParam = () => {
    const queryParams = new URLSearchParams();
    if (searchText) {
      queryParams.append("searchText", searchText);
    }
    if (school) {
      queryParams.append(
        "organizationName",
        school?.label !== "Tất cả" ? school?.label : "",
      );
    }
    if (classes) {
      queryParams.append("schoolClass", classes ? classes.value : "");
    }
    if (province) {
      queryParams.append(
        "areaCode",
        province?.item.code ? province?.item.code : "",
      );
    }

    return queryParams;
  };

  const handleSearch = (e: any) => {
    // const queryParams = new URLSearchParams();
    // if (searchText) {
    //   queryParams.append("searchText", searchText);
    // }
    // if (school) {
    //   queryParams.append(
    //     "organizationName",
    //     school?.label !== "Tất cả" ? school?.label : "",
    //   );
    // }
    // if (classes) {
    //   queryParams.append("schoolClass", classes ? classes.value : "");
    // }
    // if (province) {
    //   queryParams.append(
    //     "areaCode",
    //     province?.item.code ? province?.item.code : "",
    //   );
    // }
    const queryParams = filterParam();
    console.log("quert:", queryParams);
    api
      .get(`/api/patient/search?sort=id,desc`, { params: queryParams })
      .then((res) => {
        if (res.status === 200) {
          setCurPage(1);
          setDataFetching(res.data.content);
          setTotalPage(res.data.totalPages);
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  const handleDelete = (id: number, name: string) => {
    Swal.fire({
      html: "Bạn có muốn xoá học sinh " + `<b>${name}</b>` + " không?",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((response) => {
      if (response.isConfirmed) {
        api
          .delete(`/api/patient/${id}`)
          .then(() => {
            setReFetching(true);
            Swal.fire({
              icon: "success",
              title: "Xóa học sinh thành công!",
            });
          })
          .catch(() =>
            Swal.fire({
              icon: "error",
              title:
                "Xóa học sinh không thành công, học sinh đang có phiếu điều trị!",
            }),
          );
      }
    });
  };

  const handleColumnClick = (record: IpatientList) => {
    navigate(`/patient/${record.id}/healthCheckHistory`);
  };

  const dataSource = dataFetching.map((data: any, idx) => ({
    id: data.id,
    STT: (curPage - 1) * 20 + idx + 1,
    studentCode: data.code,
    name: data.fullName,
    patientCode: data?.patientCode,
    gender: data.gender === 1 ? "Nam" : "Nữ",
    DOB: data.birthDate,
    identifyNumber: data?.nationalIdNum,
    province: data.addressLine,
    school: schoolData[idx],
    class: data?.schoolClass,
    BHYT: data.healthInsuranceNumber,
    handle: (
      <span className="flex justify-center gap-4">
        <Tooltip title="Chỉnh sửa" placement="top">
          <Link
            to={`/patient/detail/${data.id}`}
            state={{ patientId: data.id }}
            onClick={(e) => e.stopPropagation()}
          >
            <PencilSquareIcon className="h-6 w-6 cursor-pointer" />
          </Link>
        </Tooltip>
        <Tooltip title="Xóa" placement="top">
          <XMarkIcon
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(data.id, data.fullName);
            }}
            className="h-6 w-6 cursor-pointer text-red-500"
          />
        </Tooltip>
      </span>
    ),
  }));

  function fetchData(page: number) {
    const queryParams = filterParam();
    api
      .get(`/api/patient/search?sort=id,desc&page=${page - 1}`, {
        params: queryParams,
      })
      .then((res) => {
        if (res.status === 200) {
          setTotalPage(res.data.totalPages);
          setDataFetching(res.data.content);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  useEffect(() => {
    fetchData(1);
  }, []);

  const gotoPage = (e: number) => {
    setCurPage(e + 1);
    fetchData(e + 1);
  };

  const handleGoBackPreviousPage = () => {
    setCurPage(1);
    fetchData(1);
  };

  const handleGoToNextPage = () => {
    setCurPage(totalPage);
    fetchData(totalPage);
  };

  const handleResult = () => {
    const startDate = moment(medicalDayRange[0]).format("DD/MM/YYYY");
    const endDate = moment(medicalDayRange[1]).format("DD/MM/YYYY");
    api
      .get(
        `/api/exams/excel/raw?schoolId=${school.value.id}&startDate=${startDate}&endDate=${endDate}`,
        { responseType: "blob" },
      )
      .then((res) => {
        if (res.status === 200) {
          exportFile(res.data, school.label);
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  const handleOk = (values: any) => {
    if (values) {
      setMedicalDayRange(values);
    }
  };
  const filterSchoolByProvince = (province: any) => {
    const filteredSchools = organizations.filter(
      (school: any) => school.areaCode === province?.item.code,
    );
    const formatSchool = filteredSchools.map((school: any) => ({
      value: school,
      label: school.name,
    }));
    setSchoolOptions([{ value: "", label: "Tất cả" }, ...formatSchool]);
    setProvince(province);
    setSchool(null);
  };

  return (
    <div className="mt-5 flex flex-col gap-5 sm:px-6 ">
      <div className="grid grid-cols-4 gap-4">
        {!organizationType ? (
          <>
            <Select
              label="Tỉnh/Thành"
              placeholder="Chọn tỉnh/thành"
              options={listProvince}
              value={province}
              onChange={(e) => filterSchoolByProvince(e)}
            />
            <Select
              label="Trường"
              placeholder="Chọn trường học"
              options={schoolOptions}
              value={school}
              onChange={(v) => setSchool(v)}
            />
          </>
        ) : null}
        <Select
          label="Lớp"
          placeholder="Chọn lớp"
          value={classes}
          options={classOptions}
          onChange={(v) => setClasses(v)}
        />
        <div className="flex items-end justify-end gap-3">
          <DateRangePicker
            style={{ width: "100%" }}
            placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
            format={"dd/MM/yyyy"}
            onChange={(e) => setMedicalDayRange(e)}
            onClean={() => {
              setMedicalDayRange([]);
            }}
            onOk={handleOk}
            placement="auto"
            value={medicalDayRange}
          />

          <Button
            onClick={handleResult}
            isDisabled={medicalDayRange.length < 2 || !school || !school.value}
          >
            Xuất KQ
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="flex gap-3">
          <Input
            placeholder="Nhập họ tên hoặc mã BHYT"
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button onClick={handleSearch}>Tìm kiếm</Button>
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={handleExport}>Export</Button>
          <Button onClick={handleImport}>Import</Button>
          <Button onClick={handleExportExportExampleFile}>File mẫu</Button>
          <Button onClick={handleCreateButton}>Tạo mới thông tin</Button>
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          onColumnClick={(record: IpatientList) => handleColumnClick(record)}
        />
      </Card>
      <PaginationTable
        gotoPage={(e: number) => gotoPage(e)}
        pageCount={totalPage}
        pageIndex={curPage - 1}
        canPreviousPage={curPage > 1}
        canNextPage={curPage < totalPage}
        handleGoBackPreviousPage={handleGoBackPreviousPage}
        handleGoToNextPage={handleGoToNextPage}
      />
    </div>
  );
};
export { PatientList };
