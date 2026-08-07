import {
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  STORE_CANVASES,
} from "./constants.js";

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

/**
 * Open (or upgrade) the RKC offline database.
 * Schema v1: `canvases` object store, keyPath `id`, index `updatedAt`.
 */
export function openOfflineDb(
  name: string = OFFLINE_DB_NAME,
  version: number = OFFLINE_DB_VERSION,
): Promise<IDBDatabase> {
  if (!hasIndexedDb()) {
    return Promise.reject(
      new Error("IndexedDB is not available in this environment"),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB open failed"));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CANVASES)) {
        const store = db.createObjectStore(STORE_CANVASES, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("title", "title", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

/** Await transaction completion (after enqueueing operations). */
export function idbTxDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    if (tx.error) {
      reject(tx.error);
      return;
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}
