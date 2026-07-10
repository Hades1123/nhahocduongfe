import { Combobox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export interface AutocompleteProps<T> {
  options?: T[];
  value?: T | null;
  onChange?: (selected: T | null) => void;
  name?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  getOptionLabel?: keyof T | ((option: T) => string);
  fullWidth?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string | any;
  loading?: boolean;
}

function Autocomplete<T>({
  options = [],
  value,
  onChange,
  name,
  label,
  placeholder = "",
  className = "",
  getOptionLabel = "name" as keyof T,
  fullWidth = true,
  disabled = false,
  required = false,
  error,
  loading = false,
}: AutocompleteProps<T>) {
  const [query, setQuery] = useState("");

  const getLabel = (option: T): string => {
    if (typeof getOptionLabel === "function") {
      return getOptionLabel(option);
    }
    return String((option as any)[getOptionLabel] ?? "");
  };

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          getLabel(option).toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <Combobox
      value={value}
      onChange={onChange}
      disabled={disabled}
      as="div"
      className={twMerge("relative w-72", fullWidth && "w-full", className)}
      name={name}
    >
      {label && (
        <Combobox.Label
          htmlFor={name}
          className="mb-1 block text-sm font-semibold leading-6 text-gray-900 dark:text-slate-100"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </Combobox.Label>
      )}

      <div className="relative">
        <Combobox.Input
          className={twMerge(
            "min-h-[36px] w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 pl-3 pr-10 text-left text-gray-900 dark:text-slate-100 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm",
            disabled && "bg-gray-200 dark:bg-slate-700 text-gray-500 cursor-not-allowed",
          )}
          placeholder={placeholder}
          displayValue={(option: T) => (option ? getLabel(option) : "")}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            // Khi focus vào, reset query để hiển thị tất cả options
            setQuery("");
          }}
          autoComplete="off"
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Combobox.Button>
      </div>

      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
        {loading ? (
          <div className="relative cursor-default select-none px-4 py-2 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : options.length === 0 ? (
          <div className="relative cursor-default select-none px-4 py-2 text-gray-500">
            Không có dữ liệu
          </div>
        ) : filteredOptions.length === 0 && query !== "" ? (
          <div className="relative cursor-default select-none px-4 py-2 text-gray-500">
            Không tìm thấy kết quả
          </div>
        ) : (
          filteredOptions.map((option, index) => (
            <Combobox.Option
              key={index}
              value={option}
              className={({ active, selected }) =>
                twMerge(
                  "relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-slate-200",
                  active && "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-200",
                  selected && "font-semibold bg-indigo-50 dark:bg-slate-700/50 dark:text-slate-100",
                )
              }
            >
              {({ selected }) => (
                <>
                  <span
                    className={twMerge(
                      "block truncate",
                      selected && "font-semibold",
                    )}
                  >
                    {getLabel(option)}
                  </span>
                  {selected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600">
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Combobox.Option>
          ))
        )}
      </Combobox.Options>

      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </Combobox>
  );
}

export default Autocomplete;
