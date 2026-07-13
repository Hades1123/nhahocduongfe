/**
 * PaletteImport.tsx — VIEW: Import new palettes from Color Hunt URL or image.
 *
 * Two import methods:
 *
 * 1. URL Tab:
 *    User pastes a Color Hunt URL (e.g. https://colorhunt.co/palette/...)
 *    The hex codes are extracted from the URL slug (no fetch/CORS needed).
 *    Extracted colors are previewed before saving.
 *
 * 2. Image Tab:
 *    User drops or selects a Color Hunt palette image.
 *    The canvas median-cut algorithm extracts 4 dominant colors.
 *    Extracted colors are previewed before saving.
 *
 * After extraction, the user can name the palette and click "Thêm bảng màu"
 * to save it to the themeStore.
 */

import React, { useState, useRef, useCallback } from "react";
import {
  LinkIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import useThemeStore from "@/stores/themeStore";
import { extractColorsFromUrl, extractColorsFromImage } from "@/utils/colorExtractor";
import DraggablePalette from "./DraggablePalette";
import { v4 as uuidv4 } from "uuid";
import { Palette } from "@/types/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportTab = "url" | "image";

// ─── Component ────────────────────────────────────────────────────────────────

const PaletteImport: React.FC = () => {
  const addPalette = useThemeStore((s) => s.addPalette);
  const setActivePalette = useThemeStore((s) => s.setActivePalette);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<ImportTab>("url");

  // ── URL import state ──
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // ── Image import state ──
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Shared extracted-color state ──
  const [extractedColors, setExtractedColors] = useState<string[] | null>(null);
  const [paletteName, setPaletteName] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  /** Clear the extracted preview and reset the import form */
  const reset = () => {
    setExtractedColors(null);
    setPaletteName("");
    setUrlInput("");
    setUrlError(null);
    setImageError(null);
  };

  // ─── URL Import Handler ──────────────────────────────────────────────────────

  /**
   * Parse colors from the Color Hunt URL input.
   * Uses extractColorsFromUrl (pure string parsing — no network request).
   */
  const handleUrlExtract = async () => {
    setUrlError(null);
    setExtractedColors(null);

    if (!urlInput.trim()) {
      setUrlError("Vui lòng nhập URL.");
      return;
    }

    setUrlLoading(true);
    try {
      const colors = extractColorsFromUrl(urlInput);
      setExtractedColors(colors);
      // Auto-generate a palette name from the URL slug
      const slug = urlInput.match(/palette\/([a-f0-9]{24})/i)?.[1] ?? "";
      setPaletteName(`Color Hunt #${slug.slice(0, 6).toUpperCase()}`);
    } catch (err) {
      setUrlError((err as Error).message);
    } finally {
      setUrlLoading(false);
    }
  };

  // ─── Image Import Handlers ───────────────────────────────────────────────────

  /**
   * Process a dropped or selected image file.
   * Uses extractColorsFromImage (canvas-based median-cut).
   */
  const handleImageFile = useCallback(async (file: File) => {
    setImageError(null);
    setExtractedColors(null);
    setImageLoading(true);

    try {
      const colors = await extractColorsFromImage(file);
      setExtractedColors(colors);
      // Auto-generate name from filename
      const basename = file.name.replace(/\.[^.]+$/, "");
      setPaletteName(basename.slice(0, 30) || "Nhập từ ảnh");
    } catch (err) {
      setImageError((err as Error).message);
    } finally {
      setImageLoading(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  // ─── Save Handler ────────────────────────────────────────────────────────────

  /**
   * Save the extracted colors as a new palette in the store.
   * Immediately sets it as the active palette so the user sees the effect.
   */
  const handleSave = () => {
    if (!extractedColors || extractedColors.length < 4) return;

    const id = uuidv4();
    const name = paletteName.trim() || "Bảng màu tùy chỉnh";

    // Add to store — themeStore.addPalette adds isBuiltin:false and createdAt
    addPalette({
      id,
      name,
      colors: extractedColors.slice(0, 4) as [string, string, string, string],
    });

    // Immediately apply the new palette
    setActivePalette(id);

    // Show success animation
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      // Clear the import form
      reset();
    }, 1200);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Section label */}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Nhập bảng màu từ Color Hunt
      </h3>

      {/* ── Tab switcher ── */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800">
        {(["url", "image"] as ImportTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              if (extractedColors) {
                if (!window.confirm("Bạn sẽ mất màu đã trích xuất. Tiếp tục?")) return;
              }
              setActiveTab(tab);
              reset();
            }}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            ].join(" ")}
          >
            {tab === "url" ? (
              <><LinkIcon className="h-3.5 w-3.5" /> URL</>
            ) : (
              <><PhotoIcon className="h-3.5 w-3.5" /> Hình ảnh</>
            )}
          </button>
        ))}
      </div>

      {/* ── URL Tab ── */}
      {activeTab === "url" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dán URL bảng màu từ{" "}
            <a
              href="https://colorhunt.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--theme-primary)] underline"
            >
              colorhunt.co
            </a>
            . Ví dụ:{" "}
            <code className="rounded bg-gray-100 px-1 text-[11px] dark:bg-gray-800">
              colorhunt.co/palette/1b4332d8f3dc...
            </code>
          </p>

          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleUrlExtract()}
              placeholder="https://colorhunt.co/palette/..."
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={handleUrlExtract}
              disabled={urlLoading}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              {urlLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowDownTrayIcon className="h-4 w-4" />
              )}
              Nhập
            </button>
          </div>

          {urlError && (
            <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <XCircleIcon className="h-4 w-4 shrink-0" />
              {urlError}
            </p>
          )}
        </div>
      )}

      {/* ── Image Tab ── */}
      {activeTab === "image" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tải lên ảnh bảng màu từ Color Hunt. Hệ thống sẽ tự động trích xuất
            4 màu chủ đạo.
          </p>

          {/* Drag-and-drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-all duration-150",
              isDragOver
                ? "border-[var(--theme-primary)] bg-[rgba(var(--theme-primary-rgb),0.05)]"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50",
            ].join(" ")}
          >
            {imageLoading ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--theme-primary)] border-t-transparent" />
                <p className="text-sm text-gray-500">Đang phân tích ảnh...</p>
              </>
            ) : (
              <>
                <PhotoIcon className="h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kéo thả ảnh vào đây
                </p>
                <p className="text-xs text-gray-400">hoặc click để chọn file</p>
                <p className="text-xs text-gray-400">
                  Hỗ trợ: JPG, PNG, WebP
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />

          {imageError && (
            <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <XCircleIcon className="h-4 w-4 shrink-0" />
              {imageError}
            </p>
          )}
        </div>
      )}

      {/* ── Extracted color preview + save form ── */}
      {extractedColors && (
        <div className="rounded-xl border border-[var(--theme-primary)] bg-[rgba(var(--theme-primary-rgb),0.04)] p-4 dark:bg-[rgba(var(--theme-primary-rgb),0.08)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Màu đã trích xuất
            </span>
            <button
              type="button"
              onClick={reset}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Large swatches preview */}
          <div className="mt-2 mb-3">
            <DraggablePalette
              colors={extractedColors}
              onChange={(colors) => setExtractedColors(colors)}
              size={44}
            />
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              Kéo thả để sắp xếp lại thứ tự màu
            </p>
          </div>



          {/* Name input */}
          <input
            type="text"
            value={paletteName}
            onChange={(e) => setPaletteName(e.target.value)}
            placeholder="Đặt tên cho bảng màu..."
            maxLength={40}
            className="mb-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[var(--theme-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />

          {/* Save button — with success animation */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveSuccess}
            className={`w-full rounded-lg py-2 text-sm font-semibold text-white transition-all duration-300 ${
              saveSuccess
                ? "!bg-green-500 scale-[1.02]"
                : "hover:opacity-90"
            }`}
            style={saveSuccess ? {} : { backgroundColor: "var(--theme-primary)" }}
          >
            {saveSuccess ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Đã thêm!
              </span>
            ) : (
              "Thêm bảng màu"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaletteImport;
