/**
 * PatientFilterPanel — Presentational component for cascading patient filters.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LAYOUT OVERVIEW                                                        ║
 * ║                                                                         ║
 * ║  Desktop (≥1024px):                                                     ║
 * ║  ┌────────────────────────────────────────────────────────────────────┐  ║
 * ║  │ [Province ▾]   [School ▾]    [Class ▾]    [Lọc]  [Đặt lại]      │  ║
 * ║  │                ↑ hint         ↑ hint                              │  ║
 * ║  └────────────────────────────────────────────────────────────────────┘  ║
 * ║  [Active filter chips: Tỉnh: X × | Trường: Y × | Lớp: Z ×]           ║
 * ║                                                                         ║
 * ║  Mobile (<1024px):                                                      ║
 * ║  ┌─ Bộ lọc (N) ────────────────────── [▾ toggle] ──┐                  ║
 * ║  │  [Province ▾]  (full width, stacked)              │                  ║
 * ║  │  [School ▾]                                       │                  ║
 * ║  │  [Class ▾]                                        │                  ║
 * ║  │  [Lọc]  [Đặt lại]                               │                  ║
 * ║  └───────────────────────────────────────────────────┘                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * This component receives ALL state and callbacks from the usePatientFilters
 * hook. It is purely presentational — no business logic or API calls here.
 */

