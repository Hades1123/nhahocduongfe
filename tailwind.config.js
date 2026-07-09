/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  /**
   * darkMode: 'class' — Tailwind activates dark: variants when <html> has class="dark".
   * The ThemeConfig system toggles this class via themeApplicator.ts.
   */
  darkMode: "class",
  theme: {
    extend: {
      /**
       * CSS custom-property based color tokens.
       * These are set dynamically by themeApplicator.ts on <html>.
       *
       * Usage in templates:
       *   bg-theme-primary, text-theme-secondary, border-theme-accent, etc.
       *
       * The fallback values match the default "Indigo" built-in palette.
       */
      colors: {
        theme: {
          primary:   "var(--theme-primary, #4f46e5)",
          secondary: "var(--theme-secondary, #818cf8)",
          accent:    "var(--theme-accent, #c7d2fe)",
          neutral:   "var(--theme-neutral, #e0e7ff)",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

