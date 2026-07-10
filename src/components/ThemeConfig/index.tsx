/**
 * ThemeConfig/index.tsx — VIEW: Main theme configuration drawer panel.
 *
 * A sliding side-panel (drawer) that opens from the right side of the screen
 * when the user clicks the Cog icon in the Navbar.
 *
 * Layout:
 *   ┌─────────────────────────────────┐
 *   │  ⚙ Cài đặt giao diện      [X] │  ← Header
 *   ├─────────────────────────────────┤
 *   │  [Bảng màu] [Nhập màu]         │  ← Tab switcher
 *   ├─────────────────────────────────┤
 *   │  Chế độ: [Sáng] [Tối]          │  ← ThemeModeToggle (always visible)
 *   │  ─────────────────────────────  │
 *   │  Bảng màu ← PaletteTable       │  ← Content changes per tab
 *   │    or                          │
 *   │  Nhập màu ← PaletteImport      │
 *   └─────────────────────────────────┘
 *
 * The panel is controlled by an `isOpen` prop from the Navbar.
 * A backdrop overlay closes it when clicked outside.
 */

import React, { Fragment, useState } from "react";
import { Transition } from "@headlessui/react";
import { XMarkIcon, Cog6ToothIcon, SwatchIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import ThemeModeToggle from "./ThemeModeToggle";
import PaletteTable from "./PaletteTable";
import PaletteImport from "./PaletteImport";
import useThemeStore from "@/stores/themeStore";
import PalettePreview from "./PalettePreview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeConfigProps {
  /** Controls whether the drawer is visible */
  isOpen: boolean;
  /** Called when the drawer should close (X button or backdrop click) */
  onClose: () => void;
}

type ConfigTab = "palette" | "import";

// ─── Component ────────────────────────────────────────────────────────────────

const ThemeConfig: React.FC<ThemeConfigProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>("palette");

  // Active palette info — shown in the drawer header as a live preview
  const getActivePalette = useThemeStore((s) => s.getActivePalette);
  const activePalette = getActivePalette();

  return (
    <>
      {/* ── Backdrop overlay ──────────────────────────────────────────────── */}
      {/* Clicking outside the drawer closes it */}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition-opacity duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      </Transition>

      {/* ── Drawer panel ──────────────────────────────────────────────────── */}
      {/* Slides in from the right using translate-x transition */}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition-transform duration-300 ease-out"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transition-transform duration-200 ease-in"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <div
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-900"
          role="dialog"
          aria-modal="true"
          aria-label="Cài đặt giao diện"
        >
          {/* ── Drawer header ── */}
          <div
            className="flex items-center justify-between px-5 py-4 text-white"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            <div className="flex items-center gap-2.5">
              <Cog6ToothIcon className="h-5 w-5" />
              <div>
                <h2 className="text-base font-bold leading-tight">
                  Cài đặt giao diện
                </h2>
                {/* Live preview of currently applied palette */}
                <div className="mt-0.5 flex items-center gap-2">
                  <PalettePreview
                    palette={activePalette}
                    size={12}
                    gap={2}
                  />
                  <span className="text-xs text-white/80">
                    {activePalette.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Đóng cài đặt"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* ── Drawer body — scrollable ── */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            {/* Light/Dark mode toggle — always visible regardless of tab */}
            <ThemeModeToggle />

            {/* Divider */}
            <hr className="border-gray-200 dark:border-gray-700" />

            {/* ── Tab switcher ── */}
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setActiveTab("palette")}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  activeTab === "palette"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400",
                ].join(" ")}
              >
                <SwatchIcon className="h-4 w-4" />
                Bảng màu
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("import")}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  activeTab === "import"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400",
                ].join(" ")}
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Nhập màu
              </button>
            </div>

            {/* ── Tab content ── */}
            {activeTab === "palette" ? <PaletteTable /> : <PaletteImport />}
          </div>

          {/* ── Drawer footer ── */}
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Cài đặt được lưu tự động vào trình duyệt
            </p>
          </div>
        </div>
      </Transition>
    </>
  );
};

export default ThemeConfig;
