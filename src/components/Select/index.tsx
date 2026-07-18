import { Listbox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";
import { SelectProps } from "./type";
import Input from "../Input";
import ReplayIcon from "@mui/icons-material/Replay";
import { SearchOutlined } from "@mui/icons-material";
import { useState } from "react";
import { CircularProgress, Tooltip } from "@mui/material";

function renderOption(option: any, getOptionLabel: any): React.ReactNode {
  if (typeof getOptionLabel === "string") {
    return option[getOptionLabel];
  } else if (typeof getOptionLabel === "function") {
    return getOptionLabel(option);
  } else {
    return null;
  }
}

/**
 *
 * @param getOptionLabel: how option is displayed, can be a key of option item or JSX element
 * @param compactMulti: compact display mode for multi-select — 1 item → full name, >1 → "Name... (+N)"
 * @param onRemoveItem: called when user clicks X on a tag in compactMulti mode
 * @returns
 */
function Select<T>({
  options = [],
  value,
  onChange,
  multiple = false,
  name,
  label,
  placeholder = "",
  className = "",
  getOptionLabel = "label",
  getCompactLabel,
  fullWidth = true,
  disabled = false,
  required = false,
  search = false,
  error,
  compactMulti = false,
  loading = false,
  onRemoveItem,
}: SelectProps<T>) {
  const isCompactActive = compactMulti && multiple;
  const [searchValue, setSearchValue] = useState<string>("");

  const renderSelected = (selected: any): React.ReactNode => {
    if (!selected || (Array.isArray(selected) && selected.length === 0))
      return placeholder;

    // ── Compact multi mode ──
    if (isCompactActive && Array.isArray(selected)) {
      if (selected.length === 1)
        return renderOption(selected[0], getOptionLabel);
      const compactFn = getCompactLabel ?? getOptionLabel;
      const firstLabel =
        typeof compactFn === "function"
          ? compactFn(selected[0])
          : renderOption(selected[0], compactFn);
      return `${firstLabel}... (+${selected.length - 1})`;
    }

    let selectedLabel;
    if (Array.isArray(selected)) {
      selectedLabel = selected.map((item: any, idx: number) => {
        const itemLabel = renderOption(item, getOptionLabel);
        return (
          <span
            className="rounded-md bg-slate-200 px-1 dark:bg-slate-700"
            key={idx}
          >
            {itemLabel}
          </span>
        );
      });
    } else {
      selectedLabel = renderOption(selected, getOptionLabel);
    }
    return selectedLabel;
  };

  return (
    <div className={twMerge("relative w-72", fullWidth && "w-full", className)}>
      <Listbox
        value={value ?? null}
        onChange={onChange}
        disabled={disabled}
        multiple={multiple}
        as="div"
        name={name}
      >
        <Listbox.Label
          htmlFor={name}
          as="label"
          className="mb-1 block text-sm font-semibold leading-6 text-gray-900 dark:text-slate-100"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </Listbox.Label>
        <Listbox.Button className={twMerge("relative min-h-[36px] w-full cursor-default rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-10 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 dark:border-slate-700 dark:bg-slate-800 sm:text-sm", disabled && "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-slate-900")}>
          <span className="flex flex-wrap gap-1">
            {renderSelected(value ?? null)}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>

        <Listbox.Options className="absolute z-10 mt-1 max-h-72 w-full overflow-auto bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800 sm:text-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-4 p-4">
              <CircularProgress size={20} />
              <span>Đang tải...</span>
            </div>
          ) : (
            <>
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Không có dữ liệu
                </div>
              )}
              {search && options.length !== 0 && (
                <Input
                  className="sticky top-0 p-4"
                  startIcon={<SearchOutlined />}
                  value={searchValue}
                  endIcon={
                    <Tooltip
                      onClick={() => setSearchValue("")}
                      title={"Làm mới"}
                    >
                      <ReplayIcon className="hover:cursor-pointer" />
                    </Tooltip>
                  }
                  onChange={(e) => setSearchValue(e.currentTarget.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              )}
              {options
                .filter((option) => {
                  if (!searchValue) return true;
                  const label = renderOption(option, getOptionLabel);
                  return String(label)
                    .toLowerCase()
                    .includes(searchValue.toLowerCase().trim());
                })
                .map((option, index) => (
                  <Listbox.Option
                    key={index}
                    value={option}
                    className={({ active, selected }) =>
                      twMerge(
                        "cursor-default select-none py-2 pl-3 pr-9",
                        active &&
                          "cursor-pointer bg-blue-100 text-blue-900 dark:bg-indigo-900/50 dark:text-indigo-200",
                        selected && "font-semibold",
                      )
                    }
                  >
                    {({ active, selected }) => (
                      <div className="flex items-center">
                        <span
                          className={twMerge(
                            "ml-3 block ",
                            selected && "font-semibold",
                          )}
                        >
                          {renderOption(option, getOptionLabel)}
                        </span>
                        {selected && (
                          <span className="ml-auto">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
            </>
          )}
        </Listbox.Options>
      </Listbox>

      {error && (
        <p className="absolute -bottom-6 text-sm text-red-600" id="email-error">
          {error}
        </p>
      )}

      {/* ── Tag chips below dropdown (compactMulti mode) ── */}
      {isCompactActive && value && Array.isArray(value) && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((item: any, idx: number) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
            >
              {renderOption(item, getOptionLabel)}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveItem?.(item);
                }}
                className="ml-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-200 hover:text-indigo-700 focus:outline-none"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Select;
