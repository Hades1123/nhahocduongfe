/**
 * Empty table state — shown when dataSource is empty or undefined.
 * Renders differently on desktop (full-width table row) vs mobile (standalone card).
 */
export function TableEmpty({
  colSpan,
  variant = "desktop",
  emptyText,
}: {
  colSpan?: number;
  variant?: "desktop" | "mobile";
  emptyText?: string;
}) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Inline SVG: empty inbox illustration */}
      <svg
        className="mb-4 h-20 w-20 text-gray-300"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tray */}
        <rect
          x="10"
          y="45"
          width="80"
          height="45"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        {/* Left paper */}
        <rect
          x="25"
          y="20"
          width="22"
          height="30"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Right paper */}
        <rect
          x="53"
          y="15"
          width="22"
          height="35"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Center paper (slightly overlapping) */}
        <rect
          x="39"
          y="10"
          width="22"
          height="40"
          rx="2"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="white"
        />
        {/* Lines on center paper */}
        <line
          x1="46"
          y1="20"
          x2="54"
          y2="20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1="46"
          y1="26"
          x2="54"
          y2="26"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1="46"
          y1="32"
          x2="50"
          y2="32"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <p className="text-sm font-semibold text-gray-500">
        {emptyText ?? "Không có dữ liệu"}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Dữ liệu sẽ hiển thị tại đây khi có
      </p>
    </div>
  );

  if (variant === "desktop" && colSpan) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="bg-white">
            {content}
          </td>
        </tr>
      </tbody>
    );
  }

  // Mobile variant
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white py-4">
      {content}
    </div>
  );
}
