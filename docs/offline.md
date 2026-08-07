# Offline persistence

Package: `@rkc/offline`

Local-first canvas storage via **IndexedDB**. Service workers land in a later PR; this package owns the document store and save-session helpers.

## Database

| | |
|--|--|
| Name | `rkc-offline` (`OFFLINE_DB_NAME`) |
| Version | `1` |
| Store | `canvases` — keyPath `id` |
| Indexes | `updatedAt`, `title` |

Each record:

```ts
{
  id, title, updatedAt, objectCount, version,
  document: CanvasDocument  // full @rkc/object-model graph
}
```

On **read**, payloads pass through `migrateDocument()` so schema upgrades stay centralized.

## API

### `CanvasStore`

```ts
const store = new CanvasStore(); // or getDefaultCanvasStore()

await store.put(doc);
const doc = await store.get(id);
const rows = await store.list(); // CanvasMeta[]
await store.delete(id);
const { document, created } = await store.loadOrCreate(id, () => createEmptyDocument(id));
```

### `PersistenceSession`

Tracks **dirty** state and **debounced autosave** for one open document:

```ts
const session = new PersistenceSession({
  store,
  debounceMs: 400,
  onStatus: (status) => { /* dirty | saving | saved | error */ },
});

const doc = await session.loadOrCreate("local-demo", factory);
session.update(nextDoc);      // schedules save
await session.flush();        // save now (e.g. before unload)
session.dispose();
```

### Status helpers

- `OfflineStatus` — `online`, `sync` (remote, Slice 2), `save`, `lastSavedAt`, `lastError`
- `saveStatusLabel(status)` — human-readable badge text

## Web app behavior (Slice 1)

1. On boot: `loadOrCreate(DEFAULT_LOCAL_CANVAS_ID, buildDemoDocument)`
2. Edits (add note, rename, reset demo) call `session.update`
3. HUD / badge show save status
4. `beforeunload` / unmount: `session.flush()`

Stress-test scenes (1k/5k) are **not** written to IDB — only the real document is persisted.
