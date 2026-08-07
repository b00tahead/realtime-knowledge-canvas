export type ThemeMode = "dark" | "light";

export const THEME_MODES: readonly ThemeMode[] = ["dark", "light"];

export const THEME_LABELS: Record<ThemeMode, string> = {
  dark: "Dark",
  light: "Light",
};

export function isThemeMode(value: string): value is ThemeMode {
  return value === "dark" || value === "light";
}

/** CSS class applied to a root element to switch theme tokens. */
export function themeClassName(mode: ThemeMode): string {
  return `rkc-theme-${mode}`;
}

/**
 * Prefer stored preference, then system preference, then dark (product default).
 */
export function resolveInitialTheme(
  stored: string | null | undefined,
  prefersDark = true,
): ThemeMode {
  if (stored && isThemeMode(stored)) return stored;
  return prefersDark ? "dark" : "light";
}
