import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OBJECT_MODEL_VERSION } from "@rkc/object-model";

describe("web scaffold", () => {
  it("depends on a stable object model version", () => {
    assert.equal(OBJECT_MODEL_VERSION, 1);
  });
});
