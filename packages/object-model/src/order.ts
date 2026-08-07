import type { CanvasDocument, CanvasObject } from "./schemas.js";
import { listObjects } from "./document.js";

/**
 * Reading / focus order for accessibility.
 * 1. Explicit `order` when set (ascending)
 * 2. Spatial: top→bottom, then left→right (by transform origin)
 * 3. Stable id tie-break
 *
 * Connectors are deferred to the end (edges, not content).
 */
export function compareReadingOrder(a: CanvasObject, b: CanvasObject): number {
  const aConnector = a.type === "connector" ? 1 : 0;
  const bConnector = b.type === "connector" ? 1 : 0;
  if (aConnector !== bConnector) return aConnector - bConnector;

  const aHasOrder = a.order !== undefined;
  const bHasOrder = b.order !== undefined;
  if (aHasOrder && bHasOrder && a.order !== b.order) {
    return (a.order as number) - (b.order as number);
  }
  if (aHasOrder !== bHasOrder) return aHasOrder ? -1 : 1;

  if (a.transform.y !== b.transform.y) return a.transform.y - b.transform.y;
  if (a.transform.x !== b.transform.x) return a.transform.x - b.transform.x;
  return a.id.localeCompare(b.id);
}

export function listInReadingOrder(doc: CanvasDocument): CanvasObject[] {
  return listObjects(doc).sort(compareReadingOrder);
}

/** Top-level objects only (no parent), in reading order. */
export function listTopLevelInReadingOrder(
  doc: CanvasDocument,
): CanvasObject[] {
  return listObjects(doc)
    .filter((o) => !o.parentId)
    .sort(compareReadingOrder);
}
