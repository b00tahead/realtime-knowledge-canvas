import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maxLinesForHeight, wrapText } from "./text-layout.js";

describe("text-layout", () => {
  it("wraps long lines to max width", () => {
    const { lines, truncated } = wrapText(
      "one two three four five six seven",
      80,
      14,
      10,
    );
    assert.ok(lines.length >= 2);
    assert.equal(truncated, false);
    for (const line of lines) {
      // ~0.52 * 14 ≈ 7.3px per char → 80/7.3 ≈ 10 chars
      assert.ok(line.length <= 12, line);
    }
  });

  it("honors explicit newlines", () => {
    const { lines } = wrapText("hello\nworld", 400, 14, 10);
    assert.deepEqual(lines, ["hello", "world"]);
  });

  it("truncates with ellipsis when maxLines exceeded", () => {
    const { lines, truncated } = wrapText(
      "alpha beta gamma delta epsilon zeta eta theta",
      60,
      14,
      2,
    );
    assert.equal(truncated, true);
    assert.equal(lines.length, 2);
    assert.match(lines[1]!, /…$/);
  });

  it("force-breaks very long tokens", () => {
    const { lines } = wrapText("supercalifragilisticexpialidocious", 50, 14, 5);
    assert.ok(lines.length >= 2);
  });

  it("computes max lines for height", () => {
    assert.equal(maxLinesForHeight(100, 14, 1.3, 0) >= 5, true);
    assert.equal(maxLinesForHeight(10, 14, 1.3, 0), 0);
  });
});
