import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OBJECT_MODEL_VERSION,
  createEmptyDocument,
  createNote,
  listInReadingOrder,
  upsertObject,
} from "@rkc/object-model";
import { DEFAULT_LOCAL_CANVAS_ID, saveStatusLabel } from "@rkc/offline";

describe("web scaffold", () => {
  it("depends on a stable object model version", () => {
    assert.equal(OBJECT_MODEL_VERSION, 1);
  });

  it("can build a small document graph for the shell demo", () => {
    let doc = createEmptyDocument(DEFAULT_LOCAL_CANVAS_ID, "Test");
    doc = upsertObject(doc, createNote("First", { id: "a" }));
    doc = upsertObject(doc, createNote("Second", { id: "b" }));
    assert.equal(listInReadingOrder(doc).length, 2);
  });

  it("exposes save status labels for the toolbar badge", () => {
    assert.match(saveStatusLabel("saved"), /Saved/i);
  });
});
