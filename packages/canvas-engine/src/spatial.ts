import type { AABB, RenderRect } from "./types.js";

export function aabbIntersects(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function rectToAABB(rect: Pick<RenderRect, "x" | "y" | "w" | "h">): AABB {
  return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
}

/** Frustum cull: keep rects that intersect the visible world bounds. */
export function cullRects(rects: readonly RenderRect[], view: AABB): RenderRect[] {
  const out: RenderRect[] = [];
  for (const r of rects) {
    if (aabbIntersects(view, rectToAABB(r))) out.push(r);
  }
  return out;
}
