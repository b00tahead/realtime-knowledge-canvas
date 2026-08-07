import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  createEmptyDocument,
  createNote,
  objectCount,
  upsertObject,
} from "@rkc/object-model";
import {
  CanvasStore,
  DEFAULT_LOCAL_CANVAS_ID,
  OFFLINE_DB_NAME,
  PersistenceSession,
  createInitialOfflineStatus,
  saveStatusLabel,
} from "./index.js";

function uniqueDbName(suffix: string): string {
  return `${OFFLINE_DB_NAME}-test-${suffix}-${Math.random().toString(36).slice(2)}`;
}

describe("status", () => {
  it("creates initial offline status with save field", () => {
    const status = createInitialOfflineStatus();
    assert.equal(typeof status.online, "boolean");
    assert.equal(status.sync, "idle");
    assert.equal(status.save, "idle");
    assert.equal(status.lastSavedAt, null);
  });

  it("labels save statuses", () => {
    assert.match(saveStatusLabel("dirty"), /Unsaved/i);
    assert.match(saveStatusLabel("saved"), /Saved/i);
  });
});

describe("CanvasStore", () => {
  const stores: CanvasStore[] = [];

  afterEach(async () => {
    for (const s of stores) {
      await s.close();
    }
    stores.length = 0;
  });

  function store(): CanvasStore {
    const s = new CanvasStore({ dbName: uniqueDbName("store") });
    stores.push(s);
    return s;
  }

  it("puts and gets a document", async () => {
    const s = store();
    let doc = createEmptyDocument("c1", "Board");
    doc = upsertObject(doc, createNote("Hello", { id: "n1" }));
    await s.put(doc);
    const loaded = await s.get("c1");
    assert.ok(loaded);
    assert.equal(loaded.title, "Board");
    assert.equal(objectCount(loaded), 1);
    assert.equal(loaded.objects.n1?.type, "note");
  });

  it("lists meta sorted by updatedAt desc", async () => {
    const s = store();
    await s.put({
      ...createEmptyDocument("a", "A"),
      updatedAt: 100,
    });
    await s.put({
      ...createEmptyDocument("b", "B"),
      updatedAt: 200,
    });
    const list = await s.list();
    assert.equal(list.length, 2);
    assert.equal(list[0]!.id, "b");
    assert.equal(list[1]!.id, "a");
  });

  it("loadOrCreate creates once then loads", async () => {
    const s = store();
    let creates = 0;
    const factory = () => {
      creates += 1;
      return createEmptyDocument(DEFAULT_LOCAL_CANVAS_ID, "Demo");
    };
    const first = await s.loadOrCreate(DEFAULT_LOCAL_CANVAS_ID, factory);
    assert.equal(first.created, true);
    assert.equal(creates, 1);
    const second = await s.loadOrCreate(DEFAULT_LOCAL_CANVAS_ID, factory);
    assert.equal(second.created, false);
    assert.equal(creates, 1);
  });

  it("deletes a document", async () => {
    const s = store();
    await s.put(createEmptyDocument("x", "X"));
    await s.delete("x");
    assert.equal(await s.get("x"), undefined);
  });
});

describe("PersistenceSession", () => {
  it("autosaves dirty updates after debounce", async () => {
    const s = new CanvasStore({ dbName: uniqueDbName("session") });
    const statuses: string[] = [];
    const session = new PersistenceSession({
      store: s,
      debounceMs: 30,
      onStatus: (st) => statuses.push(st),
    });

    const doc = await session.loadOrCreate("sess-1", () =>
      createEmptyDocument("sess-1", "S"),
    );
    assert.equal(session.isDirty(), false);

    const next = upsertObject(doc, createNote("N", { id: "n1" }));
    session.update(next);

    assert.equal(session.isDirty(), true);
    assert.ok(statuses.includes("dirty"));

    await new Promise((r) => setTimeout(r, 80));
    await session.flush();

    const loaded = await s.get("sess-1");
    assert.ok(loaded);
    assert.equal(objectCount(loaded), 1);
    assert.equal(session.isDirty(), false);

    session.dispose();
    await s.close();
  });

  it("flush writes immediately", async () => {
    const s = new CanvasStore({ dbName: uniqueDbName("flush") });
    const session = new PersistenceSession({ store: s, debounceMs: 10_000 });
    await session.loadOrCreate("f1", () => createEmptyDocument("f1", "F"));
    session.update(
      upsertObject(session.getDocument()!, createNote("X", { id: "n" })),
    );
    await session.flush();
    const loaded = await s.get("f1");
    assert.equal(objectCount(loaded!), 1);
    session.dispose();
    await s.close();
  });
});
