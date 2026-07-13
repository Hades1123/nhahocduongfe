/**
 * PalettePreview.tsx — VIEW: Visual preview of a 4-color palette.
 *
 * Renders 4 colored circles side-by-side so users can immediately
 * see what a palette looks like before selecting it.
 *
 * Used in: PaletteTable rows and PaletteImport extracted-color preview.
 */

import React from "react";
import { Palette } from "@/types/theme";

interface PalettePreviewProps {
  /** The palette whose colors to display */
  palette: Palette;
  /** Circle size in pixels (default: 20) */
  size?: number;
  /** Gap between circles in pixels (default: 4) */
  gap?: number;
  /** Optional extra className for the container */
  className?: string;
}

/**
 * Renders 4 colored circles representing the palette's color scheme.
 *
 * Circle semantic roles (left → right):
 *   ① Primary   ② Secondary   ③ Accent   ④ Neutral
 */
const PalettePreview: React.FC<PalettePreviewProps> = ({
  palette,
  size = 20,
  gap = 4,
  className = "",
}) => {
  // Semantic labels with application mapping for accessibility (screen readers, tooltips)
  const roles = [
    "Chính (Thanh điều hướng, nút bấm)",
    "Phụ (Hover, viền)",
    "Nổi bật (Huy hiệu, nhãn)",
    "Nền (Thẻ, bảng)",
  ];
  const shortRoles = ["Chính", "Phụ", "Nổi bật", "Nền"];

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: `${gap}px` }}
      aria-label={`Bảng màu: ${palette.name}`}
    >
      {palette.colors.map((color, index) => (
        <span
          key={index}
          title={`${roles[index]}: ${color}`}
          style={{
            backgroundColor: color,
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            display: "inline-block",
            // Subtle border to make light colors visible on white backgrounds
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            flexShrink: 0,
          }}
          aria-label={`${roles[index]}: ${color}`}
        />
      ))}
    </div>
  );
};

/**
 * Variant: Renders colors as rounded squares (good for larger previews).
 */
export const PaletteSwatches: React.FC<{
  colors: string[];
  size?: number;
}> = ({ colors, size = 32 }) => (
  <div className="flex gap-1">
    {colors.map((color, i) => (
      <div
        key={i}
        title={color}
        style={{
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: 6,
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      />
    ))}
  </div>
);

export default PalettePreview;
