/**
 * contrastUtils.ts — Utility for ensuring readable text on dynamic background colors.
 *
 * When the theme system applies a user-chosen primary color to surfaces like
 * the drawer header or buttons, the text color (white or dark) must adapt
 * to maintain sufficient contrast (WCAG AA ≥ 4.5:1).
 *
 * Uses the W3C relative luminance formula to decide if text should be
 * light or dark on a given background.
 */

/**
 * Compute the relative luminance of a hex color.
 * Based on WCAG 2.0 formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 *
 * @param hex - CSS hex color string (e.g. "#4f46e5")
 * @returns Relative luminance value between 0 (black) and 1 (white)
 */
function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Determine if text on a given background color should be dark or light.
 *
 * Uses relative luminance: if the background is "bright" (luminance > 0.45),
 * dark text is needed for readability. Otherwise, white text works.
 *
 * @param bgHex - Background hex color (e.g. "#fbbf24")
 * @returns "dark" if dark text is needed, "light" if white text works
 */
export function getContrastTextMode(bgHex: string): "dark" | "light" {
  try {
    const lum = relativeLuminance(bgHex);
    return lum > 0.45 ? "dark" : "light";
  } catch {
    return "light"; // Safe fallback
  }
}

/**
 * Returns a Tailwind-friendly text color class based on background contrast.
 *
 * @param bgHex - Background hex color
 * @returns CSS class string for text color
 */
export function getContrastTextClass(bgHex: string): string {
  return getContrastTextMode(bgHex) === "dark"
    ? "text-gray-900"
    : "text-white";
}

/**
 * Returns a CSS color string for text based on background contrast.
 *
 * @param bgHex - Background hex color
 * @returns "rgba(0,0,0,0.87)" for dark text or "#ffffff" for light text
 */
export function getContrastTextColor(bgHex: string): string {
  return getContrastTextMode(bgHex) === "dark"
    ? "rgba(0,0,0,0.87)"
    : "#ffffff";
}

/**
 * Returns a semi-transparent variant for subtitles/secondary text.
 *
 * @param bgHex - Background hex color
 * @returns CSS color string with reduced opacity
 */
export function getContrastSubtextColor(bgHex: string): string {
  return getContrastTextMode(bgHex) === "dark"
    ? "rgba(0,0,0,0.55)"
    : "rgba(255,255,255,0.75)";
}
