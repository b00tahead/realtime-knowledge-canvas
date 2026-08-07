import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRng,
  hashSeed,
  pointsToPath,
  roughHachure,
  roughRectangle,
} from "./rough.js";

describe("rough", () => {
  it("hashes seeds deterministically", () => {
    assert.equal(hashSeed("abc"), hashSeed("abc"));
    assert.notEqual(hashSeed("abc"), hashSeed("abd"));
  });

  it("rng is stable for a seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    assert.equal(a(), b());
    assert.equal(a(), b());
  });

  it("builds a closed rough rectangle with stroke passes", () => {
    const g = roughRectangle(10, 20, 100, 60, { seed: 7, strokePasses: 2 });
    assert.ok(g.fillPoints.length > 8);
    assert.equal(g.strokePasses.length, 2);
    const d = pointsToPath(g.fillPoints, true);
    assert.match(d, /^M /);
    assert.match(d, /Z$/);
  });

  it("same seed yields same geometry", () => {
    const a = roughRectangle(0, 0, 80, 40, { seed: 99 });
    const b = roughRectangle(0, 0, 80, 40, { seed: 99 });
    assert.deepEqual(a.fillPoints, b.fillPoints);
  });

  it("produces hachure lines inside a rect", () => {
    const lines = roughHachure(0, 0, 100, 80, { seed: 1, spacing: 10 });
    assert.ok(lines.length > 3);
    assert.equal(lines[0]!.length, 2);
  });
});
