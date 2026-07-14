import { useState, useEffect, isValidElement, Fragment } from "react";
import { TableColumn } from "./type";
import { CircularProgress } from "@mui/material";
import { TableEmpty } from "./EmptyState";

interface TableProps {
  columns?: TableColumn[];
  loading?: boolean;
  dataSource?: any[];
  onColumnClick?: any;
  emptyText?: string;
  /** Number of columns in the mobile card detail grid. Default 2. */
  mobileCardCols?: 1 | 2 | 3;
}

/** Chevron icon that rotates when expanded */
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

/**
 * Detect if a column is an "action" column.
 * Priority: explicit `isAction` flag → column title contains action-related keywords → value is JSX
 */
function isActionColumn(column: TableColumn, sampleValue?: any): boolean {
  if (column.isAction) return true;
  const title =
    typeof column.title === "string" ? column.title.toLowerCase() : "";
  if (
    ["thao tác", "action", "handle", ""].includes(title) &&
    isValidElement(sampleValue)
  )
    return true;
  return false;
}

export default function Table({
  columns,
  dataSource,
  onColumnClick,
  loading = false,
  emptyText,
  mobileCardCols = 2,
}: TableProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // Default all cards to expanded
  useEffect(() => {
    if (dataSource?.length) {
      setExpandedCards(new Set(dataSource.map((_, i) => i)));
    }
  }, [dataSource?.length]);

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Split columns into data columns and action columns
  const sampleItem = dataSource?.[0];
  const dataColumns =
    columns?.filter(
      (col) => !isActionColumn(col, sampleItem?.[col.dataIndex]),
    ) ?? [];
  const actionColumns =
    columns?.filter((col) =>
      isActionColumn(col, sampleItem?.[col.dataIndex]),
    ) ?? [];

  // For the card header, use the first two data columns (typically STT + name/code)
  const headerColumns = dataColumns.slice(0, 2);
  const detailColumns = dataColumns.slice(2);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center gap-4">
          <CircularProgress aria-label="Loading…" />
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : (
        <>
          {/* ═══════════════ DESKTOP TABLE (≥1024px) ═══════════════ */}
          <div className="hidden lg:block">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full cursor-pointer divide-y divide-gray-300 dark:divide-slate-700">
                    <thead className="theme-table-head bg-indigo-500 text-center text-white dark:bg-slate-800">
                      <tr>
                        {columns?.map((column, index) => (
                          <Fragment key={index}>
                            <th
                              scope="col"
                              className="py-3.5 pl-4 pr-3 text-center text-sm font-semibold sm:pl-6"
                            >
                              {column.title}
                            </th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    {dataSource && dataSource.length === 0 ? (
                      <TableEmpty
                        variant="desktop"
                        colSpan={columns?.length ?? 0}
                        emptyText={emptyText}
                      />
                    ) : (
                      <tbody className="theme-table-body-bg divide-y divide-gray-200 bg-white text-center dark:divide-slate-800 dark:bg-slate-900">
                        {dataSource?.map((item, index) => (
                          <tr
                            key={index}
                            className="theme-table-row-alt theme-table-row-hover even:bg-gray-50 hover:bg-gray-100 dark:even:bg-slate-800/50 dark:hover:bg-slate-800"
                            onClick={(e) =>
                              onColumnClick && onColumnClick(item)
                            }
                          >
                            {columns?.map((column, index) => {
                              return (
                                <td
                                  key={column.key ? column.key : index}
                                  className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-slate-200 sm:pl-6"
                                >
                                  {item[column.dataIndex]}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ TABLET & MOBILE CARDS (<900px) ═══════════════ */}
          <div className="flex flex-col gap-3 lg:hidden">
            {dataSource?.map((item, rowIndex) => {
              const isExpanded = expandedCards.has(rowIndex);

              return (
                <div
                  key={rowIndex}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                >
                  {/* ── Card Header (always visible) ── */}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    onClick={() => toggleCard(rowIndex)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* STT badge */}
                      {headerColumns[0] && (
                        <span className="theme-badge-bg inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                          {item[headerColumns[0].dataIndex]}
                        </span>
                      )}
                      {/* Primary identifier */}
                      {headerColumns[1] && (
                        <span className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {item[headerColumns[1].dataIndex]}
                        </span>
                      )}
                    </div>
                    <ChevronIcon expanded={isExpanded} />
                  </button>

                  {/* ── Expandable Details ── */}
                  <div
                    className={`transition-all duration-200 ease-in-out ${
                      isExpanded
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <div className="border-t border-gray-100 px-4 py-3 dark:border-slate-700">
                      {/* All detail columns as label-value pairs */}
                      <dl
                        className={`grid grid-cols-1 gap-2 ${
                          mobileCardCols === 1
                            ? ""
                            : mobileCardCols === 3
                            ? "sm:grid-cols-3"
                            : "sm:grid-cols-2"
                        }`}
                      >
                        {detailColumns.map((col, colIdx) => (
                          <div key={colIdx} className="flex flex-col py-1">
                            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                              {col.title}
                            </dt>
                            <dd className="mt-0.5 break-words text-sm text-gray-900 dark:text-slate-200">
                              {item[col.dataIndex] ?? "—"}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      {/* Action buttons */}
                      {actionColumns.length > 0 && (
                        <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 dark:border-slate-700">
                          {actionColumns.map((col, colIdx) => (
                            <div
                              key={colIdx}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item[col.dataIndex]}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Row click action */}
                      {onColumnClick && (
                        <button
                          type="button"
                          className="theme-action-text mt-3 w-full rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                          onClick={() => onColumnClick(item)}
                        >
                          Xem chi tiết →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {(!dataSource || dataSource.length === 0) && (
              <TableEmpty variant="mobile" emptyText={emptyText} />
            )}
          </div>
        </>
      )}
    </>
  );
}
