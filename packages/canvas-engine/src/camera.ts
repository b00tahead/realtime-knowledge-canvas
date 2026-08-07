import type { AABB, Camera, Vec2, ViewportSize } from "./types.js";

export const DEFAULT_MIN_ZOOM = 0.1;
export const DEFAULT_MAX_ZOOM = 8;

export function createCamera(partial?: Partial<Camera>): Camera {
  return {
    x: partial?.x ?? 0,
    y: partial?.y ?? 0,
    zoom: partial?.zoom ?? 1,
  };
}

export function clampZoom(
  zoom: number,
  min = DEFAULT_MIN_ZOOM,
  max = DEFAULT_MAX_ZOOM,
): number {
  return Math.min(max, Math.max(min, zoom));
}

/** Convert screen (viewport) coordinates to world space. */
export function screenToWorld(camera: Camera, screen: Vec2): Vec2 {
  return {
    x: screen.x / camera.zoom + camera.x,
    y: screen.y / camera.zoom + camera.y,
  };
}

/** Convert world coordinates to screen (viewport) space. */
export function worldToScreen(camera: Camera, world: Vec2): Vec2 {
  return {
    x: (world.x - camera.x) * camera.zoom,
    y: (world.y - camera.y) * camera.zoom,
  };
}

/** Pan by screen-space delta (drag right → content moves right). */
export function panByScreen(camera: Camera, dx: number, dy: number): Camera {
  return {
    ...camera,
    x: camera.x - dx / camera.zoom,
    y: camera.y - dy / camera.zoom,
  };
}

/**
 * Zoom around a screen point so that point stays fixed in world space.
 */
export function zoomAtScreen(
  camera: Camera,
  screen: Vec2,
  nextZoom: number,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
): Camera {
  const zoom = clampZoom(nextZoom, minZoom, maxZoom);
  if (zoom === camera.zoom) return camera;
  const worldBefore = screenToWorld(camera, screen);
  const next: Camera = { ...camera, zoom };
  const worldAfter = screenToWorld(next, screen);
  return {
    x: camera.x + (worldBefore.x - worldAfter.x),
    y: camera.y + (worldBefore.y - worldAfter.y),
    zoom,
  };
}

/** Visible world-space AABB for a viewport. */
export function visibleWorldBounds(
  camera: Camera,
  viewport: ViewportSize,
  pad = 0,
): AABB {
  const w = viewport.width / camera.zoom;
  const h = viewport.height / camera.zoom;
  return {
    x: camera.x - pad,
    y: camera.y - pad,
    w: w + pad * 2,
    h: h + pad * 2,
  };
}
