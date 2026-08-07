# ADR 0005: Schema-first object model with Zod

## Status

Accepted

## Context

Engine, web, sync, and AI must share one document shape. Informal TypeScript interfaces drift from runtime JSON (IndexedDB, network, AI streams). AI-generated canvas events especially need runtime validation.

## Decision

1. Define the canvas document and objects with **Zod schemas** in `@rkc/object-model`.
2. Export **inferred TypeScript types** from those schemas (single source of truth).
3. Provide **factories**, **immutable document ops**, **graph validation**, **reading-order** helpers, and **migrateDocument** for persistence upgrades.
4. Version documents with `OBJECT_MODEL_VERSION` and refuse newer unknown versions.

## Consequences

- Slight dependency cost (Zod) for a critical boundary package.
- Invalid AI or sync payloads fail closed at parse time.
- Future schema changes require a migration path and version bump.
