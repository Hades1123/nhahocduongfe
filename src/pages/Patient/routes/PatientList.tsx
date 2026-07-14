import { api } from "@/api/api";
import { reportApi } from "@/api/reportApi";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import { PaginationTable } from "@/components/Pagination";
import Select from "@/components/Select";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import { getLocalUserInfo } from "@/utils/storage";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DateRangePicker, DatePicker } from "rsuite";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Props {}

const columns: TableColumn[] = [
  {
    title: "STT",
    dataIndex: "STT",
  },
  {
    // Primary identifier shown in mobile card header
    title: "Họ và tên",
    dataIndex: "name",
  },
  {
    title: "Mã HS",
    dataIndex: "studentCode",
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
  const isMobile = useIsMobile();
  const [classOptions, setClassOptions] = useState<any>();
  const [schoolOptions, setSchoolOptions] = useState<any>();
  const [searchText, setSearchText] = useState("");
  const [school, setSchool] = useState<any>(null);
  const [classes, setClasses] = useState<any>(null);
  const [medicalDayRange, setMedicalDayRange] = useState<any>([
    new Date(),
    new Date(),
  ]);
  const [curPage, setCurPage] = useState(1);
  const [totalPage, setTotalPage] = useState<number>(0);
  const [reFetching, setReFetching] = useState<boolean>(false);
  const [listProvince, setListProvince] = useState<any>([]);
  const [province, setProvince] = useState<any>(null);
  const userInfor = getLocalUserInfo();
  const organizationType = userInfor?.organization?.type;
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const isFirstSearchRender = useRef(true);
  //* Attr for lazy loading management
  const provincesLoaded = useRef(false);
  const [provincesLoading, setProvincesLoading] = useState<boolean>(false);
  const schoolsLoaded = useRef(false);
  const [schoolsLoading, setSchoolsLoading] = useState<boolean>(false);

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

  const loadSchools = () => {
    if (schoolsLoaded.current) {
      return;
    }
    schoolsLoaded.current = true;
    setSchoolsLoading(true);
    api
      .get(`/api/organization/search?size=1000`)
      .then((response) => {
        setOrganizations(response.data.content);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setSchoolsLoading(false);
      });
  };

  function formatList(list: any) {
    const uniqueMap = new Map();
    list.forEach((item: any) => {
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
      listRemove.forEach((element) => {
        result = result.replace(element, "");
      });

      if (!uniqueMap.has(result)) {
        uniqueMap.set(result, {
          value: result,
          label: result,
          item: item,
        });
      }
    });

    return Array.from(uniqueMap.values()).sort((a: any, b: any) =>
      a.label.localeCompare(b.label),
    );
  }

  const loadProvinces = () => {
    if (provincesLoaded.current) return;
    provincesLoaded.current = true;
    setProvincesLoading(true);
    api
      .get("/api/areas/lookup")
      .then((result) => {
        if (result) {
          const list = formatList(result.data);
          setListProvince([{ value: "", label: "Tất cả", item: {} }, ...list]);
        }
      })
      .catch((err) => console.error("Can not fetch /api/areas/lookup ", err))
      .finally(() => {
        setProvincesLoading(false);
      });
  };

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
    if (school && school.value && school.value.classes) {
      setClasses("");
      const tempClasses = [];
      for (const [key, value] of Object.entries(school.value.classes)) {
        tempClasses.push(...(value as string[]));
      }
      let formatClass = tempClasses?.map((schoolClass: any) => {
        return {
          value: schoolClass,
          label: schoolClass,
        };
      });
      formatClass = formatClass || [];
      setClassOptions([{ value: "", label: "Tất cả" }, ...formatClass]);
      handleSearch({ classes: "" });
    } else setClassOptions(undefined);
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

  const filterParam = (overrides?: {
    searchText?: string;
    school?: any;
    classes?: any;
    province?: any;
  }) => {
    const queryParams = new URLSearchParams();

    // Resolve current values, favoring overrides if provided
    const currentSearchText =
      overrides && "searchText" in overrides
        ? overrides.searchText
        : searchText;
    const currentSchool =
      overrides && "school" in overrides ? overrides.school : school;
    const currentClasses =
      overrides && "classes" in overrides ? overrides.classes : classes;
    const currentProvince =
      overrides && "province" in overrides ? overrides.province : province;

    if (currentSearchText) {
      queryParams.append("searchText", currentSearchText);
    }
    if (currentSchool) {
      queryParams.append(
        "organizationName",
        currentSchool?.label !== "Tất cả" ? currentSchool?.label : "",
      );
    }
    if (currentClasses) {
      const classValue =
        typeof currentClasses === "object"
          ? currentClasses.value
          : currentClasses;
      queryParams.append("schoolClass", classValue || "");
    }
    // Append areaCode only when a real province with a code is selected
    if (currentProvince && currentProvince?.item?.code) {
      queryParams.append("areaCode", currentProvince.item.code);
    }

    return queryParams;
  };

  const handleSearch = (overrides?: {
    searchText?: string;
    school?: any;
    classes?: any;
    province?: any;
  }) => {
    setTableLoading(true);
    const queryParams = filterParam(overrides);
    console.log(queryParams.toString());
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
      })
      .finally(() => setTableLoading(false));
  };

  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      handleSearch();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

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
    setTableLoading(true);
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
      })
      .finally(() => {
        setTableLoading(false);
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
    if (school?.value?.id) {
      reportApi.downloadSchoolStudentsExcel(school.value.id, school.label);
    }
  };

  const handleOk = (values: any) => {
    if (values) {
      setMedicalDayRange(values);
    }
  };
  const filterSchoolByProvince = (province: any) => {
    // If "Tất cả" selected (province.value === ""), show all schools
    if (!province || !province?.item?.code) {
      const formatSchool = organizations?.map((school: any) => ({
        value: school,
        label: school.name,
      }));
      setSchoolOptions([
        { value: "", label: "Tất cả" },
        ...(formatSchool || []),
      ]);
      setProvince(null);
      setSchool(null);
      setClasses("");
      handleSearch({ province: null, school: null, classes: "" });
      return;
    }

    const filteredSchools = organizations.filter(
      (school: any) => school.areaCode === province.item.code,
    );
    const formatSchool = filteredSchools.map((school: any) => ({
      value: school,
      label: school.name,
    }));
    setSchoolOptions([{ value: "", label: "Tất cả" }, ...formatSchool]);
    setProvince(province);
    setSchool(null);
    setClasses("");
    handleSearch({ province: province, school: null, classes: "" });
  };

  return (
    <div className="mt-5 flex flex-col gap-5 px-3 sm:px-6">
      {/* ── Section 1: Table filters ── */}
      {!organizationType ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div onMouseDown={loadProvinces}>
            <Select
              label="Tỉnh/Thành"
              placeholder="Chọn tỉnh/thành"
              options={listProvince}
              value={province}
              onChange={(e) => filterSchoolByProvince(e)}
              search={true}
              loading={provincesLoading}
            />
          </div>
          <div onMouseDown={loadSchools}>
            <Select
              label="Trường"
              placeholder="Chọn trường học"
              options={schoolOptions}
              value={school}
              search={true}
              onChange={(v) => {
                setSchool(v);
                setClasses("");
                handleSearch({ school: v, classes: "" });
              }}
              loading={schoolsLoading}
            />
          </div>
          <Select
            label="Lớp"
            placeholder="Chọn lớp"
            value={classes}
            options={classOptions}
            onChange={(v) => {
              setClasses(v);
              handleSearch({ classes: v });
            }}
          />
        </div>
      ) : (
        <div className="max-w-xs">
          <Select
            label="Lớp"
            placeholder="Chọn lớp"
            value={classes}
            options={classOptions}
            onChange={(v) => {
              setClasses(v);
              handleSearch({ classes: v });
            }}
          />
        </div>
      )}

      {/* ── Section 2: Export report (visually distinct panel) ── */}
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center">
        <span className="shrink-0 text-sm font-medium text-gray-500">
          Xuất kết quả theo kỳ:
        </span>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {isMobile ? (
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full flex-col gap-1">
                <div className="text-xs text-gray-500">Từ ngày</div>
                <DatePicker
                  style={{ width: "100%" }}
                  value={medicalDayRange?.[0] || null}
                  onChange={(value) =>
                    setMedicalDayRange([value, medicalDayRange?.[1]])
                  }
                  onClean={() =>
                    setMedicalDayRange([null, medicalDayRange?.[1]])
                  }
                />
              </div>
              <div className="flex w-full flex-col gap-1">
                <div className="text-xs text-gray-500">Đến ngày</div>
                <DatePicker
                  style={{ width: "100%" }}
                  value={medicalDayRange?.[1] || null}
                  onChange={(value) =>
                    setMedicalDayRange([medicalDayRange?.[0], value])
                  }
                  onClean={() =>
                    setMedicalDayRange([medicalDayRange?.[0], null])
                  }
                />
              </div>
            </div>
          ) : (
            <div className="w-full sm:w-auto">
              <DateRangePicker
                style={{ width: "100%", maxWidth: "280px" }}
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
            </div>
          )}
          <Button onClick={handleResult} isDisabled={!school || !school.value}>
            Xuất KQ
          </Button>
        </div>
      </div>

      {/* ── Section 3: Search + action buttons ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Nhập họ tên hoặc mã BHYT"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
          <Button variants="outlined" onClick={handleExport}>
            Export
          </Button>
          <Button variants="outlined" onClick={handleImport}>
            Import
          </Button>
          <Button variants="outlined" onClick={handleExportExportExampleFile}>
            File mẫu
          </Button>
          <Button variants="contained" onClick={handleCreateButton}>
            + Tạo mới
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          onColumnClick={(record: IpatientList) => handleColumnClick(record)}
          loading={tableLoading}
          mobileCardCols={1}
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
