import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OBJECT_MODEL_VERSION,
  assertCanvasDocument,
  compareReadingOrder,
  createCitation,
  createConnector,
  createEmptyDocument,
  createFrame,
  createId,
  createNote,
  createShape,
  createSummary,
  deriveA11yName,
  getObject,
  isCanvasObject,
  listInReadingOrder,
  listObjectsByType,
  migrateDocument,
  moveObject,
  objectCount,
  parseCanvasDocument,
  parseCanvasObject,
  removeObject,
  updateNoteText,
  updateObject,
  upsertObject,
  validateDocumentGraph,
} from "./index.js";

describe("ids", () => {
  it("creates prefixed ids", () => {
    const id = createId("note");
    assert.match(id, /^note_/);
  });
});

describe("factories", () => {
  it("creates a note with derived a11y name", () => {
    const note = createNote("Hello research\nsecond line");
    assert.equal(note.type, "note");
    assert.equal(note.a11y.name, "Hello research");
    assert.ok(note.transform.w > 0);
  });

  it("creates shape, frame, summary, citation", () => {
    const shape = createShape("ellipse");
    const frame = createFrame("Cluster A");
    const summary = createSummary("…", { status: "streaming" });
    const citation = createCitation("Paper", {
      url: "https://example.com/paper",
      authors: ["Ada"],
    });
    assert.equal(shape.shape, "ellipse");
    assert.equal(frame.title, "Cluster A");
    assert.equal(summary.status, "streaming");
    assert.equal(citation.authors?.[0], "Ada");
  });

  it("creates connector with endpoints", () => {
    const a = createNote("A");
    const b = createNote("B");
    const c = createConnector(a.id, b.id);
    assert.equal(c.fromId, a.id);
    assert.equal(c.toId, b.id);
  });
});

describe("document ops", () => {
  it("upserts, updates, and removes objects", () => {
    let doc = createEmptyDocument("c1", "Board");
    const note = createNote("One", { id: "n1" });
    doc = upsertObject(doc, note, 100);
    assert.equal(objectCount(doc), 1);
    assert.equal(getObject(doc, "n1")?.type, "note");

    doc = updateObject(doc, "n1", { text: "Two" } as Partial<typeof note>, 200);
    assert.equal((getObject(doc, "n1") as typeof note).text, "Two");
    assert.equal(doc.updatedAt, 200);

    doc = moveObject(doc, "n1", { x: 50, y: 75 }, 250);
    const moved = getObject(doc, "n1");
    assert.equal(moved?.transform.x, 50);
    assert.equal(moved?.transform.y, 75);

    doc = updateNoteText(doc, "n1", "Renamed body\nsecond", 300);
    const renamed = getObject(doc, "n1") as typeof note;
    assert.equal(renamed.text, "Renamed body\nsecond");
    assert.equal(renamed.a11y.name, "Renamed body");

    const other = createNote("Other", { id: "n2" });
    doc = upsertObject(doc, other);
    doc = upsertObject(doc, createConnector("n1", "n2", { id: "c1" }));
    assert.equal(objectCount(doc), 3);

    doc = removeObject(doc, "n1");
    assert.equal(getObject(doc, "n1"), undefined);
    // connector referencing n1 is cleaned up
    assert.equal(getObject(doc, "c1"), undefined);
    assert.equal(objectCount(doc), 1);
  });

  it("lists by type", () => {
    let doc = createEmptyDocument("c1");
    doc = upsertObject(doc, createNote("A"));
    doc = upsertObject(doc, createShape("rect"));
    assert.equal(listObjectsByType(doc, "note").length, 1);
    assert.equal(listObjectsByType(doc, "shape").length, 1);
  });
});

