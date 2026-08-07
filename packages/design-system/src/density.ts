export type DensityMode = "focus" | "research";

export const DENSITY_MODES: readonly DensityMode[] = ["focus", "research"];

export const DENSITY_LABELS: Record<DensityMode, string> = {
  focus: "Focus",
  research: "Research",
};

export function isDensityMode(value: string): value is DensityMode {
  return value === "focus" || value === "research";
}

/** CSS class applied to a root element to switch density tokens. */
export function densityClassName(mode: DensityMode): string {
  return `rkc-density-${mode}`;
}
