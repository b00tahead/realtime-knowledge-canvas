export type SyncStatus = "idle" | "pending" | "syncing" | "error";

/** Local document persistence status (IndexedDB autosave). */
export type SaveStatus =
  | "idle"
  | "loading"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

export interface OfflineStatus {
  online: boolean;
  /** Reserved for remote/background sync (Slice 2). */
  sync: SyncStatus;
  save: SaveStatus;
  lastSavedAt: number | null;
  lastError: string | null;
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

export function createInitialOfflineStatus(
  partial?: Partial<OfflineStatus>,
): OfflineStatus {
  return {
    online: getBrowserOnlineStatus(),
    sync: "idle",
    save: "idle",
    lastSavedAt: null,
    lastError: null,
    ...partial,
  };
}

export function saveStatusLabel(status: SaveStatus): string {
  switch (status) {
    case "idle":
      return "Not loaded";
    case "loading":
      return "Loading…";
    case "dirty":
      return "Unsaved changes";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved locally";
    case "error":
      return "Save failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
