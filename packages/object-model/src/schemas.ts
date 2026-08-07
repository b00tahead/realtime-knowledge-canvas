import { z } from "zod";
import { OBJECT_MODEL_VERSION } from "./version.js";

export const objectIdSchema = z.string().min(1);
export const userIdSchema = z.string().min(1);

export const transform2DSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite().positive(),
  h: z.number().finite().positive(),
  rotation: z.number().finite().optional(),
});

export const a11yMetaSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const baseObjectFields = {
  id: objectIdSchema,
  parentId: objectIdSchema.optional(),
  transform: transform2DSchema,
  zIndex: z.number().int().finite(),
  createdBy: userIdSchema,
  updatedAt: z.number().finite().nonnegative(),
  a11y: a11yMetaSchema,
  /** Explicit reading-order override (lower = earlier). Spatial order used when absent. */
  order: z.number().int().finite().optional(),
};

export const noteObjectSchema = z.object({
  ...baseObjectFields,
  type: z.literal("note"),
  text: z.string(),
  color: z.string().optional(),
});

export const shapeKindSchema = z.enum(["rect", "ellipse", "diamond"]);

export const shapeObjectSchema = z.object({
  ...baseObjectFields,
  type: z.literal("shape"),
  shape: shapeKindSchema,
  fill: z.string().optional(),
  stroke: z.string().optional(),
});

export const frameObjectSchema = z.object({
  ...baseObjectFields,
  type: z.literal("frame"),
  title: z.string(),
});

export const connectorObjectSchema = z.object({
  ...baseObjectFields,
  type: z.literal("connector"),
  fromId: objectIdSchema,
  toId: objectIdSchema,
});

export const citationObjectSchema = z.object({
  ...baseObjectFields,
  type: z.literal("citation"),
  title: z.string().min(1),
  url: z
    .union([z.string().url(), z.literal("")])
    .optional(),
  authors: z.array(z.string()).optional(),
});

export const summaryStatusSchema = z.enum(["streaming", "ready", "failed"]);

export const summaryObjectSchema = z.object({
  ...baseObjectFields,
  type: z.literal("summary"),
  text: z.string(),
  status: summaryStatusSchema,
  sourceIds: z.array(objectIdSchema).optional(),
});

export const canvasObjectSchema = z.discriminatedUnion("type", [
  noteObjectSchema,
  shapeObjectSchema,
  frameObjectSchema,
  connectorObjectSchema,
  citationObjectSchema,
  summaryObjectSchema,
]);

export const objectTypeSchema = z.enum([
  "note",
  "shape",
  "frame",
  "connector",
  "citation",
  "summary",
]);

export const canvasDocumentSchema = z.object({
  version: z.literal(OBJECT_MODEL_VERSION),
  id: z.string().min(1),
  title: z.string(),
  objects: z.record(objectIdSchema, canvasObjectSchema),
  updatedAt: z.number().finite().nonnegative(),
  /** Optional camera snapshot for restore (engine-owned semantics). */
  camera: z
    .object({
      x: z.number().finite(),
      y: z.number().finite(),
      zoom: z.number().finite().positive(),
    })
    .optional(),
});

export type Transform2D = z.infer<typeof transform2DSchema>;
export type A11yMeta = z.infer<typeof a11yMetaSchema>;
export type NoteObject = z.infer<typeof noteObjectSchema>;
export type ShapeObject = z.infer<typeof shapeObjectSchema>;
export type FrameObject = z.infer<typeof frameObjectSchema>;
export type ConnectorObject = z.infer<typeof connectorObjectSchema>;
export type CitationObject = z.infer<typeof citationObjectSchema>;
export type SummaryObject = z.infer<typeof summaryObjectSchema>;
export type CanvasObject = z.infer<typeof canvasObjectSchema>;
export type CanvasDocument = z.infer<typeof canvasDocumentSchema>;
export type ObjectType = z.infer<typeof objectTypeSchema>;
export type ShapeKind = z.infer<typeof shapeKindSchema>;
export type SummaryStatus = z.infer<typeof summaryStatusSchema>;

export type BaseObject = Pick<
  CanvasObject,
  | "id"
  | "parentId"
  | "transform"
  | "zIndex"
  | "createdBy"
  | "updatedAt"
  | "a11y"
  | "order"
> & { type: ObjectType };
