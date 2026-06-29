import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useQuery } from "react-query";
import { api } from "@/api/api";
import qs from "query-string";
import { useLocation, useNavigate } from "react-router-dom";
import { get } from "lodash";
import { styled } from "@mui/material/styles";
import { Typography, Skeleton, Pagination, useMediaQuery } from "@mui/material";

interface IPaginationService {
  dataSource?: any;
  src?: string;
  url?: string;
  name?: string;
  headRows: any;
  dataPath?: string;
  mappingSource?: Array<any>;
  havePagination?: boolean;
  totalPages?: number;
  onRowSelected?: (values: any) => void;
  searchValues?: any;
}

const TableCellStyled = styled(TableCell)(() => ({
  color: "white",
  textAlign: "center",
  fontWeight: 600,
}));

const TableDataStyled = styled(TableCell)(() => ({
  textAlign: "center",
}));

const SkeletonLoading = () => {
  return (
    <div className="">
      <Typography component="div" key={"h1"} variant="h1">
        <Skeleton />
      </Typography>
      <Typography component="div" key={"item1"} variant="h2">
        <Skeleton />
      </Typography>
    </div>
  );
};

/** Chevron icon for card expand/collapse */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
        expanded ? "rotate-180" : ""
      }`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const heads = ["Tên Bác Sĩ", "Trường", "Bệnh nhân", "Ngày khám", "Nơi"];
const source = [
  "dentistName",
  "organizationName",
  "patientName",
  "year",
  "examPlace",
];

const PaginationTable = React.forwardRef<any, any>(
  (
    {
      searchValues = "",
      name = "paginationTableService",
      dataSource,
      url = "",
      headRows = heads,
      mappingSource = source,
      havePagination = false,
      dataPath = "",
      onRowSelected,
      ...props
    }: IPaginationService,
    ref: any,
  ) => {
    const location = useLocation();
    const navigate = useNavigate();
    const totalPages = React.useRef(1);
    const isDesktop = useMediaQuery("(min-width:1024px)");

    const [pageNumber, setPageNumber] = React.useState(0);
    const [selectedRow, setSelectedRow] = React.useState("");
    const [dataAfterSort, setDataAfterSort] = React.useState<any>([]);
    const [expandedCards, setExpandedCards] = React.useState<Set<number>>(
      new Set(),
    );
    const valuesOfExam = `${searchValues}`;

    // Default all cards to expanded
    React.useEffect(() => {
      if (dataAfterSort?.length) {
        setExpandedCards(new Set(dataAfterSort.map((_: any, i: number) => i)));
      }
    }, [dataAfterSort?.length]);

    const toggleCard = (index: number) => {
      setExpandedCards((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    };

    const {
      data = dataAfterSort,
      error,
      refetch,
    } = useQuery(
      `${url}${valuesOfExam}`,
      () =>
        api.get(`${url}${valuesOfExam}`).then((response) => {
          totalPages.current = get(response, "data.totalPages");
          return get(response, dataPath).content
            ? get(response, dataPath).content
            : get(response, dataPath);
        }),
      {
        refetchOnWindowFocus: false,
      },
    );

    React.useEffect(() => {
      setDataAfterSort(data);
    }, [data]);

    React.useImperativeHandle(ref, () => ({ refetch }));

    React.useEffect(() => {
      const parsed = qs.parse(location.search);
      parsed.page = pageNumber as any;
      const stringified = qs.stringify(parsed);
      location.search = `?${stringified}`;
      const newUrl = `${location.pathname}${location.search}`;
      navigate(newUrl, { replace: true });
    }, [pageNumber]);

    const handleChangePageNumber = (e: any, page: number) => {
      setPageNumber(page);
    };

    const handleClickRow = (index: string, values: any) => {
      setSelectedRow(index);
      onRowSelected && onRowSelected(values);
    };

    const handleSort = () => {
      const dataSort = [...dataAfterSort].sort((a, b) =>
        a.id < b.id || a.id > b.id ? -1 : 1,
      );
      setDataAfterSort(dataSort);
    };

    if (error) return <div>Error...</div>;

    return (
      <>
        {/* ═══════════════ DESKTOP TABLE (≥1024px) ═══════════════ */}
        {isDesktop ? (
          <TableContainer component={Paper} className="relative">
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow className="bg-indigo-500 text-center text-white">
                  {headRows.map((row: string, index: number) => (
                    <TableCellStyled
                      className="py-3.5 pl-4 pr-3 text-white sm:pl-6 "
                      key={index}
                    >
                      <div className="flex justify-center">
                        {row}
                        {row === "Ngày khám" ? (
                          <a href="#" onClick={handleSort}>
                            <svg
                              className="ml-2 h-4 w-4"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </TableCellStyled>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dataAfterSort?.map((row: any, index: number) => (
                  <TableRow
                    onClick={() => handleClickRow(String(index), row)}
                    selected={String(index) === String(selectedRow)}
                    key={index}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    {mappingSource.map((item: any, itemIndex: number) => {
                      const isElement = React.isValidElement(
                        get(mappingSource, itemIndex),
                      );

                      return (
                        <TableDataStyled
                          className="cursor-pointer"
                          key={itemIndex}
                          component="th"
                          scope="row"
                        >
                          {isElement
                            ? get(mappingSource, itemIndex)
                            : get(row, get(mappingSource, itemIndex))}
                        </TableDataStyled>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* ═══════════════ TABLET & MOBILE CARDS (<1024px) ═══════════════ */
          <div className="flex flex-col gap-3">
            {dataAfterSort?.map((row: any, index: number) => {
              const isExpanded = expandedCards.has(index);
              // First column as primary identifier
              const primaryValue = get(row, get(mappingSource, 0));
              const secondaryValue = get(row, get(mappingSource, 1));

              return (
                <div
                  key={index}
                  className={`overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md ${
                    String(index) === String(selectedRow)
                      ? "border-indigo-400 ring-2 ring-indigo-200"
                      : "border-gray-200"
                  }`}
                >
                  {/* Card Header */}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    onClick={() => {
                      toggleCard(index);
                      handleClickRow(String(index), row);
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-gray-900">
                          {primaryValue}
                        </span>
                        {secondaryValue && (
                          <span className="block truncate text-xs text-gray-500">
                            {secondaryValue}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronIcon expanded={isExpanded} />
                  </button>

                  {/* Expandable Details */}
                  <div
                    className={`transition-all duration-200 ease-in-out ${
                      isExpanded
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <div className="border-t border-gray-100 px-4 py-3">
                      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {mappingSource.map((item: any, itemIndex: number) => {
                          const isElement = React.isValidElement(
                            get(mappingSource, itemIndex),
                          );
                          const value = isElement
                            ? get(mappingSource, itemIndex)
                            : get(row, get(mappingSource, itemIndex));

                          return (
                            <div key={itemIndex} className="flex flex-col py-1">
                              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                {headRows[itemIndex] ||
                                  `Column ${itemIndex + 1}`}
                              </dt>
                              <dd className="mt-0.5 break-words text-sm text-gray-900">
                                {value ?? "—"}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  </div>
                </div>
              );
            })}

            {(!dataAfterSort || dataAfterSort.length === 0) && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-sm text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end p-4">
          {havePagination && (
            <Pagination
              count={totalPages.current}
              page={pageNumber}
              variant="outlined"
              shape="rounded"
              onChange={handleChangePageNumber}
            />
          )}
        </div>
      </>
    );
  },
);

export default PaginationTable;
