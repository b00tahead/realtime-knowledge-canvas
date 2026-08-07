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

export interface EngineStats {
  /** Last frame paint duration in milliseconds */
  lastPaintMs: number;
  objectCount: number;
  visibleCount: number;
}
