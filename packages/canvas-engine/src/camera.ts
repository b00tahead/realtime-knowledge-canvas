import type { Camera, Vec2 } from "./types.js";

export function createCamera(partial?: Partial<Camera>): Camera {
  return {
    x: partial?.x ?? 0,
    y: partial?.y ?? 0,
    zoom: partial?.zoom ?? 1,
  };
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
