import type { CanvasDocument } from "@rkc/object-model";

/** Lightweight list row for library UIs (no full object graph). */
export interface CanvasMeta {
  id: string;
  title: string;
  updatedAt: number;
  objectCount: number;
  version: number;
}

/** Record shape stored in IndexedDB (document + optional denormalized meta). */
export interface CanvasRecord {
  id: string;
  title: string;
  updatedAt: number;
  objectCount: number;
  version: number;
  /** Full document payload (validated on read via migrateDocument). */
  document: CanvasDocument;
}