import React, { useState, useMemo } from "react";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { XMarkIcon, FunnelIcon, ChevronDownIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import type { UsePatientFiltersReturn } from "../hooks/usePatientFilters";

// ═══════════════════════════════════════════════════════════════════════════
// Props — directly spreads the hook return type + isMobile flag
// ═══════════════════════════════════════════════════════════════════════════

interface PatientFilterPanelProps extends UsePatientFiltersReturn {
  /** Whether the viewport is below the mobile breakpoint (from useIsMobile) */
  isMobile: boolean;
  /** Callback to clear the text search input when "Đặt lại" is clicked */
  onResetSearchText?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

const PatientFilterPanel: React.FC<PatientFilterPanelProps> = ({
  draft,
  committed,
  provinceOptions,
  schoolOptions,
  classOptions,
  provincesLoading,
  schoolsLoading,
  onProvinceChange,
  onSchoolChange,
  onClassChange,
  commitFilters,
  resetFilters,
  loadProvinces,
  loadSchools,
  organizationType,
  isMobile,
  onResetSearchText,
}) => {
  // ─────────────────────────────────────────────────────────────────────
  // Mobile collapse state
  // ─────────────────────────────────────────────────────────────────────

  const [isCollapsed, setIsCollapsed] = useState(true);

  // ─────────────────────────────────────────────────────────────────────
  // Active filter count (for mobile badge + chip rendering)
  // ─────────────────────────────────────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (committed.province) count++;
    if (committed.school) count++;
    if (committed.classValue) count++;
    return count;
  }, [committed]);

  // ─────────────────────────────────────────────────────────────────────
  // Handle "Đặt lại" — also clears text search via parent callback
  // ─────────────────────────────────────────────────────────────────────

  const handleReset = () => {
    resetFilters();
    onResetSearchText?.();
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Render: OrganizationType Branch (School-level users)
  //
  // When the user belongs to a school, only the Class dropdown is shown.
  // Province and School selects are not rendered at all.
  // ═══════════════════════════════════════════════════════════════════════

  if (organizationType) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <Select
              label="Lớp"
              placeholder="Chọn lớp"
              value={draft.classValue}
              options={classOptions}
              onChange={onClassChange}
            />
          </div>
          <div className="flex gap-2">
            <Button variants="contained" onClick={commitFilters} className="flex items-center justify-center gap-1.5">
              <FunnelIcon className="h-4 w-4" /> Lọc
            </Button>
            <Button variants="outlined" onClick={handleReset} className="flex items-center justify-center gap-1.5">
              <ArrowPathIcon className="h-4 w-4" /> Đặt lại
            </Button>
          </div>
        </div>

        {/* ── Active filter chips (organizationType) ── */}
        {committed.classValue && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <FilterChip
              label={`Lớp: ${committed.classValue.label}`}
              onClear={() => {
                onClassChange(null);
                // Auto-commit when clearing via chip (convenience UX)
                // User expectation: clicking × on a chip immediately removes that filter
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Render: Full Filter Panel (Province → School → Class)
  // ═══════════════════════════════════════════════════════════════════════

  const filterContent = (
    <>
      {/* ── Three cascading dropdowns ── */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
        {/* ── Province Select ── */}
        <div onMouseDown={loadProvinces}>
          <Select
            label="Tỉnh/Thành"
            placeholder="Chọn tỉnh/thành"
            options={provinceOptions}
            value={draft.province}
            onChange={onProvinceChange}
            search={true}
            loading={provincesLoading}
          />
        </div>

        {/* ── School Select ── */}
        <div onMouseDown={loadSchools}>
          {/* Hint text: shown when no province is selected yet */}
          {!draft.province && (
            <span className="mb-0.5 block text-xs italic text-amber-500" style={{ minHeight: "1rem" }}>
              Vui lòng chọn Tỉnh/Thành phố
            </span>
          )}
          <Select
            label="Trường"
            placeholder="Chọn trường học"
            options={
              !draft.province
                ? [{ value: "", label: "Tất cả" }]
                : schoolOptions
            }
            value={draft.school}
            onChange={onSchoolChange}
            search={!!draft.province}
            loading={schoolsLoading}
            disabled={!draft.province}
          />
        </div>

        {/* ── Class Select ── */}
        <div>
          {/* Hint text: shown when no school is selected yet */}
          {!draft.school && (
            <span className="mb-0.5 block text-xs italic text-amber-500" style={{ minHeight: "1rem" }}>
              Vui lòng chọn Trường
            </span>
          )}
          <Select
            label="Lớp"
            placeholder="Chọn lớp"
            options={
              !draft.school
                ? [{ value: "", label: "Tất cả" }]
                : classOptions
            }
            value={draft.classValue}
            onChange={onClassChange}
            disabled={!draft.school}
          />
        </div>
      </div>

      {/* ── Action buttons: Lọc + Đặt lại ── */}
      <div className={`flex gap-2 ${isMobile ? "mt-3" : "mt-4"}`}>
        <Button variants="contained" onClick={commitFilters} className="flex items-center justify-center gap-1.5">
          <FunnelIcon className="h-4 w-4" /> Lọc
        </Button>
        <Button variants="outlined" onClick={handleReset} className="flex items-center justify-center gap-1.5">
          <ArrowPathIcon className="h-4 w-4" /> Đặt lại
        </Button>
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Desktop Layout: always visible filter row
  // ═══════════════════════════════════════════════════════════════════════

  if (!isMobile) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {filterContent}

        {/* ── Active filter chips ── */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {committed.province && (
              <FilterChip
                label={`Tỉnh: ${committed.province.label}`}
                onClear={() => onProvinceChange(null)}
              />
            )}
            {committed.school && (
              <FilterChip
                label={`Trường: ${committed.school.label}`}
                onClear={() => onSchoolChange(null)}
              />
            )}
            {committed.classValue && (
              <FilterChip
                label={`Lớp: ${committed.classValue.label}`}
                onClear={() => onClassChange(null)}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Mobile Layout: collapsible panel with toggle button
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* ── Toggle Header ── */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {activeFilterCount}
              </span>
            )}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            !isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Collapsible Content ── */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: isCollapsed ? "0px" : "600px",
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        <div className="border-t border-gray-200 p-4 dark:border-slate-700">
          {filterContent}
        </div>
      </div>

      {/* ── Active filter chips (always visible below toggle, even when collapsed) ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-4 py-2 dark:border-slate-700">
          {committed.province && (
            <FilterChip
              label={`Tỉnh: ${committed.province.label}`}
              onClear={() => onProvinceChange(null)}
            />
          )}
          {committed.school && (
            <FilterChip
              label={`Trường: ${committed.school.label}`}
              onClear={() => onSchoolChange(null)}
            />
          )}
          {committed.classValue && (
            <FilterChip
              label={`Lớp: ${committed.classValue.label}`}
              onClear={() => onClassChange(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Sub-component: FilterChip
//
// Renders a small tag showing an active filter value with a × clear button.
// e.g.  [Tỉnh: Hồ Chí Minh ×]
// ═══════════════════════════════════════════════════════════════════════════

interface FilterChipProps {
  label: string;
  onClear: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, onClear }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
    {label}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClear();
      }}
      className="ml-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-200 hover:text-indigo-700 focus:outline-none"
      title={`Xóa bộ lọc: ${label}`}
    >
      <XMarkIcon className="h-3 w-3" />
    </button>
  </span>
);

export default PatientFilterPanel;
