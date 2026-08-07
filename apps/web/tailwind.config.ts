import type { Config } from "tailwindcss";

/**
 * Tailwind utilities map to @rkc/design-system CSS variables.
 * Density/theme switches still work because values are var() references.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rkc: {
          bg: "var(--rkc-color-bg)",
          elevated: "var(--rkc-color-bg-elevated)",
          surface: "var(--rkc-color-surface)",
          "surface-hover": "var(--rkc-color-surface-hover)",
          border: "var(--rkc-color-border)",
          "border-strong": "var(--rkc-color-border-strong)",
          text: "var(--rkc-color-text)",
          muted: "var(--rkc-color-text-muted)",
          subtle: "var(--rkc-color-text-subtle)",
          accent: "var(--rkc-color-accent)",
          success: "var(--rkc-color-success)",
          warning: "var(--rkc-color-warning)",
          danger: "var(--rkc-color-danger)",
          focus: "var(--rkc-color-focus-ring)",
        },
      },
      fontFamily: {
        sans: "var(--rkc-font-sans)",
        mono: "var(--rkc-font-mono)",
      },
      fontSize: {
        "rkc-xs": "var(--rkc-font-size-xs)",
        "rkc-sm": "var(--rkc-font-size-sm)",
        "rkc-md": "var(--rkc-font-size-md)",
        "rkc-lg": "var(--rkc-font-size-lg)",
        "rkc-xl": "var(--rkc-font-size-xl)",
      },
      spacing: {
        "rkc-1": "var(--rkc-space-1)",
        "rkc-2": "var(--rkc-space-2)",
        "rkc-3": "var(--rkc-space-3)",
        "rkc-4": "var(--rkc-space-4)",
        "rkc-5": "var(--rkc-space-5)",
        "rkc-6": "var(--rkc-space-6)",
        "rkc-7": "var(--rkc-space-7)",
        "rkc-8": "var(--rkc-space-8)",
      },
      borderRadius: {
        "rkc-sm": "var(--rkc-radius-sm)",
        "rkc-md": "var(--rkc-radius-md)",
        "rkc-lg": "var(--rkc-radius-lg)",
      },
      maxWidth: {
        panel: "var(--rkc-panel-width)",
      },
      minHeight: {
        toolbar: "var(--rkc-toolbar-height)",
      },
      boxShadow: {
        "rkc-sm": "var(--rkc-shadow-sm)",
        "rkc-md": "var(--rkc-shadow-md)",
        "rkc-lg": "var(--rkc-shadow-lg)",
      },
      transitionDuration: {
        rkc: "var(--rkc-motion-duration)",
        "rkc-fast": "var(--rkc-motion-duration-fast)",
      },
    },
  },
  plugins: [],
} satisfies Config;
