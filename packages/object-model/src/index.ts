/**
 * Shared canvas object model.
 * Engine, web app, sync, and (later) AI all consume this package.
 */

export const OBJECT_MODEL_VERSION = 1 as const;

export type ObjectId = string;
export type UserId = string;

export interface Transform2D {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

export interface A11yMeta {
  name: string;
  description?: string;
}

export interface BaseObject {
  id: ObjectId;
  type: string;
  parentId?: ObjectId;
  transform: Transform2D;
  zIndex: number;
  createdBy: UserId;
  updatedAt: number;
  a11y: A11yMeta;
}

export interface NoteObject extends BaseObject {
  type: "note";
  text: string;
  color?: string;
}

export interface ShapeObject extends BaseObject {
  type: "shape";
  shape: "rect" | "ellipse" | "diamond";
  fill?: string;
  stroke?: string;
}

export interface FrameObject extends BaseObject {
  type: "frame";
  title: string;
}

export interface ConnectorObject extends BaseObject {
  type: "connector";
  fromId: ObjectId;
  toId: ObjectId;
}

/** Slice 3 research types — stubbed for forward compatibility */
export interface CitationObject extends BaseObject {
  type: "citation";
  title: string;
  url?: string;
  authors?: string[];
}

export interface SummaryObject extends BaseObject {
  type: "summary";
  text: string;
  status: "streaming" | "ready" | "failed";
  sourceIds?: ObjectId[];
}

export type CanvasObject =
  | NoteObject
  | ShapeObject
  | FrameObject
  | ConnectorObject
  | CitationObject
  | SummaryObject;

export interface CanvasDocument {
  version: typeof OBJECT_MODEL_VERSION;
  id: string;
  title: string;
  objects: Record<ObjectId, CanvasObject>;
  updatedAt: number;
}

export function createEmptyDocument(
  id: string,
  title = "Untitled canvas",
): CanvasDocument {
  return {
    version: OBJECT_MODEL_VERSION,
    id,
    title,
    objects: {},
    updatedAt: Date.now(),
  };
}

export function isCanvasObject(value: unknown): value is CanvasObject {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.type === "string" &&
    typeof o.zIndex === "number" &&
    typeof o.transform === "object" &&
    o.transform !== null
  );
}
