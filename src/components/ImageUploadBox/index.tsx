import { useCallback, useRef, useState } from "react";
import {
  ArrowUpTrayIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { uploadExamImage, deleteExamImage } from "@/lib/supabaseStorage";
import moment from "moment";
import "moment/locale/vi";

moment.locale("vi");

interface ImageUploadBoxProps {
  label: string;
  imageUrl?: string | null;
  imageTime?: string | null;
  folder: "upper" | "lower";
  loading?: boolean;
  onUploaded: (publicUrl: string, uploadedAt: string) => Promise<void>;
  onDeleted: () => Promise<void>;
}

/**
 * Box upload ảnh với đầy đủ CRUD:
 * - Create: Upload ảnh mới (click / drag-drop)
 * - Read: Xem ảnh phóng to (modal preview)
 * - Update: Chọn ảnh khác thay thế
 * - Delete: Xóa ảnh
 */
export default function ImageUploadBox({
  label,
  imageUrl,
  imageTime,
  folder,
  loading = false,
  onUploaded,
  onDeleted,
}: ImageUploadBoxProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (isoString?: string | null): string => {
    if (!isoString) return "";
    return moment(isoString).format("ddd h:mm A");
  };

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP).");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Ảnh không được vượt quá 10MB.");
        return;
      }

      setUploading(true);
      try {
        const { publicUrl, uploadedAt } = await uploadExamImage(file, folder);
        await onUploaded(publicUrl, uploadedAt);
      } catch (err: any) {
        alert(err.message || "Upload ảnh thất bại.");
      } finally {
        setUploading(false);
      }
    },
    [folder, onUploaded]
  );

  const handleDelete = async () => {
    if (!imageUrl) return;

    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa ảnh này? Thao tác không thể hoàn tác."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      // Xóa trên Supabase Storage trước
      await deleteExamImage(imageUrl);
      // Sau đó xóa reference trong backend
      await onDeleted();
    } catch (err: any) {
      alert(err.message || "Xóa ảnh thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Drag & drop handlers ──
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input để cho phép chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>
        <div className="animate-pulse">
          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700">
            <span className="text-gray-400">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>

      {imageUrl ? (
        /* ── Có ảnh: Hiển thị ảnh + actions ── */
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          {/* Ảnh thumbnail */}
          <div
            className="group relative cursor-pointer"
            onClick={() => setPreviewOpen(true)}
          >
            <img
              src={imageUrl}
              alt={label}
              className="aspect-square w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' fill='%23f3f4f6'><rect width='200' height='150'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'>Ảnh lỗi</text></svg>";
              }}
            />
            {/* Overlay khi hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <EyeIcon className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>

          {/* Footer: thời gian + action buttons */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 border-t border-transparent dark:border-slate-700 px-3 py-2">
            <span className="text-xs text-gray-500">
              {formatTime(imageTime)}
            </span>
            <div className="flex gap-1.5">
              {/* Update: chọn ảnh khác */}
              <button
                type="button"
                disabled={uploading || deleting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                title="Thay ảnh khác"
              >
                {uploading ? (
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                )}
                {uploading ? "Đang tải..." : "Đổi ảnh"}
              </button>

              {/* Delete */}
              <button
                type="button"
                disabled={uploading || deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                title="Xóa ảnh"
              >
                {deleting ? (
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <TrashIcon className="h-3.5 w-3.5" />
                )}
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Chưa có ảnh: Drop zone ── */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors ${
            dragOver
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
          }`}
        >
          {uploading ? (
            <>
              <svg
                className="h-10 w-10 animate-spin text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-indigo-600">Đang tải lên...</span>
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="h-10 w-10 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-indigo-600">
                  Nhấp hoặc kéo thả ảnh vào đây
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG, GIF, WebP (tối đa 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* ── Preview Modal (phóng to ảnh) ── */}
      {previewOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <img
            src={imageUrl}
            alt={label}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
