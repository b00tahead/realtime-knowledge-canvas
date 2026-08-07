export interface Vec2 {
  x: number;
  y: number;
}

/** Camera in world space; zoom is scale factor (1 = 100%). */
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
  dpr: number;
}

/** Axis-aligned bounds in world space. */
export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Minimal GPU-friendly draw item (engine-internal). */
export interface RenderRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * Optional fill RGBA 0–1. Transparent / omitted → outline-only
   * (WebGL skips near-zero alpha).
   */
  color: readonly [number, number, number, number];
  /** Ink stroke RGBA 0–1 (SVG rough outline) */
  stroke: readonly [number, number, number, number];
  /** Accessible name for AT */
  label: string;
  /** Body text drawn (and wrapped) inside the rect; falls back to label */
  text: string;
  /** Optional z for stable layering */
  zIndex: number;
}

export interface EngineStats {
  /** Last committed frame paint duration (ms) */
  lastPaintMs: number;
  /** Rolling average of last N paint times */
  avgPaintMs: number;
  objectCount: number;
  visibleCount: number;
  /** Whether last frame met the 16ms budget */
  withinBudget: boolean;
  fps: number;
}

export const PAINT_BUDGET_MS = 16 as const;

/** Active canvas tool (host-owned UI typically drives this). */
export type EngineTool = "select" | "note";

export interface WorldPoint {
  x: number;
  y: number;
}

export interface EngineOptions {
  /** Host element; engine appends canvas + svg children. */
  container: HTMLElement;
  /** Background clear color RGBA 0–1 */
  background?: readonly [number, number, number, number];
  /** Max zoom levels */
  minZoom?: number;
  maxZoom?: number;
  /** Called after each painted frame with stats */
  onStats?: (stats: EngineStats) => void;
  /** Initial tool (default select). */
  tool?: EngineTool;
  /** Ink/fill contrast surface (default dark). */
  surface?: "dark" | "light";
}
