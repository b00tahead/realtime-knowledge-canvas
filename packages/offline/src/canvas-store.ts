import {
  migrateDocument,
  objectCount,
  type CanvasDocument,
} from "@rkc/object-model";
import { STORE_CANVASES } from "./constants.js";
import { idbRequest, idbTxDone, openOfflineDb } from "./db.js";
import type { CanvasMeta, CanvasRecord } from "./types.js";

function toRecord(document: CanvasDocument): CanvasRecord {
  return {
    id: document.id,
    title: document.title,
    updatedAt: document.updatedAt,
    objectCount: objectCount(document),
    version: document.version,
    document,
  };
}

function toMeta(record: CanvasRecord): CanvasMeta {
  return {
    id: record.id,
    title: record.title,
    updatedAt: record.updatedAt,
    objectCount: record.objectCount,
    version: record.version,
  };
}

export interface CanvasStoreOptions {
  dbName?: string;
  dbVersion?: number;
}

/**
 * IndexedDB-backed store for canvas documents.
 * Reads run migration + schema validation; writes store the full document.
 */
export class CanvasStore {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly dbName?: string;
  private readonly dbVersion?: number;

  constructor(options: CanvasStoreOptions = {}) {
    this.dbName = options.dbName;
    this.dbVersion = options.dbVersion;
  }

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openOfflineDb(this.dbName, this.dbVersion);
    }
    return this.dbPromise;
  }

  async put(document: CanvasDocument): Promise<CanvasRecord> {
    const record = toRecord(document);
    const db = await this.db();
    const tx = db.transaction(STORE_CANVASES, "readwrite");
    const store = tx.objectStore(STORE_CANVASES);
    store.put(record);
    await idbTxDone(tx);
    return record;
  }

  async get(id: string): Promise<CanvasDocument | undefined> {
    const db = await this.db();
    const tx = db.transaction(STORE_CANVASES, "readonly");
    const store = tx.objectStore(STORE_CANVASES);
    const raw = await idbRequest(store.get(id));
    await idbTxDone(tx);
    if (!raw) return undefined;

    // Prefer nested document; fall back if an older shape stored the doc at root
    const payload =
      raw && typeof raw === "object" && "document" in raw
        ? (raw as CanvasRecord).document
        : raw;

    const migrated = migrateDocument(payload);
    return migrated.document;
  }

  async getMeta(id: string): Promise<CanvasMeta | undefined> {
    const db = await this.db();
    const tx = db.transaction(STORE_CANVASES, "readonly");
    const store = tx.objectStore(STORE_CANVASES);
    const raw = await idbRequest<CanvasRecord | undefined>(store.get(id));
    await idbTxDone(tx);
    if (!raw) return undefined;
    return toMeta(raw);
  }

  async list(): Promise<CanvasMeta[]> {
    const db = await this.db();
    const tx = db.transaction(STORE_CANVASES, "readonly");
    const store = tx.objectStore(STORE_CANVASES);
    const all = await idbRequest<CanvasRecord[]>(store.getAll());
    await idbTxDone(tx);
    return all
      .map(toMeta)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async delete(id: string): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(STORE_CANVASES, "readwrite");
    tx.objectStore(STORE_CANVASES).delete(id);
    await idbTxDone(tx);
  }

  async clear(): Promise<void> {
    const db = await this.db();
    const tx = db.transaction(STORE_CANVASES, "readwrite");
    tx.objectStore(STORE_CANVASES).clear();
    await idbTxDone(tx);
  }

  /**
   * Load document by id, or create via factory, persist, and return.
   */
  async loadOrCreate(
    id: string,
    factory: () => CanvasDocument,
  ): Promise<{ document: CanvasDocument; created: boolean }> {
    const existing = await this.get(id);
    if (existing) {
      return { document: existing, created: false };
    }
    const document = factory();
    if (document.id !== id) {
      // Normalize id to requested key
      const normalized = { ...document, id };
      await this.put(normalized);
      return { document: normalized, created: true };
    }
    await this.put(document);
    return { document, created: true };
  }

  /** Close the underlying connection (tests / teardown). */
  async close(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }
}

let defaultStore: CanvasStore | null = null;

/** Shared store for the web app (single DB name). */
export function getDefaultCanvasStore(): CanvasStore {
  if (!defaultStore) defaultStore = new CanvasStore();
  return defaultStore;
}

/** Test helper — reset singleton. */
export function resetDefaultCanvasStore(): void {
  defaultStore = null;
}
