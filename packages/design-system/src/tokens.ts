/**
 * Token catalog for docs, tests, and the in-app gallery.
 * Values mirror CSS custom properties in tokens.css (names only — runtime reads CSS).
 */

export const COLOR_TOKEN_NAMES = [
  "bg",
  "bg-elevated",
  "surface",
  "surface-hover",
  "surface-active",
  "border",
  "border-strong",
  "text",
  "text-muted",
  "text-subtle",
  "accent",
  "accent-hover",
  "success",
  "warning",
  "danger",
  "info",
  "focus-ring",
] as const;

export type ColorTokenName = (typeof COLOR_TOKEN_NAMES)[number];

export const NOTE_COLOR_TOKEN_NAMES = [
  "yellow",
  "blue",
  "green",
  "pink",
  "purple",
  "orange",
] as const;

export type NoteColorTokenName = (typeof NOTE_COLOR_TOKEN_NAMES)[number];

export function colorCssVar(name: ColorTokenName): string {
  return `var(--rkc-color-${name})`;
}

export function noteColorCssVar(name: NoteColorTokenName): string {
  return `var(--rkc-note-${name})`;
}

/** Semantic color tokens shown in the design-system gallery. */
export const GALLERY_COLOR_TOKENS: ReadonlyArray<{
  name: ColorTokenName;
  label: string;
}> = [
  { name: "bg", label: "Background" },
  { name: "surface", label: "Surface" },
  { name: "border", label: "Border" },
  { name: "text", label: "Text" },
  { name: "text-muted", label: "Muted" },
  { name: "accent", label: "Accent" },
  { name: "success", label: "Success" },
  { name: "warning", label: "Warning" },
  { name: "danger", label: "Danger" },
  { name: "focus-ring", label: "Focus" },
];
