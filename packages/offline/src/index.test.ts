import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInitialOfflineStatus, OFFLINE_DB_NAME } from "./index.js";

describe("offline", () => {
  it("exposes db name constant", () => {
    assert.equal(OFFLINE_DB_NAME, "rkc-offline");
  });

  it("creates initial status", () => {
    const status = createInitialOfflineStatus();
    assert.equal(typeof status.online, "boolean");
    assert.equal(status.sync, "idle");
  });
});
