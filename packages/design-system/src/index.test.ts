import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COLOR_TOKEN_NAMES,
  DENSITY_MODES,
  THEME_MODES,
  cn,
  colorCssVar,
  densityClassName,
  isDensityMode,
  isThemeMode,
  noteColorCssVar,
  resolveInitialTheme,
  themeClassName,
} from "./index.js";

describe("design-system helpers", () => {
  it("validates density modes", () => {
    assert.deepEqual([...DENSITY_MODES], ["focus", "research"]);
    assert.equal(isDensityMode("focus"), true);
    assert.equal(isDensityMode("loud"), false);
    assert.equal(densityClassName("research"), "rkc-density-research");
  });

  it("validates theme modes", () => {
    assert.deepEqual([...THEME_MODES], ["dark", "light"]);
    assert.equal(isThemeMode("light"), true);
    assert.equal(themeClassName("dark"), "rkc-theme-dark");
  });

  it("resolves initial theme with fallbacks", () => {
    assert.equal(resolveInitialTheme("light"), "light");
    assert.equal(resolveInitialTheme("nope", true), "dark");
    assert.equal(resolveInitialTheme(null, false), "light");
  });

  it("builds CSS variable references for tokens", () => {
    assert.equal(colorCssVar("accent"), "var(--rkc-color-accent)");
    assert.equal(noteColorCssVar("yellow"), "var(--rkc-note-yellow)");
    assert.ok(COLOR_TOKEN_NAMES.includes("focus-ring"));
  });

  it("joins class names", () => {
    assert.equal(cn("a", false, undefined, "b"), "a b");
  });
});
