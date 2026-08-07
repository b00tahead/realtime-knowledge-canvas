# ADR 0006: IndexedDB for local-first canvas documents

## Status

Accepted

## Context

Slice 1 is solo + offline-first. Users must reload the app and keep their canvas without a backend. The object model is already versioned JSON; we need durable browser storage and a clear dirty/autosave story.

## Decision

1. Store full `CanvasDocument` graphs in **IndexedDB** (`@rkc/offline` / `CanvasStore`).
2. Validate and migrate on read via `@rkc/object-model` `migrateDocument`.
3. Use a **`PersistenceSession`** for dirty tracking + debounced autosave (not write-on-every-frame).
4. Keep remote/background sync status separate (`sync` vs `save` fields).
5. Prefer a thin native IDB wrapper over Dexie for fewer dependencies; can swap later if query needs grow.

## Consequences

- Works offline without a server for Slice 1.
- Large stress fixtures stay in memory only (app responsibility).
- Quota errors surface as `save: "error"`; no multi-tab CRDT yet (Slice 2).
