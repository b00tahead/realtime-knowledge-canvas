/** Parse #RGB, #RRGGBB, or #RRGGBBAA into RGBA 0–1. Falls back to accent blue. */
export function parseColor(
  input: string | undefined,
  fallback: readonly [number, number, number, number] = [0.43, 0.66, 1, 0.45],
): readonly [number, number, number, number] {
  if (!input) return fallback;
  let hex = input.trim();
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6 && hex.length !== 8) return fallback;
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  const a =
    hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return fallback;
  return [r, g, b, a];
}

export function rgbaToCss(
  c: readonly [number, number, number, number],
): string {
  const r = Math.round(c[0] * 255);
  const g = Math.round(c[1] * 255);
  const b = Math.round(c[2] * 255);
  return `rgba(${r},${g},${b},${c[3].toFixed(3)})`;
}

/** Soften a saturated color into an Excalidraw-like translucent fill. */
export function sketchFill(
  color: readonly [number, number, number, number],
  alpha = 0.38,
): readonly [number, number, number, number] {
  // Lift toward white slightly so fills read as wash, not sticky-note plastic
  const lift = 0.22;
  return [
    Math.min(1, color[0] + (1 - color[0]) * lift),
    Math.min(1, color[1] + (1 - color[1]) * lift),
    Math.min(1, color[2] + (1 - color[2]) * lift),
    alpha * (color[3] ?? 1),
  ];
}

/**
 * Ink stroke with a hint of the fill hue.
 * `surface: "dark"` → light chalky stroke; `"light"` → dark pen stroke.
 */
export function sketchStroke(
  color: readonly [number, number, number, number],
  surface: "dark" | "light" = "dark",
  alpha = 0.92,
): readonly [number, number, number, number] {
  if (surface === "dark") {
    // Chalk / light ink on dark board
    const lift = 0.7;
    return [
      Math.min(1, color[0] * 0.28 + lift),
      Math.min(1, color[1] * 0.28 + lift),
      Math.min(1, color[2] * 0.28 + lift),
      alpha,
    ];
  }
  // Near-black pen with a touch of the note color
  const mix = 0.2;
  return [
    color[0] * mix,
    color[1] * mix,
    color[2] * mix,
    alpha,
  ];
}

/**
 * Excalidraw-adjacent pastel palette (fill-oriented hex).
 * Strokes are derived via sketchStroke().
 */
export const NOTE_PALETTE_HEX = [
  "#ffec99", // yellow
  "#a5d8ff", // blue
  "#b2f2bb", // green
  "#ffc9c9", // red/pink
  "#d0bfff", // purple
  "#ffd8a8", // orange
] as const;

export const NOTE_PALETTE: readonly (readonly [
  number,
  number,
  number,
  number,
])[] = NOTE_PALETTE_HEX.map((hex) => sketchFill(parseColor(hex)));

export function paletteColor(
  index: number,
): readonly [number, number, number, number] {
  return NOTE_PALETTE[Math.abs(index) % NOTE_PALETTE.length]!;
}

export function paletteStroke(
  index: number,
  surface: "dark" | "light" = "dark",
): readonly [number, number, number, number] {
  const base = parseColor(
    NOTE_PALETTE_HEX[Math.abs(index) % NOTE_PALETTE_HEX.length],
  );
  return sketchStroke(base, surface);
}

/** Canvas paper / board clear colors (RGBA 0–1). */
export const CANVAS_BG_DARK: readonly [number, number, number, number] = [
  0.071, 0.075, 0.082, 1,
];
export const CANVAS_BG_LIGHT: readonly [number, number, number, number] = [
  0.973, 0.965, 0.945, 1,
];
