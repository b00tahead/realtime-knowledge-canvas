import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROTOCOL_VERSION, describeChannel } from "./index.js";

describe("sync-protocol", () => {
  it("exposes protocol version", () => {
    assert.equal(PROTOCOL_VERSION, 0);
  });

  it("describes channels", () => {
    assert.match(describeChannel("ephemeral"), /presence/i);
    assert.match(describeChannel("durable"), /CRDT/i);
  });
});
