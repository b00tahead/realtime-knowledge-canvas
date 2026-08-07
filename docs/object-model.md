# Object model

Package: `@rkc/object-model`

Schema-first canvas documents shared by the engine, web app, sync layer, and (later) AI. **Do not invent parallel types** outside this package.

## Version

`OBJECT_MODEL_VERSION` is currently **1**. Persisted documents carry `version`. Use `migrateDocument()` when loading unknown JSON.

## Document shape

```ts
{
  version: 1,
  id: string,
  title: string,
  objects: Record<ObjectId, CanvasObject>,
  updatedAt: number,
  camera?: { x, y, zoom }  // optional restore hint
}
```

## Object types

| Type | Purpose | Slice |
|------|---------|-------|
| `note` | Freeform text card | 1 |
| `shape` | rect / ellipse / diamond | 1 |
| `frame` | Grouping container | 1 |
| `connector` | Edge between two objects | 1 |
| `citation` | Research source card | 3 |
| `summary` | AI summary (`streaming` \| `ready` \| `failed`) | 3 |

Every object has:

- `transform` — `{ x, y, w, h, rotation? }` (positive `w`/`h`)
- `zIndex`, `createdBy`, `updatedAt`
- `a11y.name` (required) + optional `description`
- optional `parentId` (frame membership)
- optional `order` — explicit a11y / reading-order override

## API surface

| Area | Functions |
|------|-----------|
| Factories | `createNote`, `createShape`, `createFrame`, `createConnector`, `createCitation`, `createSummary` |
| Document | `createEmptyDocument`, `upsertObject`, `updateObject`, `moveObject`, `updateNoteText`, `removeObject`, `getObject`, `listObjects`, … |
| Validate | `parseCanvasObject`, `parseCanvasDocument`, `isCanvasObject`, `validateDocumentGraph` |
| A11y order | `listInReadingOrder`, `listTopLevelInReadingOrder`, `compareReadingOrder` |
| Migrate | `migrateDocument` |
| Schemas | Zod exports: `canvasObjectSchema`, `canvasDocumentSchema`, … |

Validation is **Zod**. Types are inferred from schemas so runtime and TypeScript stay aligned.

## Reading order

Used for keyboard / screen-reader navigation of the spatial canvas:

1. Explicit `order` (if set)
2. Spatial: top→bottom, then left→right
3. Stable `id` tie-break  
Connectors are sorted after content objects.

## Example

```ts
import {
  createEmptyDocument,
  createNote,
  upsertObject,
  parseCanvasDocument,
  listInReadingOrder,
} from "@rkc/object-model";

let doc = createEmptyDocument("local-1", "Research");
doc = upsertObject(doc, createNote("First claim", { transform: { x: 0, y: 0, w: 200, h: 120 } }));
doc = upsertObject(doc, createNote("Second", { transform: { x: 40, y: 160, w: 200, h: 120 } }));

const parsed = parseCanvasDocument(JSON.parse(JSON.stringify(doc)));
if (parsed.success) {
  console.log(listInReadingOrder(parsed.data).map((o) => o.a11y.name));
}
```

## Invariants (`validateDocumentGraph`)

- `parentId` must exist and not equal self
- Connector `fromId` / `toId` must exist

Removing an object also removes connectors that reference it.
