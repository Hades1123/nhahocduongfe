/**
 * PatientList — Main patient listing page with cascading filters.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  REFACTORED VERSION                                                     ║
 * ║                                                                         ║
 * ║  Changes from the original:                                             ║
 * ║  1. All filter state/logic extracted into usePatientFilters hook         ║
 * ║  2. Filter UI extracted into PatientFilterPanel component                ║
 * ║  3. Filters are now SYNCHRONOUS — "Lọc" button commits all at once     ║
 * ║  4. Text search is ASYNC (debounced) — queries committed filter set     ║
 * ║  5. Old inline filter code preserved as comments below for reference    ║
 * ║                                                                         ║
 * ║  Architecture:                                                          ║
 * ║    PatientList                                                          ║
 * ║    ├── usePatientFilters (hook)  → manages filter state & data loading  ║
 * ║    ├── PatientFilterPanel (UI)   → renders dropdowns + Lọc/Đặt lại    ║
 * ║    ├── fetchWithFilters()        → builds query & calls API             ║
 * ║    ├── Text search (debounced)   → independent async search path        ║
 * ║    └── Table + Pagination        → unchanged from original              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { api } from "@/api/api";
import { reportApi } from "@/api/reportApi";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import { PaginationTable } from "@/components/Pagination";
import Table from "@/components/Table";
import { TableColumn } from "@/components/Table/type";
import { getLocalUserInfo } from "@/utils/storage";
import { PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DateRangePicker, DatePicker } from "rsuite";
import { useIsMobile } from "@/hooks/useIsMobile";

// ── New imports for refactored filter system ──
import { usePatientFilters, FilterState } from "../hooks/usePatientFilters";
import PatientFilterPanel from "../components/PatientFilterPanel";

// ═══════════════════════════════════════════════════════════════════════════
// Old imports that were removed during refactor (kept for reference):
//
// import Select from "@/components/Select";
//   → Moved into PatientFilterPanel component
// ═══════════════════════════════════════════════════════════════════════════

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
  const isMobile = useIsMobile();
  const userInfor = getLocalUserInfo();

  // ═══════════════════════════════════════════════════════════════════════
  // Table data state (unchanged from original)
  // ═══════════════════════════════════════════════════════════════════════

  const [dataFetching, setDataFetching] = useState([]);
  const [curPage, setCurPage] = useState(1);
  const [totalPage, setTotalPage] = useState<number>(0);
  const [reFetching, setReFetching] = useState<boolean>(false);
  const [tableLoading, setTableLoading] = useState<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════
  // Text search — async, debounced (unchanged from original)
  //
  // This operates independently of the filter panel. It queries against
  // the COMMITTED filter set (not draft), so changing dropdowns without
  // clicking "Lọc" does not affect text search results.
  // ═══════════════════════════════════════════════════════════════════════

  const [searchText, setSearchText] = useState("");
  const isFirstSearchRender = useRef(true);

  // ═══════════════════════════════════════════════════════════════════════
  // Export date range (unchanged from original)
  // ═══════════════════════════════════════════════════════════════════════

  const [medicalDayRange, setMedicalDayRange] = useState<any>([
    new Date(),
    new Date(),
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // Old filter state variables — REMOVED, now managed by usePatientFilters.
  // Kept as comments for reference per user request:
  //
  //   const [organizations, setOrganizations] = useState([]);
  //   const [classOptions, setClassOptions] = useState<any>();
  //   const [schoolOptions, setSchoolOptions] = useState<any>();
  //   const [school, setSchool] = useState<any>(null);
  //   const [classes, setClasses] = useState<any>(null);
  //   const [listProvince, setListProvince] = useState<any>([]);
  //   const [province, setProvince] = useState<any>(null);
  //   const organizationType = userInfor?.organization?.type;
  //   const provincesLoaded = useRef(false);
  //   const [provincesLoading, setProvincesLoading] = useState<boolean>(false);
  //   const schoolsLoaded = useRef(false);
  //   const [schoolsLoading, setSchoolsLoading] = useState<boolean>(false);
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // Build query params from committed filter state + searchText
  //
  // This replaces the old `filterParam()` function. The key difference is
  // that it reads from the hook's COMMITTED state instead of component-level
  // state, ensuring that only "Lọc"-applied filters affect the query.
  //
  // Old code reference:
  // ```
  //   const filterParam = (overrides?) => {
  //     const queryParams = new URLSearchParams();
  //     const currentSearchText = overrides?.searchText ?? searchText;
  //     const currentSchool = overrides?.school ?? school;
  //     const currentClasses = overrides?.classes ?? classes;
  //     const currentProvince = overrides?.province ?? province;
  //     if (currentSearchText) queryParams.append("searchText", currentSearchText);
  //     if (currentSchool) queryParams.append("organizationName", ...);
  //     if (currentClasses) queryParams.append("schoolClass", ...);
  //     if (currentProvince?.item?.code) queryParams.append("areaCode", ...);
  //     return queryParams;
  //   };
  // ```
  // ═══════════════════════════════════════════════════════════════════════

  const buildQueryParams = useCallback(
    (filters: FilterState, textOverride?: string) => {
      const queryParams = new URLSearchParams();
      const text = textOverride !== undefined ? textOverride : searchText;

      // Text search — searches fullName and healthInsuranceNumber on backend
      if (text) {
        queryParams.append("searchText", text);
      }

      // School filter — pass organization name to backend
      // (skip if school is null or "Tất cả")
      if (filters.school?.label && filters.school.label !== "Tất cả") {
        queryParams.append("organizationName", filters.school.label);
      }

      // Class filter — pass exact class name to backend
      if (filters.classValue?.value) {
        queryParams.append("schoolClass", filters.classValue.value);
      }

      // Province filter — pass area code so backend filters by organization's province
      if (filters.province?.item?.code) {
        queryParams.append("areaCode", filters.province.item.code);
      }

      return queryParams;
    },
    [searchText],
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Core fetch function — used by both filter commit and text search
  //
  // This replaces the old `handleSearch()` and `fetchData()` functions.
  // It accepts an explicit FilterState to avoid stale closure issues.
  //
  // Old code reference:
  // ```
  //   const handleSearch = (overrides?) => {
  //     setTableLoading(true);
  //     const queryParams = filterParam(overrides);
  //     api.get(`/api/patient/search?sort=id,desc`, { params: queryParams })
  //       .then(res => { setCurPage(1); setDataFetching(res.data.content); ... })
  //       ...
  //   };
  // ```
  // ═══════════════════════════════════════════════════════════════════════

  const fetchWithFilters = useCallback(
    (filters: FilterState, text: string, page: number) => {
      setTableLoading(true);
      const queryParams = buildQueryParams(filters, text);

      api
        .get(`/api/patient/search?sort=id,desc&page=${page - 1}`, {
          params: queryParams,
        })
        .then((res) => {
          if (res.status === 200) {
            setCurPage(page);
            setTotalPage(res.data.totalPages);
            setDataFetching(res.data.content);
          }
        })
        .catch((err) => {
          if (err.code === "ECONNABORTED") {
            console.error("Patient search timed out. Please try again.");
          } else {
            console.error("Patient search failed:", err);
          }
        })
        .finally(() => setTableLoading(false));
    },
    [buildQueryParams],
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Filter hook — synchronous commit via "Lọc" button
  //
  // The hook manages:
  //   - Draft/committed filter state
  //   - Province/school/class cascading logic
  //   - Lazy data loading (provinces, organizations)
  //   - organizationType branch (school-level users)
  //
  // The onCommit callback is called when:
  //   1. User clicks "Lọc" → committed filters → search from page 1
  //   2. User clicks "Đặt lại" → empty filters → search from page 1
  // ═══════════════════════════════════════════════════════════════════════

  const filters = usePatientFilters({
    onCommit: (committed: FilterState) => {
      // When filters are committed, search from page 1 with current searchText
      fetchWithFilters(committed, searchText, 1);
    },
    organizationType: userInfor?.organization?.type,
    userOrganization: userInfor?.organization,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Debounced text search — queries against committed filter set
  //
  // The text search is independent of the filter panel:
  //   - Typing in the search box starts a 400ms debounce timer
  //   - When the timer fires, it queries using the COMMITTED filters
  //   - Changing dropdowns (draft state) does NOT affect text search
  //   - Only clicking "Lọc" (which updates committed state) changes
  //     what the text search queries against
  //
  // Old code reference:
  // ```
  //   useEffect(() => {
  //     if (isFirstSearchRender.current) { ... return; }
  //     const timer = setTimeout(() => { handleSearch(); }, 400);
  //     return () => clearTimeout(timer);
  //   }, [searchText]);
  // ```
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchWithFilters(filters.committed, searchText, 1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // ═══════════════════════════════════════════════════════════════════════
  // Initial data load — fetch first page with no filters
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchWithFilters(filters.committed, "", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // Re-fetch after delete
  //
  // When a patient is deleted, reFetching is set to true. This effect
  // re-queries the current page with committed filters.
  //
  // Old code reference:
  // ```
  //   useEffect(() => {
  //     if (reFetching) {
  //       api.get("/api/patient/search?sort=id,desc")
  //         .then(res => { ... setReFetching(false); })
  //         ...
  //     }
  //   }, [reFetching]);
  // ```
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (reFetching) {
      fetchWithFilters(filters.committed, searchText, 1);
      setReFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reFetching]);

  // ═══════════════════════════════════════════════════════════════════════
  // Navigation & CRUD handlers (unchanged from original)
  // ═══════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════
  // Table data mapping (unchanged from original)
  // ═══════════════════════════════════════════════════════════════════════

  const schoolData = dataFetching.map((item: any) => item.organization?.name);

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

  // ═══════════════════════════════════════════════════════════════════════
  // Pagination handlers
  //
  // These now use fetchWithFilters() with committed state, ensuring
  // pagination respects the last-applied filter set.
  // ═══════════════════════════════════════════════════════════════════════

  const gotoPage = (e: number) => {
    const targetPage = e + 1;
    setCurPage(targetPage);
    fetchWithFilters(filters.committed, searchText, targetPage);
  };

  const handleGoBackPreviousPage = () => {
    setCurPage(1);
    fetchWithFilters(filters.committed, searchText, 1);
  };

  const handleGoToNextPage = () => {
    setCurPage(totalPage);
    fetchWithFilters(filters.committed, searchText, totalPage);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Export results handler
  //
  // Uses the COMMITTED school filter (not draft) for consistency.
  // The "Xuất KQ" button is disabled if no school is committed.
  // ═══════════════════════════════════════════════════════════════════════

  const handleResult = () => {
    if (filters.committed.school?.value?.id) {
      reportApi.downloadSchoolStudentsExcel(
        filters.committed.school.value.id,
        filters.committed.school.label,
      );
    }
  };

  const handleOk = (values: any) => {
    if (values) {
      setMedicalDayRange(values);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Old inline filter functions — REMOVED, now in usePatientFilters hook.
  // Kept as comments for reference per user request:
  //
  //   function flattenObject(obj) { ... }
  //   const loadSchools = () => { ... };
  //   function formatList(list) { ... }
  //   const loadProvinces = () => { ... };
  //   const filterSchoolByProvince = (province) => { ... };
  //
  // Old useEffect blocks for organizations and school changes:
  //
  //   useEffect(() => {
  //     if (organizations.length > 0) {
  //       setClasses("");
  //       const formatSchool = organizations?.map((school, index) => ({
  //         value: school, label: school.name,
  //       }));
  //       setSchoolOptions([{ value: "", label: "Tất cả" }, ...formatSchool]);
  //     }
  //   }, [organizations]);
  //
  //   useEffect(() => {
  //     if (school && school.value && school.value.classes) {
  //       setClasses("");
  //       const tempClasses = [];
  //       for (const [key, value] of Object.entries(school.value.classes)) {
  //         tempClasses.push(...(value as string[]));
  //       }
  //       let formatClass = tempClasses?.map((schoolClass) => ({
  //         value: schoolClass, label: schoolClass,
  //       }));
  //       setClassOptions([{ value: "", label: "Tất cả" }, ...formatClass]);
  //       handleSearch({ classes: "" });
  //     } else setClassOptions(undefined);
  //   }, [school]);
  //
  //   if (organizationType) {
  //     useEffect(() => {
  //       setClasses("");
  //       let temp = flattenObject(userInfor.organization.classes);
  //       temp = [temp.join(","), ...temp].map((schoolClass, index) => {
  //         if (index === 0) return {};
  //         else return { value: schoolClass, label: schoolClass };
  //       });
  //       setClassOptions(temp);
  //     }, [organizationType]);
  //   }
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // Old inline filter JSX — REMOVED, replaced by <PatientFilterPanel />.
  // Kept as comments for reference per user request:
  //
  //   {!organizationType ? (
  //     <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
  //       <div onMouseDown={loadProvinces}>
  //         <Select label="Tỉnh/Thành" ... onChange={(e) => filterSchoolByProvince(e)} ... />
  //       </div>
  //       <div onMouseDown={loadSchools}>
  //         <Select label="Trường" ... onChange={(v) => { setSchool(v); setClasses(""); handleSearch({...}); }} ... />
  //       </div>
  //       <Select label="Lớp" ... onChange={(v) => { setClasses(v); handleSearch({...}); }} />
  //     </div>
  //   ) : (
  //     <div className="max-w-xs">
  //       <Select label="Lớp" ... onChange={(v) => { setClasses(v); handleSearch({...}); }} />
  //     </div>
  //   )}
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="mt-5 flex flex-col gap-5 px-3 sm:px-6">
      {/* ── Section 1: Cascading filter panel (replaces old inline filters) ── */}
      <PatientFilterPanel
        {...filters}
        isMobile={isMobile}
        onResetSearchText={() => setSearchText("")}
      />

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
          <Button
            onClick={handleResult}
            isDisabled={
              !filters.committed.school || !filters.committed.school.value
            }
          >
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
