import type { CanvasDocument, CanvasObject } from "@rkc/object-model";
import { parseColor, paletteColor } from "./color.js";
import type { RenderRect } from "./types.js";

const DEFAULT_NOTE_SIZE = { w: 200, h: 120 };

/**
 * Map object-model entities to engine draw items.
 * Connectors are skipped in the WebGL spike (edges land later).
 */
export function objectsToRenderRects(
  objects: Iterable<CanvasObject>,
): RenderRect[] {
  const rects: RenderRect[] = [];
  let i = 0;
  for (const obj of objects) {
    if (obj.type === "connector") continue;
    const t = obj.transform;
    let color: readonly [number, number, number, number];
    if (obj.type === "note" && obj.color) {
      color = parseColor(obj.color);
    } else if (obj.type === "shape" && obj.fill) {
      color = parseColor(obj.fill);
    } else if (obj.type === "frame") {
      color = [0.16, 0.19, 0.26, 0.55];
    } else if (obj.type === "summary") {
      color = [0.43, 0.66, 1, 0.35];
    } else if (obj.type === "citation") {
      color = [0.24, 0.62, 0.39, 0.75];
    } else {
      color = paletteColor(i);
    }
    rects.push({
      id: obj.id,
      x: t.x,
      y: t.y,
      w: t.w > 0 ? t.w : DEFAULT_NOTE_SIZE.w,
      h: t.h > 0 ? t.h : DEFAULT_NOTE_SIZE.h,
      color,
      label: obj.a11y.name,
      zIndex: obj.zIndex,
    });
    i += 1;
  }
  rects.sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
  return rects;
}

export function documentToRenderRects(doc: CanvasDocument): RenderRect[] {
  return objectsToRenderRects(Object.values(doc.objects));
}

/** Generate a grid of rects for perf fixtures. */
export function createStressRects(
  count: number,
  opts?: { cols?: number; gap?: number; w?: number; h?: number },
): RenderRect[] {
  const cols = opts?.cols ?? Math.ceil(Math.sqrt(count));
  const gap = opts?.gap ?? 24;
  const w = opts?.w ?? 120;
  const h = opts?.h ?? 80;
  const rects: RenderRect[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    rects.push({
      id: `stress_${i}`,
      x: col * (w + gap),
      y: row * (h + gap),
      w,
      h,
      color: paletteColor(i),
      label: `Object ${i + 1}`,
      zIndex: i,
    });
  }
  return rects;
}
