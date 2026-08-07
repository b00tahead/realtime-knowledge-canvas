import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCamera, screenToWorld, worldToScreen } from "./camera.js";

describe("camera", () => {
  it("round-trips screen ↔ world at identity zoom", () => {
    const camera = createCamera({ x: 100, y: 50, zoom: 1 });
    const world = screenToWorld(camera, { x: 20, y: 10 });
    assert.deepEqual(world, { x: 120, y: 60 });
    assert.deepEqual(worldToScreen(camera, world), { x: 20, y: 10 });
  });

  it("accounts for zoom", () => {
    const camera = createCamera({ x: 0, y: 0, zoom: 2 });
    const world = screenToWorld(camera, { x: 100, y: 100 });
    assert.deepEqual(world, { x: 50, y: 50 });
  });
});
