/** Parse #RGB, #RRGGBB, or #RRGGBBAA into RGBA 0–1. Falls back to accent blue. */
export function parseColor(
  input: string | undefined,
  fallback: readonly [number, number, number, number] = [0.43, 0.66, 1, 0.9],
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

export const NOTE_PALETTE: readonly (readonly [
  number,
  number,
  number,
  number,
])[] = [
  [0.96, 0.84, 0.43, 0.92], // yellow
  [0.49, 0.71, 1.0, 0.92], // blue
  [0.49, 0.81, 0.63, 0.92], // green
  [0.96, 0.64, 0.78, 0.92], // pink
  [0.77, 0.63, 1.0, 0.92], // purple
  [0.94, 0.63, 0.42, 0.92], // orange
];

export function paletteColor(index: number): readonly [number, number, number, number] {
  return NOTE_PALETTE[Math.abs(index) % NOTE_PALETTE.length]!;
}
