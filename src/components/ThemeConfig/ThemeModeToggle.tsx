/**
 * ThemeModeToggle.tsx — VIEW: Light / Dark mode toggle switch.
 *
 * Renders a visually distinct sun/moon animated toggle.
 * Reads mode from themeStore and dispatches setMode() on click.
 */

import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import useThemeStore from "@/stores/themeStore";
import { ThemeMode } from "@/types/theme";

const ThemeModeToggle: React.FC = () => {
  // Read current mode and the setter from the store
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  // Read active palette to enforce dark mode constraint
  const activePaletteId = useThemeStore((s) => s.activePaletteId);
  const isDarkModeDisabled = activePaletteId !== "builtin-indigo";

  const isDark = mode === "dark";

  /**
   * Toggle between light and dark mode.
   * The useTheme hook (mounted in App.tsx) will react to this state change
   * and call applyTheme(), adding/removing <html class="dark">.
   */
  const toggle = () => setMode(isDark ? "light" : "dark");

  return (
    <div className="flex flex-col gap-3">
      {/* Section label */}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Chế độ hiển thị
      </h3>

      {/* Toggle group */}
      <div className="flex items-center gap-3">
        {/* Light mode button */}
        <button
          type="button"
          onClick={() => setMode("light")}
          className={[
            "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
            mode === "light"
              ? "border-[var(--theme-primary)] bg-[rgba(var(--theme-primary-rgb),0.08)] text-[var(--theme-primary)]"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
          ].join(" ")}
          aria-pressed={mode === "light"}
          title="Chế độ sáng"
        >
          <SunIcon className="h-4 w-4" />
          <span>Sáng</span>
        </button>

        {/* Dark mode button */}
        <button
          type="button"
          onClick={() => setMode("dark")}
          disabled={isDarkModeDisabled}
          className={[
            "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
            mode === "dark"
              ? "border-[var(--theme-primary)] bg-[rgba(var(--theme-primary-rgb),0.08)] text-[var(--theme-primary)]"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
            isDarkModeDisabled && "opacity-50 cursor-not-allowed"
          ].join(" ")}
          aria-pressed={mode === "dark"}
          title={isDarkModeDisabled ? "Chỉ chủ đề Mặc định mới hỗ trợ chế độ tối" : "Chế độ tối"}
        >
          <MoonIcon className="h-4 w-4" />
          <span>Tối</span>
        </button>
      </div>

      {/* Descriptive text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isDark
          ? "Chế độ tối — nền tối với màu sắc từ bảng màu đã chọn"
          : "Chế độ sáng — nền trắng với màu sắc từ bảng màu đã chọn"}
      </p>
    </div>
  );
};

export default ThemeModeToggle;
