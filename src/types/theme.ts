/**
 * theme.ts — MODEL: TypeScript type definitions for the Color Theme system.
 *
 * These types define the data shapes used throughout the entire feature:
 * - Palette: A named set of 4 hex colors
 * - ThemeMode: Light or dark
 * - ThemeConfig: The full persisted configuration
 */

// ─── Palette ─────────────────────────────────────────────────────────────────

/**
 * A color palette containing exactly 4 hex color strings.
 *
 * Color roles (by index):
 *   [0] → Primary   (main brand color, used for navbar, buttons)
 *   [1] → Secondary (complement, used for hover states, accents)
 *   [2] → Accent    (highlight, used for badges, tags, chips)
 *   [3] → Neutral   (background-adjacent, used for cards, sidebar)
 */
export interface Palette {
  /** Unique identifier (UUID or built-in slug) */
  id: string;
  /** Human-readable display name */
  name: string;
  /**
   * Array of exactly 4 hex color strings (with # prefix).
   * e.g. ["#4361ee", "#4cc9f0", "#f72585", "#3a0ca3"]
   */
  colors: [string, string, string, string];
  /** True for factory palettes that cannot be deleted by the user */
  isBuiltin?: boolean;
  /** ISO 8601 timestamp — when this palette was added */
  createdAt: string;
}

// ─── Mode ────────────────────────────────────────────────────────────────────

/**
 * Structural display mode.
 * - 'light': White backgrounds, dark text, palette accents
 * - 'dark' : Dark backgrounds, light text, palette accents
 */
export type ThemeMode = "light" | "dark";

// ─── Full Config ─────────────────────────────────────────────────────────────

/**
 * The complete theme configuration persisted to localStorage.
 * Managed by themeStore (Zustand).
 */
export interface ThemeConfig {
  /** ID of the currently selected palette */
  activePaletteId: string;
  /** Current display mode */
  mode: ThemeMode;
  /** All available palettes (built-in + user-imported) */
  palettes: Palette[];
}
