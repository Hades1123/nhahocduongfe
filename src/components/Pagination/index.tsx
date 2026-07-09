import * as React from "react";
import { useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface NumberButtonType {
  content?: any;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface PaginationTableType {
  gotoPage?: any;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
  pageCount?: any;
  pageIndex?: any;
  handleGoBackPreviousPage?: () => void;
  handleGoToNextPage?: () => void;
}

function NumberButton({
  content,
  onClick,
  active,
  disabled,
}: NumberButtonType) {
  return (
    <button
      className={`flex h-9 w-9 cursor-pointer flex-col items-center justify-center rounded-lg text-sm font-normal shadow-[0_4px_10px_rgba(0,0,0,0.03)] transition-colors
      ${
        active
          ? "bg-indigo-600 dark:bg-indigo-500 text-white font-semibold ring-2 ring-indigo-300 dark:ring-indigo-400/50"
          : "font-medium text-gray-700 dark:text-slate-200"
      }
      ${
        !disabled && !active
          ? "bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
          : !active
            ? "cursor-not-allowed bg-white dark:bg-slate-800 text-gray-300 dark:text-slate-600"
            : ""
      }
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

export const PaginationTable = React.forwardRef<any, any>(
  (
    {
      gotoPage,
      canPreviousPage,
      canNextPage,
      pageCount,
      pageIndex,
      handleGoBackPreviousPage,
      handleGoToNextPage,
      ...props
    }: PaginationTableType,
    _ref,
  ) => {
    const renderPageLinks = useCallback(() => {
      if (pageCount === 0) return null;
      const visiblePageButtonCount = 10;
      let numberOfButtons =
        pageCount < visiblePageButtonCount ? pageCount : visiblePageButtonCount;
      const pageIndices = [pageIndex];
      numberOfButtons--;
      [...Array(numberOfButtons)].forEach((_item, itemIndex) => {
        const pageNumberBefore = pageIndices[0] - 1;
        const pageNumberAfter = pageIndices[pageIndices.length - 1] + 1;
        if (
          pageNumberBefore >= 0 &&
          (itemIndex < numberOfButtons / 2 || pageNumberAfter > pageCount - 1)
        ) {
          pageIndices.unshift(pageNumberBefore);
        } else {
          pageIndices.push(pageNumberAfter);
        }
      });
      return pageIndices.map((pageIndexToMap) => (
        <li key={pageIndexToMap}>
          <NumberButton
            content={pageIndexToMap + 1}
            onClick={() => gotoPage(pageIndexToMap)}
            active={pageIndex === pageIndexToMap}
          />
        </li>
      ));
    }, [pageCount, pageIndex]);

    return (
      <ul className="flex justify-end gap-2">
        <li>
          <NumberButton
            content={
              <div className="ml-1 flex">
                <FaChevronLeft size="0.6rem" />
                <FaChevronLeft size="0.6rem" className="-translate-x-1/2" />
              </div>
            }
            onClick={handleGoBackPreviousPage}
            disabled={!canPreviousPage}
          />
        </li>
        {renderPageLinks()}
        <li>
          <NumberButton
            content={
              <div className="ml-1 flex">
                <FaChevronRight size="0.6rem" />
                <FaChevronRight size="0.6rem" className="-translate-x-1/2" />
              </div>
            }
            onClick={handleGoToNextPage}
            disabled={!canNextPage}
          />
        </li>
      </ul>
    );
  },
);
