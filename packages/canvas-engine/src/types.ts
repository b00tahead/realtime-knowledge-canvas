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
  /** RGBA 0–1 */
  color: readonly [number, number, number, number];
  /** Accessible name for SVG overlay */
  label: string;
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
}
