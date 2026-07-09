/**
 * PaletteTable.tsx — VIEW: Selectable palette list with delete action.
 *
 * Displays all available palettes (built-in + user-imported) as a
 * scrollable list. Each row shows:
 *   - Selection radio indicator (active highlight)
 *   - PalettePreview (4 color circles)
 *   - Palette name
 *   - Delete button (hidden for built-in palettes)
 *
 * Reads from and writes to themeStore.
 */

import React from "react";
import { TrashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import useThemeStore from "@/stores/themeStore";
import PalettePreview from "./PalettePreview";
import { Palette } from "@/types/theme";

const PaletteTable: React.FC = () => {
  // Read all palettes, the active ID, and action dispatchers from the store
  const palettes = useThemeStore((s) => s.palettes);
  const activePaletteId = useThemeStore((s) => s.activePaletteId);
  const setActivePalette = useThemeStore((s) => s.setActivePalette);
  const deletePalette = useThemeStore((s) => s.deletePalette);

  /**
   * Handle delete button click.
   * Shows a confirmation before removing — built-ins will be silently rejected
   * by the store, but we also hide the delete button for them in the UI.
   */
  const handleDelete = (e: React.MouseEvent, palette: Palette) => {
    // Prevent the row click (which would select the palette) from firing
    e.stopPropagation();

    const confirmed = window.confirm(
      `Xóa bảng màu "${palette.name}"?\nThao tác này không thể hoàn tác.`
    );
    if (confirmed) {
      deletePalette(palette.id);
    }
  };

  // Sort: built-ins first, then user palettes by creation date (newest last)
  const sorted = [...palettes].sort((a, b) => {
    if (a.isBuiltin && !b.isBuiltin) return -1;
    if (!a.isBuiltin && b.isBuiltin) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Section label */}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Bảng màu ({palettes.length})
      </h3>

      {/* Palette list */}
      <div
        className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900"
        role="listbox"
        aria-label="Chọn bảng màu"
      >
        {sorted.map((palette) => {
          const isActive = palette.id === activePaletteId;

          return (
            <button
              key={palette.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => setActivePalette(palette.id)}
              className={[
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-all duration-150",
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

              {/* 4-color circles preview */}
              <PalettePreview palette={palette} size={18} gap={3} />

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

              {/* Delete button — only for non-built-in palettes */}
              {!palette.isBuiltin && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, palette)}
                  className="ml-1 shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  title={`Xóa "${palette.name}"`}
                  aria-label={`Xóa bảng màu ${palette.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaletteTable;
