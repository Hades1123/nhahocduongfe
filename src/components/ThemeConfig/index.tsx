/**
 * ThemeConfig/index.tsx — VIEW: Main theme configuration drawer panel.
 *
 * A sliding side-panel (drawer) that opens from the right side of the screen
 * when the user clicks the Cog icon in the Navbar.
 *
 * Layout:
 *   ┌─────────────────────────────────┐
 *   │  ⚙ Cài đặt giao diện      [X] │  ← Header (glassmorphism, auto-contrast)
 *   ├─────────────────────────────────┤
 *   │  Chế độ: [Sáng] [Tối]          │  ← ThemeModeToggle (always visible)
 *   │  ─── gradient divider ───────── │
 *   │  [Bảng màu] [Nhập màu]         │  ← Tab switcher
 *   │  Content per tab                │
 *   ├─────────────────────────────────┤
 *   │  Live Preview Strip             │  ← Mini UI mockup showing color mapping
 *   └─────────────────────────────────┘
 *
 * The panel is controlled by an `isOpen` prop from the Navbar.
 * A backdrop overlay closes it when clicked outside or clicking the same prop from the navbar.
 * Escape key also closes the drawer.
 */

import React, { Fragment, useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { XMarkIcon, Cog6ToothIcon, SwatchIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import ThemeModeToggle from "./ThemeModeToggle";
import PaletteTable from "./PaletteTable";
import PaletteImport from "./PaletteImport";
import useThemeStore from "@/stores/themeStore";
import PalettePreview from "./PalettePreview";
import { getContrastTextColor, getContrastSubtextColor } from "@/utils/contrastUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeConfigProps {
  /** Controls whether the drawer is visible */
  isOpen: boolean;
  /** Called when the drawer should close (X button or backdrop click) */
  onClose: () => void;
}

type ConfigTab = "palette" | "import";

// ─── Live Preview Strip ───────────────────────────────────────────────────────
// Mini mockup showing how the 4 palette colors map to real UI elements.

const LivePreviewStrip: React.FC<{ colors: [string, string, string, string] }> = ({ colors }) => {
  const [primary, secondary, accent, neutral] = colors;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800/50">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Xem trước bố cục
      </p>

      {/* Mini app mockup */}
      <div
        className="overflow-hidden rounded-md shadow-sm"
        style={{ border: "1px solid rgba(0,0,0,0.08)" }}
      >
        {/* Navbar mock */}
        <div
          className="flex items-center gap-1.5 px-2 py-1.5"
          style={{ backgroundColor: primary }}
        >
          <div className="h-2 w-2 rounded-full bg-white/60" />
          <div className="h-1.5 w-8 rounded bg-white/50" />
          <div className="ml-auto flex gap-1">
            <div
              className="h-3 w-8 rounded text-center text-[6px] font-bold leading-3"
              style={{ backgroundColor: secondary, color: "#fff" }}
            >
              Nút
            </div>
            <div
              className="h-3 w-6 rounded-full text-center text-[6px] font-bold leading-3"
              style={{ backgroundColor: accent, color: "#fff" }}
            >
              Tag
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ backgroundColor: neutral }} className="px-2 py-1.5">
          {/* Table mock */}
          <div className="overflow-hidden rounded-sm" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <div
              className="h-3 px-1 text-[5px] font-bold leading-3"
              style={{ backgroundColor: primary, color: "#fff" }}
            >
              Tiêu đề bảng
            </div>
            <div className="bg-white px-1 py-0.5">
              <div className="h-1 w-full rounded bg-gray-200" />
            </div>
            <div className="px-1 py-0.5" style={{ backgroundColor: neutral }}>
              <div className="h-1 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Color role labels */}
      <div className="mt-2 flex justify-between">
        {[
          { color: primary, label: "Chính" },
          { color: secondary, label: "Phụ" },
          { color: accent, label: "Nổi bật" },
          { color: neutral, label: "Nền" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color, border: "1px solid rgba(0,0,0,0.1)" }}
            />
            <span className="text-[9px] text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const ThemeConfig: React.FC<ThemeConfigProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>("palette");

  // Active palette info — shown in the drawer header as a live preview
  const getActivePalette = useThemeStore((s) => s.getActivePalette);
  const activePalette = getActivePalette();

  // Auto-contrast text colors for the header
  const headerTextColor = getContrastTextColor(activePalette.colors[0]);
  const headerSubtextColor = getContrastSubtextColor(activePalette.colors[0]);

  // 3.3 — Escape key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
          {/* ── Drawer header — glassmorphism + auto-contrast ── */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              backgroundColor: `rgba(var(--theme-primary-rgb), 0.92)`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: headerTextColor,
            }}
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
                  <span className="text-xs" style={{ color: headerSubtextColor }}>
                    {activePalette.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors hover:bg-white/20"
              style={{ color: headerSubtextColor }}
              aria-label="Đóng cài đặt"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* ── Drawer body — scrollable ── */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            {/* Light/Dark mode toggle — always visible regardless of tab */}
            <ThemeModeToggle />

            {/* Gradient divider — uses primary → secondary */}
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary), transparent)`,
              }}
            />

            {/* ── Tab switcher ── */}
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setActiveTab("palette")}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2",
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
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2",
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

          {/* ── Live Preview Strip ── */}
          <div className="border-t border-gray-200 bg-white px-5 py-3 dark:border-gray-700 dark:bg-gray-900">
            <LivePreviewStrip colors={activePalette.colors} />
          </div>
        </div>
      </Transition>

      {/* ARIA live region for palette change announcements */}
      <div aria-live="polite" className="sr-only">
        {isOpen && `Đang sử dụng bảng màu: ${activePalette.name}`}
      </div>
    </>
  );
};

export default ThemeConfig;