describe("validation", () => {
  it("parses valid objects and rejects invalid", () => {
    const note = createNote("ok");
    const ok = parseCanvasObject(note);
    assert.equal(ok.success, true);

    const bad = parseCanvasObject({ type: "note", id: "x" });
    assert.equal(bad.success, false);
    if (!bad.success) {
      assert.ok(bad.issues.length > 0);
    }
  });

  it("type-guards with full schema", () => {
    assert.equal(isCanvasObject(createNote("x")), true);
    assert.equal(isCanvasObject(null), false);
    assert.equal(isCanvasObject({}), false);
  });

  it("validates graph references", () => {
    let doc = createEmptyDocument("c1");
    const a = createNote("A", { id: "a" });
    const b = createNote("B", { id: "b", parentId: "missing" });
    doc = upsertObject(doc, a);
    doc = upsertObject(doc, b);
    doc = upsertObject(doc, createConnector("a", "ghost", { id: "c1" }));
    const issues = validateDocumentGraph(doc);
    assert.ok(issues.some((i) => i.includes("missing parent")));
    assert.ok(issues.some((i) => i.includes("missing toId")));
  });

  it("round-trips a document through assertCanvasDocument", () => {
    let doc = createEmptyDocument("c1", "Roundtrip");
    doc = upsertObject(doc, createNote("Hello", { id: "n1" }));
    const json = JSON.parse(JSON.stringify(doc));
    const parsed = assertCanvasDocument(json);
    assert.equal(parsed.version, OBJECT_MODEL_VERSION);
    assert.equal(objectCount(parsed), 1);
  });
});

describe("reading order", () => {
  it("orders spatially top-to-bottom, left-to-right", () => {
    const a = createNote("A", {
      id: "a",
      transform: { x: 100, y: 0, w: 10, h: 10 },
    });
    const b = createNote("B", {
      id: "b",
      transform: { x: 0, y: 0, w: 10, h: 10 },
    });
    const c = createNote("C", {
      id: "c",
      transform: { x: 0, y: 50, w: 10, h: 10 },
    });
    const ordered = [a, b, c].sort(compareReadingOrder).map((o) => o.id);
    assert.deepEqual(ordered, ["b", "a", "c"]);
  });

  it("honors explicit order over spatial", () => {
    let doc = createEmptyDocument("c1");
    doc = upsertObject(
      doc,
      createNote("later", {
        id: "a",
        order: 2,
        transform: { x: 0, y: 0, w: 10, h: 10 },
      }),
    );
    doc = upsertObject(
      doc,
      createNote("first", {
        id: "b",
        order: 1,
        transform: { x: 100, y: 100, w: 10, h: 10 },
      }),
    );
    const ids = listInReadingOrder(doc).map((o) => o.id);
    assert.deepEqual(ids, ["b", "a"]);
  });

  it("defers connectors to the end", () => {
    let doc = createEmptyDocument("c1");
    doc = upsertObject(doc, createNote("A", { id: "a" }));
    doc = upsertObject(doc, createNote("B", { id: "b" }));
    doc = upsertObject(doc, createConnector("a", "b", { id: "c" }));
    const ids = listInReadingOrder(doc).map((o) => o.id);
    assert.equal(ids[ids.length - 1], "c");
  });
});

describe("a11y", () => {
  it("derives names per type", () => {
    assert.equal(deriveA11yName(createNote("  Title  ")), "Title");
    assert.equal(deriveA11yName(createShape("diamond")), "diamond shape");
    assert.equal(
      deriveA11yName(createSummary("", { status: "streaming" })),
      "Summary (streaming)",
    );
  });
});

describe("migrate", () => {
  it("migrates missing version and a11y", () => {
    const raw = {
      id: "legacy",
      title: "Old",
      updatedAt: 1,
      objects: {
        n1: {
          id: "n1",
          type: "note",
          text: "Recovered",
          transform: { x: 0, y: 0, w: 100, h: 80 },
          zIndex: 0,
          createdBy: "local",
          updatedAt: 1,
        },
      },
    };
    const result = migrateDocument(raw);
    assert.equal(result.document.version, OBJECT_MODEL_VERSION);
    assert.equal(result.changed, true);
    assert.equal(result.document.objects.n1.a11y.name, "Recovered");
    const parsed = parseCanvasDocument(result.document);
    assert.equal(parsed.success, true);
  });

  it("rejects future versions", () => {
    assert.throws(() => migrateDocument({ version: 99, objects: {} }), /newer/);
  });
});
