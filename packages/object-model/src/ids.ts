export type ObjectId = string;
export type UserId = string;
export type DocumentId = string;

/** Generate a stable-enough client id (works in browser + Node 19+). */
export function createId(prefix = "obj"): ObjectId {
  const uuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}
