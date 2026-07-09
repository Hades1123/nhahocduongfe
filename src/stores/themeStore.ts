/**
 * themeStore.ts — MODEL: Zustand store for the Color Theme feature.
 *
 * Responsibilities:
 *  - Persist theme state (palettes, active palette, mode) to localStorage
 *  - Expose typed state + action mutators
 *  - Ship 5 built-in palettes that cannot be deleted
 *
 * Architecture note:
 *  This is the single source of truth for the theme system.
 *  The View (ThemeConfig components) reads from and writes to this store.
 *  The Controller (themeApplicator.ts) reads from this store via useTheme hook.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Palette, ThemeMode, ThemeConfig } from "@/types/theme";

// ─── Built-in Palettes ────────────────────────────────────────────────────────
// These ship with the application and cannot be removed by users.
// Colors are ordered: [primary, secondary, accent, neutral]
const BUILTIN_PALETTES: Palette[] = [
  {
    id: "builtin-indigo",
    name: "Indigo (Mặc định)",
    colors: ["#4f46e5", "#818cf8", "#c7d2fe", "#e0e7ff"],
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "builtin-teal",
    name: "Teal Ocean",
    colors: ["#0d9488", "#2dd4bf", "#99f6e4", "#f0fdfa"],
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "builtin-rose",
    name: "Rose Bloom",
    colors: ["#e11d48", "#fb7185", "#fecdd3", "#fff1f2"],
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "builtin-amber",
    name: "Amber Glow",
    colors: ["#d97706", "#fbbf24", "#fde68a", "#fffbeb"],
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "builtin-violet",
    name: "Violet Dusk",
    colors: ["#7c3aed", "#a78bfa", "#ddd6fe", "#f5f3ff"],
    isBuiltin: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// ─── Default Palette ID ───────────────────────────────────────────────────────
// When this palette is active, the custom theme data attribute is NOT set,
// so all Tailwind defaults remain completely untouched.
export const DEFAULT_PALETTE_ID = "builtin-indigo";

// ─── Store Type ───────────────────────────────────────────────────────────────

interface ThemeStoreState extends ThemeConfig {
  /** Replace the currently active palette */
  setActivePalette: (id: string) => void;
  /** Switch between light and dark mode */
  setMode: (mode: ThemeMode) => void;
  /** Add a user-imported palette to the collection */
  addPalette: (palette: Omit<Palette, "isBuiltin" | "createdAt">) => void;
  /** Remove a custom palette by ID (built-ins are silently rejected) */
  deletePalette: (id: string) => void;
  /** Return the full Palette object for the currently active ID */
  getActivePalette: () => Palette;
  /**
   * Returns true when a non-default palette is selected.
   * Used by themeApplicator to decide whether to set data-custom-theme="active".
   * When false, all hook classes in index.css are inert → pure Tailwind defaults.
   */
  isCustomThemeActive: () => boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useThemeStore = create<ThemeStoreState>()(
  /**
   * persist middleware — saves the state to localStorage under key "theme-config".
   * On every store update, the latest state is automatically serialized.
   * On page load, the stored state is merged with any missing built-in palettes.
   */
  persist(
    (set, get) => ({
      // ── Initial state ──
      palettes: BUILTIN_PALETTES,
      activePaletteId: "builtin-indigo",
      mode: "light",

      // ── Actions ──

      /**
       * Set the active palette by ID.
       * This triggers useTheme to re-apply CSS custom properties.
       */
      setActivePalette: (id: string) => {
        // Validate the ID exists before switching
        const targetPalette = get().palettes.find((p) => p.id === id);
        if (!targetPalette) {
          console.warn(`[ThemeStore] Palette "${id}" not found.`);
          return;
        }

        // Enforce dark mode constraint: Only the default palette can use dark mode
        if (id !== DEFAULT_PALETTE_ID) {
          set({ activePaletteId: id, mode: "light" });
        } else {
          set({ activePaletteId: id });
        }
      },

      /**
       * Toggle between light and dark mode.
       * The themeApplicator will reflect this by adding/removing <html class="dark">.
       */
      setMode: (mode: ThemeMode) => {
        // Enforce dark mode constraint: Only the default palette can use dark mode
        const activePalette = get().getActivePalette();
        if (activePalette.id !== DEFAULT_PALETTE_ID && mode === "dark") {
          console.warn("[ThemeStore] Dark mode is disabled for non-default palettes.");
          return; // Ignore the state change
        }
        set({ mode });
      },

      /**
       * Add a new user-imported palette.
       * Automatically assigns createdAt and marks it as non-builtin.
       */
      addPalette: (palette) => {
        const newPalette: Palette = {
          ...palette,
          isBuiltin: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ palettes: [...state.palettes, newPalette] }));
      },

      /**
       * Delete a palette by ID.
       * Built-in palettes are protected from deletion.
       * If the deleted palette was active, fall back to the first built-in.
       */
      deletePalette: (id: string) => {
        const palette = get().palettes.find((p) => p.id === id);
        // Guard: do not delete built-in palettes
        if (!palette || palette.isBuiltin) {
          console.warn(`[ThemeStore] Cannot delete built-in palette "${id}".`);
          return;
        }

        set((state) => {
          const remaining = state.palettes.filter((p) => p.id !== id);
          // If we deleted the active palette, revert to the first built-in
          const newActiveId =
            state.activePaletteId === id
              ? BUILTIN_PALETTES[0].id
              : state.activePaletteId;
          return { palettes: remaining, activePaletteId: newActiveId };
        });
      },

      /**
       * Convenience getter — returns the full Palette object for the active ID.
       * Falls back to the first built-in if something is corrupted.
       */
      getActivePalette: () => {
        const state = get();
        return (
          state.palettes.find((p) => p.id === state.activePaletteId) ??
          BUILTIN_PALETTES[0]
        );
      },

      /**
       * Check if a non-default palette is currently active.
       * This gates the data-custom-theme attribute:
       *   true  → data-custom-theme="active" → hook classes fire with !important
       *   false → attribute removed → hook classes are inert → Tailwind defaults win
       */
      isCustomThemeActive: () => {
        return get().activePaletteId !== DEFAULT_PALETTE_ID;
      },
    }),
    {
      name: "theme-config", // localStorage key
      /**
       * After hydrating from localStorage, ensure all built-in palettes exist.
       * This handles the case where new built-ins are added in future updates
       * but old users already have saved state.
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const storedIds = new Set(state.palettes.map((p) => p.id));
        const missingBuiltins = BUILTIN_PALETTES.filter(
          (p) => !storedIds.has(p.id)
        );
        if (missingBuiltins.length > 0) {
          state.palettes = [
            ...missingBuiltins,
            // keep user palettes at the end
            ...state.palettes.filter((p) => !p.isBuiltin),
          ];
        }
      },
    }
  )
);

export default useThemeStore;
