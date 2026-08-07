import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OBJECT_MODEL_VERSION,
  createEmptyDocument,
  isCanvasObject,
  type NoteObject,
} from "./index.js";

describe("object-model", () => {
  it("creates an empty document with current schema version", () => {
    const doc = createEmptyDocument("canvas-1", "Research");
    assert.equal(doc.version, OBJECT_MODEL_VERSION);
    assert.equal(doc.id, "canvas-1");
    assert.equal(doc.title, "Research");
    assert.deepEqual(doc.objects, {});
  });

  it("type-guards a note object", () => {
    const note: NoteObject = {
      id: "n1",
      type: "note",
      text: "Hello",
      transform: { x: 0, y: 0, w: 200, h: 120 },
      zIndex: 0,
      createdBy: "local",
      updatedAt: Date.now(),
      a11y: { name: "Hello" },
    };
    assert.equal(isCanvasObject(note), true);
    assert.equal(isCanvasObject(null), false);
    assert.equal(isCanvasObject({}), false);
  });
});
