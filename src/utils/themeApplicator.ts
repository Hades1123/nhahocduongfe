/**
 * themeApplicator.ts — CONTROLLER: CSS custom-property injection + data-attribute theming.
 *
 * ════════════════════════════════════════════════════════════════════════════════
 * CSS Override Strategy (THE CORE ARCHITECTURE):
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * 1. CSS custom properties (--theme-primary, etc.) are ALWAYS set on <html>,
 *    regardless of which palette is active. These are consumed by the
 *    ThemeConfig drawer components which always need to preview live colors.
 *
 * 2. The data attribute `data-custom-theme="active"` on <html> controls whether
 *    the utility hook classes in index.css actually fire:
 *
 *    • DEFAULT palette selected → attribute is REMOVED
 *      → Hook classes (.theme-navbar-bg, .theme-card-bg, etc.) do nothing
 *      → All Tailwind default classes (bg-indigo-600, bg-white, etc.) win
 *      → App looks identical to before the theme feature existed
 *
 *    • NON-DEFAULT palette selected → attribute is SET to "active"
 *      → Hook classes fire with !important, injecting var(--theme-primary), etc.
 *      → Tailwind defaults are overridden ONLY on elements with hook classes
 *      → Elements without hook classes are unaffected (safe opt-out)
 *
 * 3. Dark mode is controlled separately via class="dark" on <html> for Tailwind.
 *    Dark + custom theme can co-exist.
 *
 * CSS Variable Roles:
 *   --theme-primary      → Main brand color (navbar bg, primary buttons)
 *   --theme-secondary    → Complementary    (hover states, secondary buttons)
 *   --theme-accent       → Highlight color  (badges, tags, chips)
 *   --theme-neutral      → Subtle background (card surfaces, table stripe)
 */

import { Palette, ThemeMode } from "@/types/theme";

// ─── Main applicator ─────────────────────────────────────────────────────────

/**
 * Apply the given palette, mode, and custom-theme activation state to the document.
 *
 * This function:
 *   1. Sets CSS custom properties on <html> (ALWAYS, for ThemeConfig preview)
 *   2. Toggles data-custom-theme="active" on <html> (only when isCustom = true)
 *   3. Toggles class="dark" on <html> for Tailwind dark mode
 *   4. Updates the meta theme-color for mobile browsers
 *
 * @param palette  - The selected Palette object
 * @param mode     - 'light' | 'dark'
 * @param isCustom - Whether this is a non-default palette (gates the hook classes)
 */
export function applyTheme(
  palette: Palette,
  mode: ThemeMode,
  isCustom: boolean
): void {
  const root = document.documentElement; // <html>

  // ── Step 1: Always set CSS custom properties ──────────────────────────────
  // These are consumed by ThemeConfig drawer (which uses inline var() refs)
  // AND by the @layer utilities hook classes (when data-custom-theme is active).
  const [primary, secondary, accent, neutral] = palette.colors;

  root.style.setProperty("--theme-primary", primary);
  root.style.setProperty("--theme-secondary", secondary);
  root.style.setProperty("--theme-accent", accent);
  root.style.setProperty("--theme-neutral", neutral);

  // RGB triplet variants for rgba() compositing:
  //   background: rgba(var(--theme-primary-rgb), 0.1)
  root.style.setProperty("--theme-primary-rgb", hexToRgbTriplet(primary));
  root.style.setProperty("--theme-secondary-rgb", hexToRgbTriplet(secondary));
  root.style.setProperty("--theme-accent-rgb", hexToRgbTriplet(accent));
  root.style.setProperty("--theme-neutral-rgb", hexToRgbTriplet(neutral));

  // ── Step 2: Toggle data-custom-theme attribute ─────────────────────────────
  // This is the global trigger that activates/deactivates all hook classes.
  // When absent, .theme-navbar-bg etc. are inert → Tailwind defaults win.
  // When "active", .theme-navbar-bg etc. fire with !important → palette colors.
  if (isCustom) {
    root.setAttribute("data-custom-theme", "active");
  } else {
    root.removeAttribute("data-custom-theme");
  }

  // ── Step 3: Dark mode class toggle ────────────────────────────────────────
  // Tailwind's `darkMode: 'class'` checks for class="dark" on <html>.
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // ── Step 4: Update browser chrome color (mobile address bar) ──────────────
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      "content",
      mode === "dark" ? "#1e1e2e" : primary
    );
  }
}

// ─── Helper: hex → "R,G,B" triplet string ────────────────────────────────────

/**
 * Convert a hex color to a comma-separated RGB triplet string.
 * Used for CSS custom properties that need alpha compositing:
 *   var(--theme-primary-rgb) → "79,70,229"
 *
 * @param hex - CSS hex color (e.g. "#4f46e5")
 * @returns e.g. "79,70,229"
 */
function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  // Fallback for parsing failures
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "0,0,0";

  return `${r},${g},${b}`;
}
