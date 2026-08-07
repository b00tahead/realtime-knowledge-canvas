import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEmptyDocument,
  createNote,
  createConnector,
  upsertObject,
} from "@rkc/object-model";
import {
  createStressRects,
  documentToRenderRects,
  objectsToRenderRects,
} from "./scene.js";
import { parseColor } from "./color.js";

describe("scene", () => {
  it("maps notes to render rects and skips connectors", () => {
    let doc = createEmptyDocument("d1");
    const a = createNote("A", { id: "a", transform: { x: 0, y: 0, w: 100, h: 80 } });
    const b = createNote("B", { id: "b", transform: { x: 10, y: 10, w: 100, h: 80 } });
    doc = upsertObject(doc, a);
    doc = upsertObject(doc, b);
    doc = upsertObject(doc, createConnector("a", "b", { id: "c" }));
    const rects = documentToRenderRects(doc);
    assert.equal(rects.length, 2);
    assert.equal(rects[0]!.label, "A");
  });

  it("creates stress fixtures of the requested size", () => {
    const rects = createStressRects(100, { cols: 10 });
    assert.equal(rects.length, 100);
    assert.ok(objectsToRenderRects([]).length === 0);
  });

  it("parses hex colors", () => {
    assert.deepEqual([...parseColor("#ff0000")], [1, 0, 0, 1]);
    const c = parseColor("#0f8");
    assert.equal(c[0], 0);
    assert.equal(c[1], 1);
    assert.ok(Math.abs(c[2]! - 136 / 255) < 1e-9);
    assert.equal(c[3], 1);
  });
});
