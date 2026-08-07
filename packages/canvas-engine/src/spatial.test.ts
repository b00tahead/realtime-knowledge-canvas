import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aabbIntersects, cullRects } from "./spatial.js";
import type { RenderRect } from "./types.js";

function rect(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
): RenderRect {
  return {
    id,
    x,
    y,
    w,
    h,
    color: [1, 1, 1, 1],
    label: id,
    zIndex: 0,
  };
}

describe("spatial", () => {
  it("detects AABB intersection", () => {
    assert.equal(
      aabbIntersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }),
      true,
    );
    assert.equal(
      aabbIntersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 5, h: 5 }),
      false,
    );
  });

  it("culls rects outside the view", () => {
    const items = [
      rect("in", 0, 0, 50, 50),
      rect("out", 500, 500, 50, 50),
      rect("edge", 90, 90, 20, 20),
    ];
    const visible = cullRects(items, { x: 0, y: 0, w: 100, h: 100 });
    assert.deepEqual(
      visible.map((r) => r.id),
      ["in", "edge"],
    );
  });
});
