import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { densityClassName, isDensityMode } from "./index.js";

describe("design-system", () => {
  it("validates density modes", () => {
    assert.equal(isDensityMode("focus"), true);
    assert.equal(isDensityMode("research"), true);
    assert.equal(isDensityMode("loud"), false);
  });

  it("builds density class names", () => {
    assert.equal(densityClassName("focus"), "rkc-density-focus");
  });
});
