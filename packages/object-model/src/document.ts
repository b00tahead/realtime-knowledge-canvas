import { OBJECT_MODEL_VERSION } from "./version.js";
import type { DocumentId, ObjectId } from "./ids.js";
import type { CanvasDocument, CanvasObject, ObjectType } from "./schemas.js";
import { deriveA11yName } from "./a11y.js";

export function createEmptyDocument(
  id: DocumentId,
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

export function listObjects(doc: CanvasDocument): CanvasObject[] {
  return Object.values(doc.objects);
}

export function getObject(
  doc: CanvasDocument,
  id: ObjectId,
): CanvasObject | undefined {
  return doc.objects[id];
}

export function listObjectsByType<T extends ObjectType>(
  doc: CanvasDocument,
  type: T,
): Extract<CanvasObject, { type: T }>[] {
  return listObjects(doc).filter(
    (o): o is Extract<CanvasObject, { type: T }> => o.type === type,
  );
}

export function listChildren(
  doc: CanvasDocument,
  parentId: ObjectId,
): CanvasObject[] {
  return listObjects(doc).filter((o) => o.parentId === parentId);
}

/** Immutable upsert — returns a new document. */
export function upsertObject(
  doc: CanvasDocument,
  object: CanvasObject,
  updatedAt = Date.now(),
): CanvasDocument {
  return {
    ...doc,
    objects: {
      ...doc.objects,
      [object.id]: {
        ...object,
        updatedAt,
        a11y: {
          ...object.a11y,
          name: object.a11y.name || deriveA11yName(object),
        },
      },
    },
    updatedAt,
  };
}

/** Immutable remove — no-op if id missing. */
export function removeObject(
  doc: CanvasDocument,
  id: ObjectId,
  updatedAt = Date.now(),
): CanvasDocument {
  if (!(id in doc.objects)) return doc;
  const { [id]: _removed, ...rest } = doc.objects;
  // Also drop connectors that reference the removed object
  const cleaned: Record<ObjectId, CanvasObject> = {};
  for (const [key, obj] of Object.entries(rest)) {
    if (obj.type === "connector" && (obj.fromId === id || obj.toId === id)) {
      continue;
    }
    cleaned[key] = obj;
  }
  return {
    ...doc,
    objects: cleaned,
    updatedAt,
  };
}

export function updateObject(
  doc: CanvasDocument,
  id: ObjectId,
  patch: Partial<CanvasObject>,
  updatedAt = Date.now(),
): CanvasDocument {
  const existing = doc.objects[id];
  if (!existing) return doc;
  // Preserve discriminant: type cannot change via patch
  const next = {
    ...existing,
    ...patch,
    type: existing.type,
    id: existing.id,
    updatedAt,
  } as CanvasObject;
  return upsertObject(doc, next, updatedAt);
}

/** Immutable translate — no-op if id missing. */
export function moveObject(
  doc: CanvasDocument,
  id: ObjectId,
  position: { x: number; y: number },
  updatedAt = Date.now(),
): CanvasDocument {
  const existing = doc.objects[id];
  if (!existing) return doc;
  return updateObject(
    doc,
    id,
    {
      transform: {
        ...existing.transform,
        x: position.x,
        y: position.y,
      },
    },
    updatedAt,
  );
}

/**
 * Update note body text and re-derive a11y name from the new content.
 * No-op if id missing or not a note.
 */
export function updateNoteText(
  doc: CanvasDocument,
  id: ObjectId,
  text: string,
  updatedAt = Date.now(),
): CanvasDocument {
  const existing = doc.objects[id];
  if (!existing || existing.type !== "note") return doc;
  const next = { ...existing, text };
  return upsertObject(
    doc,
    {
      ...next,
      a11y: {
        ...existing.a11y,
        name: deriveA11yName(next),
      },
    },
    updatedAt,
  );
}

export function renameDocument(
  doc: CanvasDocument,
  title: string,
  updatedAt = Date.now(),
): CanvasDocument {
  return { ...doc, title, updatedAt };
}

export function objectCount(doc: CanvasDocument): number {
  return Object.keys(doc.objects).length;
}

/** Deep clone via structuredClone when available, else JSON. */
export function cloneDocument(doc: CanvasDocument): CanvasDocument {
  if (typeof structuredClone === "function") {
    return structuredClone(doc);
  }
  return JSON.parse(JSON.stringify(doc)) as CanvasDocument;
}
