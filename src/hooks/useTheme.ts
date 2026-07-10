/**
 * useTheme.ts — Hook: Bridges themeStore → themeApplicator.
 *
 * This hook:
 *  1. Subscribes to the Zustand themeStore (palette ID, mode)
 *  2. Calls applyTheme() whenever activePaletteId or mode changes
 *  3. Passes `isCustom` flag so the applicator knows whether to set
 *     the data-custom-theme attribute (which activates CSS hook classes)
 *  4. Also applies on initial mount (to restore saved theme on page load)
 *
 * Usage: Call `useTheme()` once at the App.tsx root level.
 * It has no return value — it's a side-effect-only hook.
 */

import { useEffect } from "react";
import useThemeStore from "@/stores/themeStore";
import { applyTheme } from "@/utils/themeApplicator";

/**
 * Mount this hook once in App.tsx to globally manage theme application.
 *
 * Example:
 *   function App() {
 *     useTheme(); // ← apply saved theme on load, react to future changes
 *     return <AppRoutes />;
 *   }
 */
export function useTheme(): void {
  // Subscribe to the specific store slices we care about
  const activePaletteId = useThemeStore((s) => s.activePaletteId);
  const mode = useThemeStore((s) => s.mode);
  const getActivePalette = useThemeStore((s) => s.getActivePalette);
  const isCustomThemeActive = useThemeStore((s) => s.isCustomThemeActive);

  useEffect(() => {
    // Resolve the full Palette object from the active ID
    const palette = getActivePalette();

    // Determine if this is a non-default palette
    // When false → data-custom-theme is removed → hook classes are inert
    // When true  → data-custom-theme="active"  → hook classes fire
    const isCustom = isCustomThemeActive();

    // Apply to <html> — sets CSS vars, toggles data attribute, toggles dark class
    applyTheme(palette, mode, isCustom);
  }, [activePaletteId, mode, getActivePalette, isCustomThemeActive]);
}
