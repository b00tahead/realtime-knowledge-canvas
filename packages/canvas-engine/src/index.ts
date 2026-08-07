/**
 * @rkc/canvas-engine
 *
 * Dual-surface infinite canvas: WebGL bulk geometry + SVG a11y/hit overlay.
 * Framework-agnostic — host from React/Vue/vanilla via `CanvasEngine`.
 */

export const ENGINE_NAME = "@rkc/canvas-engine" as const;
export { PAINT_BUDGET_MS } from "./types.js";

export type {
  AABB,
  Camera,
  EngineOptions,
  EngineStats,
  EngineTool,
  RenderRect,
  Vec2,
  ViewportSize,
  WorldPoint,
} from "./types.js";

export {
  clampZoom,
  createCamera,
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
  panByScreen,
  screenToWorld,
  visibleWorldBounds,
  worldToScreen,
  zoomAtScreen,
} from "./camera.js";

export { aabbIntersects, cullRects, rectToAABB } from "./spatial.js";
export { parseColor, paletteColor, NOTE_PALETTE } from "./color.js";
export {
  createStressRects,
  documentToRenderRects,
  objectsToRenderRects,
} from "./scene.js";
export { PerfTracker } from "./perf.js";
export { CanvasEngine } from "./engine.js";
