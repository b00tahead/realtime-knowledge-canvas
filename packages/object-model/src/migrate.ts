import { OBJECT_MODEL_VERSION } from "./version.js";
import {
  canvasDocumentSchema,
  type CanvasDocument,
  type CanvasObject,
} from "./schemas.js";
import { deriveA11yName } from "./a11y.js";

export interface MigrationResult {
  document: CanvasDocument;
  fromVersion: number;
  toVersion: number;
  changed: boolean;
}

/**
 * Best-effort migration of unknown JSON into the current document schema.
 * Supports:
 * - missing version (treat as v1-shaped if objects look valid)
 * - backfill a11y.name from content
 */
export function migrateDocument(raw: unknown): MigrationResult {
  if (raw === null || typeof raw !== "object") {
    throw new Error("migrateDocument: expected an object");
  }

  const input = raw as Record<string, unknown>;
  const fromVersion =
    typeof input.version === "number" ? input.version : 0;

  if (fromVersion > OBJECT_MODEL_VERSION) {
    throw new Error(
      `migrateDocument: document version ${fromVersion} is newer than supported ${OBJECT_MODEL_VERSION}`,
    );
  }

  let changed = fromVersion !== OBJECT_MODEL_VERSION;

  const objectsIn =
    input.objects && typeof input.objects === "object"
      ? (input.objects as Record<string, unknown>)
      : {};

  const objects: Record<string, CanvasObject> = {};
  for (const [id, value] of Object.entries(objectsIn)) {
    if (!value || typeof value !== "object") continue;
    const obj = value as Record<string, unknown>;
    const withId: Record<string, unknown> = {
      ...obj,
      id: typeof obj.id === "string" ? obj.id : id,
    };

    // Backfill a11y if missing
    if (!withId.a11y || typeof withId.a11y !== "object") {
      const provisional = {
        ...withId,
        a11y: { name: "Object" },
      } as CanvasObject;
      try {
        withId.a11y = {
          name: deriveA11yName(provisional),
        };
      } catch {
        withId.a11y = { name: "Object" };
      }
      changed = true;
    }

    objects[id] = withId as CanvasObject;
  }

  const candidate = {
    version: OBJECT_MODEL_VERSION,
    id: typeof input.id === "string" ? input.id : "unknown",
    title: typeof input.title === "string" ? input.title : "Untitled canvas",
    objects,
    updatedAt:
      typeof input.updatedAt === "number" ? input.updatedAt : Date.now(),
    camera: input.camera,
  };

  const parsed = canvasDocumentSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error(
      `migrateDocument: cannot coerce to v${OBJECT_MODEL_VERSION}: ${parsed.error.issues
        .map((i) => i.message)
        .join("; ")}`,
    );
  }

  return {
    document: parsed.data,
    fromVersion,
    toVersion: OBJECT_MODEL_VERSION,
    changed,
  };
}
