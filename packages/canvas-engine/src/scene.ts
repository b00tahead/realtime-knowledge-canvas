import type { CanvasDocument, CanvasObject } from "@rkc/object-model";
import { sketchStroke } from "./color.js";
import type { RenderRect } from "./types.js";

const DEFAULT_NOTE_SIZE = { w: 200, h: 120 };

export type CanvasSurface = "dark" | "light";

/** Neutral ink — no per-note color for now. */
function inkStroke(
  surface: CanvasSurface,
): readonly [number, number, number, number] {
  // sketchStroke with a mid gray base
  return sketchStroke([0.55, 0.55, 0.58, 1], surface, 0.92);
}

const TRANSPARENT: readonly [number, number, number, number] = [0, 0, 0, 0];

function objectText(obj: CanvasObject): string {
  switch (obj.type) {
    case "note":
      return obj.text;
    case "frame":
      return obj.title;
    case "citation":
      return obj.title;
    case "summary":
      return obj.text;
    case "shape":
      return obj.a11y.name;
    default:
      return obj.a11y.name;
  }
}

/**
 * Map object-model entities to engine draw items.
 * Connectors are skipped. Default look: outline + text (no fills).
 */
export function objectsToRenderRects(
  objects: Iterable<CanvasObject>,
  surface: CanvasSurface = "dark",
): RenderRect[] {
  const rects: RenderRect[] = [];
  const stroke = inkStroke(surface);

  for (const obj of objects) {
    if (obj.type === "connector") continue;
    const t = obj.transform;
    const text = objectText(obj);

    rects.push({
      id: obj.id,
      x: t.x,
      y: t.y,
      w: t.w > 0 ? t.w : DEFAULT_NOTE_SIZE.w,
      h: t.h > 0 ? t.h : DEFAULT_NOTE_SIZE.h,
      color: TRANSPARENT,
      stroke,
      label: obj.a11y.name,
      text,
      zIndex: obj.zIndex,
    });
  }
  rects.sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
  return rects;
}

export function documentToRenderRects(
  doc: CanvasDocument,
  surface: CanvasSurface = "dark",
): RenderRect[] {
  return objectsToRenderRects(Object.values(doc.objects), surface);
}

/** Generate a grid of rects for perf fixtures. */
export function createStressRects(
  count: number,
  opts?: {
    cols?: number;
    gap?: number;
    w?: number;
    h?: number;
    surface?: CanvasSurface;
  },
): RenderRect[] {
  const cols = opts?.cols ?? Math.ceil(Math.sqrt(count));
  const gap = opts?.gap ?? 24;
  const w = opts?.w ?? 120;
  const h = opts?.h ?? 80;
  const surface = opts?.surface ?? "dark";
  const stroke = inkStroke(surface);
  const rects: RenderRect[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const label = `Object ${i + 1}`;
    rects.push({
      id: `stress_${i}`,
      x: col * (w + gap),
      y: row * (h + gap),
      w,
      h,
      color: TRANSPARENT,
      stroke,
      label,
      text: label,
      zIndex: i,
    });
  }
  return rects;
}
