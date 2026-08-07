/**
 * @rkc/object-model
 *
 * Shared schema-first canvas document model.
 * Engine, web, sync, and AI all consume this package — never invent parallel types.
 */

export { OBJECT_MODEL_VERSION, type ObjectModelVersion } from "./version.js";

export {
  createId,
  type DocumentId,
  type ObjectId,
  type UserId,
} from "./ids.js";

export {
  a11yMetaSchema,
  canvasDocumentSchema,
  canvasObjectSchema,
  citationObjectSchema,
  connectorObjectSchema,
  frameObjectSchema,
  noteObjectSchema,
  objectIdSchema,
  objectTypeSchema,
  shapeKindSchema,
  shapeObjectSchema,
  summaryObjectSchema,
  summaryStatusSchema,
  transform2DSchema,
  userIdSchema,
  type A11yMeta,
  type BaseObject,
  type CanvasDocument,
  type CanvasObject,
  type CitationObject,
  type ConnectorObject,
  type FrameObject,
  type NoteObject,
  type ObjectType,
  type ShapeKind,
  type ShapeObject,
  type SummaryObject,
  type SummaryStatus,
  type Transform2D,
} from "./schemas.js";

export { deriveA11yName, withDerivedA11y } from "./a11y.js";

export {
  createCitation,
  createConnector,
  createFrame,
  createNote,
  createShape,
  createSummary,
  type CreateObjectOptions,
} from "./factories.js";

export {
  cloneDocument,
  createEmptyDocument,
  getObject,
  listChildren,
  listObjects,
  listObjectsByType,
  objectCount,
  removeObject,
  renameDocument,
  updateObject,
  upsertObject,
} from "./document.js";

export {
  compareReadingOrder,
  listInReadingOrder,
  listTopLevelInReadingOrder,
} from "./order.js";

export {
  assertCanvasDocument,
  assertCanvasObject,
  isCanvasDocument,
  isCanvasObject,
  parseCanvasDocument,
  parseCanvasObject,
  validateDocumentGraph,
  type ParseFailure,
  type ParseResult,
  type ParseSuccess,
} from "./validate.js";

export { migrateDocument, type MigrationResult } from "./migrate.js";
