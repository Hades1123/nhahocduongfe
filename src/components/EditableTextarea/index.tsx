import { useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";

interface EditableTextareaProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  loading?: boolean;
  onSave: (newValue: string) => Promise<void>;
}

/**
 * Textarea với 2 trạng thái:
 * - Read-only: hiển thị nội dung + nút "Edit"
 * - Editing: hiển thị textarea + nút "Save" / "Cancel"
 */
export default function EditableTextarea({
  label,
  value,
  placeholder = "Nhập nội dung...",
  loading = false,
  onSave,
}: EditableTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setText(value || "");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setText(value || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(text);
      setEditing(false);
    } catch (err) {
      console.error("Lưu thất bại:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>

      {loading ? (
        /* Skeleton loading */
        <div className="animate-pulse">
          <div className="h-24 w-full rounded-lg bg-gray-200 dark:bg-slate-700" />
        </div>
      ) : editing ? (
        /* ── Editing state ── */
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full resize-y rounded-lg border border-indigo-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
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
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        /* ── Read-only state ── */
        <div className="group relative rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-3">
          <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-slate-200">
            {value || (
              <span className="italic text-gray-400">Chưa có nội dung</span>
            )}
          </p>
          <button
            type="button"
            onClick={handleEdit}
            className="absolute right-2 top-2 rounded-md bg-white dark:bg-slate-700 p-1.5 text-gray-500 dark:text-slate-300 opacity-0 shadow-sm transition-opacity hover:bg-indigo-50 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 group-hover:opacity-100 focus:opacity-100"
            title="Chỉnh sửa"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
