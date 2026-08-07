/**
 * Offline-first helpers (IndexedDB, service worker registration, background sync).
 * Full persistence lands in Slice 1; this package owns the public surface.
 */

export const OFFLINE_DB_NAME = "rkc-offline" as const;
export const OFFLINE_DB_VERSION = 1 as const;

export type SyncStatus = "idle" | "pending" | "syncing" | "error";

export interface OfflineStatus {
  online: boolean;
  sync: SyncStatus;
}

export function getBrowserOnlineStatus(): boolean {
  // Node may expose a partial `navigator` without a reliable `onLine` flag.
  if (
    typeof navigator === "undefined" ||
    typeof navigator.onLine !== "boolean"
  ) {
    return true;
  }
  return navigator.onLine;
}

export function createInitialOfflineStatus(): OfflineStatus {
  return {
    online: getBrowserOnlineStatus(),
    sync: "idle",
  };
}
