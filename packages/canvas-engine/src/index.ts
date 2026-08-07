/**
 * Canvas engine public API.
 * Dual-surface: WebGL scene + SVG/DOM interaction overlay (built out in Slice 1).
 */

export type { Camera, Vec2, EngineStats } from "./types.js";
export { createCamera, screenToWorld, worldToScreen } from "./camera.js";

export const ENGINE_NAME = "@rkc/canvas-engine" as const;
