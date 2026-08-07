/**
 * Sync protocol surface.
 * Slice 2: Yjs adapter implements DurableDocStore; presence uses EphemeralChannel.
 * Yjs remains an implementation detail behind these interfaces.
 */

export type ChannelKind = "ephemeral" | "durable";

/** Best-effort presence (cursors, selection, drag previews). */
export interface EphemeralChannel {
  readonly kind: "ephemeral";
  publish(topic: string, payload: Uint8Array | object): void;
  subscribe(topic: string, handler: (payload: unknown) => void): () => void;
}

/** Eventually consistent document state (CRDT-backed). */
export interface DurableDocStore {
  readonly kind: "durable";
  applyUpdate(update: Uint8Array): void;
  encodeState(): Uint8Array;
  onUpdate(handler: (update: Uint8Array) => void): () => void;
}

export const PROTOCOL_VERSION = 0 as const;

export function describeChannel(kind: ChannelKind): string {
  return kind === "ephemeral"
    ? "lossy presence / high-frequency transforms"
    : "CRDT durable content";
}
