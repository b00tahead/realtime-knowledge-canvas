import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PerfTracker } from "./perf.js";
import { PAINT_BUDGET_MS } from "./types.js";

describe("perf", () => {
  it("tracks paint budget and averages", () => {
    const tracker = new PerfTracker();
    const a = tracker.recordPaint(4, 100, 50);
    assert.equal(a.lastPaintMs, 4);
    assert.equal(a.objectCount, 100);
    assert.equal(a.visibleCount, 50);
    assert.equal(a.withinBudget, true);

    const b = tracker.recordPaint(20, 100, 50);
    assert.equal(b.withinBudget, 20 <= PAINT_BUDGET_MS);
    assert.ok(b.avgPaintMs > 4);
  });
});
