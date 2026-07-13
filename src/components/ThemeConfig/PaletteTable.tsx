/**
 * PaletteTable.tsx — VIEW: Selectable palette list with customize & delete actions.
 *
 * Displays all available palettes (built-in + user-imported) as a
 * scrollable list. Each row shows:
 *   - Selection radio indicator (active highlight)
 *   - PalettePreview (4 color circles)
 *   - Palette name
 *   - Customize button (non-built-in only) → expands inline DraggablePalette
 *   - Delete button (non-built-in only) → inline confirmation with undo
 *
 * Reads from and writes to themeStore.
 */

import React, { useState, useEffect } from "react";
import { TrashIcon, CheckCircleIcon, AdjustmentsHorizontalIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import useThemeStore from "@/stores/themeStore";
import PalettePreview from "./PalettePreview";
import { Palette } from "@/types/theme";
import DraggablePalette from "./DraggablePalette";

// ─── Role Legend ──────────────────────────────────────────────────────────────

const ROLE_LEGEND = [
  { label: "Chính", hint: "Navbar, Nút" },
  { label: "Phụ", hint: "Hover" },
  { label: "Nổi bật", hint: "Badge" },
  { label: "Nền", hint: "Cards" },
];

// ─── Undo Toast ───────────────────────────────────────────────────────────────

interface UndoState {
  palette: Palette;
  timeoutId: ReturnType<typeof setTimeout>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PaletteTable: React.FC = () => {
  // Read all palettes, the active ID, and action dispatchers from the store
  const palettes = useThemeStore((s) => s.palettes);
  const activePaletteId = useThemeStore((s) => s.activePaletteId);
  const setActivePalette = useThemeStore((s) => s.setActivePalette);
  const deletePalette = useThemeStore((s) => s.deletePalette);
  const addPalette = useThemeStore((s) => s.addPalette);
  const updatePaletteColors = useThemeStore((s) => s.updatePaletteColors);

  const [customizingId, setCustomizingId] = useState<string | null>(null);
  const [draftColors, setDraftColors] = useState<string[]>([]);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  // Cleanup undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoState) clearTimeout(undoState.timeoutId);
    };
  }, [undoState]);

  /**
   * Handle delete: show inline confirmation first
   */
  const handleDeleteConfirm = (e: React.MouseEvent, palette: Palette) => {
    e.stopPropagation();
    setConfirmingDeleteId(palette.id);
  };

  const handleDeleteExecute = (e: React.MouseEvent, palette: Palette) => {
    e.stopPropagation();
    setConfirmingDeleteId(null);

    // Save palette data for undo
    const savedPalette = { ...palette };
    deletePalette(palette.id);

    // Clear any existing undo timeout
    if (undoState) clearTimeout(undoState.timeoutId);

    // Set up undo with 5s timeout
    const timeoutId = setTimeout(() => {
      setUndoState(null);
    }, 5000);

    setUndoState({ palette: savedPalette, timeoutId });
  };

  const handleUndo = () => {
    if (!undoState) return;
    clearTimeout(undoState.timeoutId);
    // Re-add the palette
    addPalette({
      id: undoState.palette.id,
      name: undoState.palette.name,
      colors: undoState.palette.colors,
    });
    setUndoState(null);
  };

  // Sort: built-ins first, then user palettes by creation date (newest last)
  const sorted = [...palettes].sort((a, b) => {
    if (a.isBuiltin && !b.isBuiltin) return -1;
    if (!a.isBuiltin && b.isBuiltin) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const hasCustomPalettes = palettes.some((p) => !p.isBuiltin);

  return (
    <div className="flex flex-col gap-2">
      {/* Section label */}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Bảng màu ({palettes.length})
      </h3>

      {/* Role legend */}
      <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-800/50">
        {ROLE_LEGEND.map(({ label, hint }, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {label}
            </span>
            <span className="text-[8px] text-gray-400 dark:text-gray-500">{hint}</span>
          </div>
        ))}
      </div>

      {/* Undo toast */}
      {undoState && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-900/20">
          <span className="flex-1 text-xs text-amber-800 dark:text-amber-200">
            Đã xóa bảng màu &quot;{undoState.palette.name}&quot;
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-800/30"
          >
            <ArrowUturnLeftIcon className="h-3 w-3" />
            Hoàn tác
          </button>
        </div>
      )}

      {/* Palette list */}
      <div
        className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900"
        role="listbox"
        aria-label="Chọn bảng màu"
      >
        {sorted.map((palette) => {
          const isActive = palette.id === activePaletteId;
          const isCustomizing = customizingId === palette.id;
          const isConfirmingDelete = confirmingDeleteId === palette.id;

          return (
            <div key={palette.id} className="flex flex-col">
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => setActivePalette(palette.id)}
                className={[
                  "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-1",
                  isActive
                    ? "bg-white shadow-sm ring-2 ring-[var(--theme-primary)] dark:bg-gray-800"
                    : "hover:bg-white dark:hover:bg-gray-800",
                ].join(" ")}
              >
                {/* Active/inactive checkmark indicator */}
                {isActive ? (
                  <CheckCircleSolid
                    className="h-5 w-5 shrink-0"
                    style={{ color: "var(--theme-primary)" }}
                  />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />
                )}

                {/* 4-color circles preview — fan-out on hover */}
                <div className="flex items-center transition-all duration-200 group-hover:gap-1">
                  <PalettePreview palette={palette} size={18} gap={3} />
                </div>

                {/* Palette name */}
                <span
                  className={[
                    "flex-1 truncate text-sm",
                    isActive
                      ? "font-semibold text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300",
                  ].join(" ")}
                >
                  {palette.name}
                </span>

                {/* Built-in badge */}
                {palette.isBuiltin && (
                  <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    Mặc định
                  </span>
                )}

                {/* Customize button — only for non-built-in palettes */}
                {!palette.isBuiltin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCustomizing) {
                        setCustomizingId(null);
                      } else {
                        setCustomizingId(palette.id);
                        setDraftColors([...palette.colors]);
                        setConfirmingDeleteId(null);
                      }
                    }}
                    className={`shrink-0 rounded p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] ${
                      isCustomizing
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    }`}
                    title={`Tùy chỉnh "${palette.name}"`}
                    aria-label={`Tùy chỉnh bảng màu ${palette.name}`}
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  </button>
                )}

                {/* Delete button — only for non-built-in palettes */}
                {!palette.isBuiltin && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConfirm(e, palette)}
                    className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-900/30"
                    title={`Xóa "${palette.name}"`}
                    aria-label={`Xóa bảng màu ${palette.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </button>

              {/* Inline delete confirmation */}
              {isConfirmingDelete && (
                <div className="mx-2 mt-1 mb-1 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
                  <span className="flex-1 text-xs text-red-700 dark:text-red-300">
                    Xóa &quot;{palette.name}&quot;?
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(null); }}
                    className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteExecute(e, palette)}
                    className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </div>
              )}

              {/* Expanded customize panel — smooth accordion */}
              <div
                className="grid transition-all duration-200 ease-out"
                style={{
                  gridTemplateRows: isCustomizing ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <div className="mx-2 mt-1 mb-2 rounded-md border border-[var(--theme-primary)] bg-[rgba(var(--theme-primary-rgb),0.04)] p-3 shadow-inner dark:bg-[rgba(var(--theme-primary-rgb),0.08)]">
                    <DraggablePalette
                      colors={draftColors}
                      onChange={setDraftColors}
                      size={36}
                    />

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomizingId(null)}
                        className="flex-1 rounded border border-gray-300 bg-white py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updatePaletteColors(palette.id, draftColors as [string, string, string, string]);
                          setCustomizingId(null);
                        }}
                        className="flex-1 rounded py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                        style={{ backgroundColor: "var(--theme-primary)" }}
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state for custom palettes */}
        {!hasCustomPalettes && (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chưa có bảng màu tùy chỉnh
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Nhập màu từ Color Hunt để bắt đầu! →
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaletteTable;
