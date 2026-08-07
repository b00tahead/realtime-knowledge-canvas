import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampZoom,
  createCamera,
  panByScreen,
  screenToWorld,
  visibleWorldBounds,
  worldToScreen,
  zoomAtScreen,
} from "./camera.js";

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

  it("pans by screen delta inversely with zoom", () => {
    const camera = createCamera({ x: 0, y: 0, zoom: 2 });
    const next = panByScreen(camera, 100, 50);
    assert.equal(next.x, -50);
    assert.equal(next.y, -25);
  });

  it("zooms around a screen anchor (world point under cursor stays fixed)", () => {
    const camera = createCamera({ x: 0, y: 0, zoom: 1 });
    const screen = { x: 200, y: 100 };
    const worldBefore = screenToWorld(camera, screen);
    const next = zoomAtScreen(camera, screen, 2);
    const worldAfter = screenToWorld(next, screen);
    assert.ok(Math.abs(worldBefore.x - worldAfter.x) < 1e-9);
    assert.ok(Math.abs(worldBefore.y - worldAfter.y) < 1e-9);
    assert.equal(next.zoom, 2);
  });

  it("clamps zoom", () => {
    assert.equal(clampZoom(0.01, 0.1, 4), 0.1);
    assert.equal(clampZoom(99, 0.1, 4), 4);
  });

  it("computes visible world bounds", () => {
    const camera = createCamera({ x: 10, y: 20, zoom: 2 });
    const bounds = visibleWorldBounds(camera, { width: 200, height: 100, dpr: 1 });
    assert.equal(bounds.x, 10);
    assert.equal(bounds.y, 20);
    assert.equal(bounds.w, 100);
    assert.equal(bounds.h, 50);
  });
});
