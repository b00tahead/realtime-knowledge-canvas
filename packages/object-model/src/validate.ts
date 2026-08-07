import { ZodError } from "zod";
import {
  canvasDocumentSchema,
  canvasObjectSchema,
  type CanvasDocument,
  type CanvasObject,
} from "./schemas.js";

export type ParseSuccess<T> = { success: true; data: T };
export type ParseFailure = {
  success: false;
  error: ZodError;
  issues: string[];
};
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

function failure(error: ZodError): ParseFailure {
  return {
    success: false,
    error,
    issues: error.issues.map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
    ),
  };
}

export function parseCanvasObject(value: unknown): ParseResult<CanvasObject> {
  const result = canvasObjectSchema.safeParse(value);
  if (result.success) return { success: true, data: result.data };
  return failure(result.error);
}

export function parseCanvasDocument(
  value: unknown,
): ParseResult<CanvasDocument> {
  const result = canvasDocumentSchema.safeParse(value);
  if (result.success) return { success: true, data: result.data };
  return failure(result.error);
}

/** Throws ZodError on invalid input. */
export function assertCanvasObject(value: unknown): CanvasObject {
  return canvasObjectSchema.parse(value);
}

export function assertCanvasDocument(value: unknown): CanvasDocument {
  return canvasDocumentSchema.parse(value);
}

export function isCanvasObject(value: unknown): value is CanvasObject {
  return canvasObjectSchema.safeParse(value).success;
}

export function isCanvasDocument(value: unknown): value is CanvasDocument {
  return canvasDocumentSchema.safeParse(value).success;
}

/**
 * Validate document graph invariants beyond schema:
 * - parentId references exist
 * - connector endpoints exist
 * - no self-parent
 */
export function validateDocumentGraph(doc: CanvasDocument): string[] {
  const issues: string[] = [];
  const ids = new Set(Object.keys(doc.objects));

  for (const obj of Object.values(doc.objects)) {
    if (obj.parentId) {
      if (obj.parentId === obj.id) {
        issues.push(`${obj.id}: parentId cannot reference self`);
      } else if (!ids.has(obj.parentId)) {
        issues.push(`${obj.id}: missing parent ${obj.parentId}`);
      }
    }
    if (obj.type === "connector") {
      if (!ids.has(obj.fromId)) {
        issues.push(`${obj.id}: missing fromId ${obj.fromId}`);
      }
      if (!ids.has(obj.toId)) {
        issues.push(`${obj.id}: missing toId ${obj.toId}`);
      }
    }
  }

  return issues;
}
