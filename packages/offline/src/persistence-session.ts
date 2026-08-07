import type { CanvasDocument } from "@rkc/object-model";
import type { CanvasStore } from "./canvas-store.js";
import type { SaveStatus } from "./status.js";

export interface PersistenceSessionOptions {
  store: CanvasStore;
  /** Debounce before writing dirty docs (ms). Default 400. */
  debounceMs?: number;
  onStatus?: (status: SaveStatus, detail?: { error?: string; at?: number }) => void;
}

/**
 * Tracks dirty state and debounced autosave for a single open document.
 */
export class PersistenceSession {
  private store: CanvasStore;
  private debounceMs: number;
  private onStatus?: PersistenceSessionOptions["onStatus"];
  private document: CanvasDocument | null = null;
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private saveChain: Promise<void> = Promise.resolve();
  private status: SaveStatus = "idle";
  private lastSavedAt: number | null = null;
  private lastError: string | null = null;
  private disposed = false;

  constructor(options: PersistenceSessionOptions) {
    this.store = options.store;
    this.debounceMs = options.debounceMs ?? 400;
    this.onStatus = options.onStatus;
  }

  getDocument(): CanvasDocument | null {
    return this.document;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  getStatus(): SaveStatus {
    return this.status;
  }

  getLastSavedAt(): number | null {
    return this.lastSavedAt;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Load from store or create via factory. Does not mark dirty.
   */
  async loadOrCreate(
    id: string,
    factory: () => CanvasDocument,
  ): Promise<CanvasDocument> {
    this.setStatus("loading");
    try {
      const { document } = await this.store.loadOrCreate(id, factory);
      this.document = document;
      this.dirty = false;
      this.lastError = null;
      this.setStatus("saved", { at: document.updatedAt });
      this.lastSavedAt = document.updatedAt;
      return document;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.lastError = message;
      this.setStatus("error", { error: message });
      throw err;
    }
  }

  /**
   * Replace the in-memory document and schedule autosave.
   */
  update(document: CanvasDocument, options?: { immediate?: boolean }): void {
    if (this.disposed) return;
    this.document = document;
    this.dirty = true;
    this.lastError = null;
    this.setStatus("dirty");
    if (options?.immediate) {
      void this.flush();
    } else {
      this.schedule();
    }
  }

  /** Cancel pending debounce and write now (if dirty). */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.persist();
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.persist();
    }, this.debounceMs);
  }

  private persist(): Promise<void> {
    this.saveChain = this.saveChain
      .then(async () => {
        if (this.disposed || !this.dirty || !this.document) return;
        const snapshot = this.document;
        this.setStatus("saving");
        try {
          await this.store.put(snapshot);
          // Only clear dirty if no newer edits landed during await
          if (this.document === snapshot || this.document.updatedAt === snapshot.updatedAt) {
            this.dirty = false;
          }
          this.lastSavedAt = Date.now();
          this.lastError = null;
          this.setStatus(this.dirty ? "dirty" : "saved", {
            at: this.lastSavedAt,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.lastError = message;
          this.setStatus("error", { error: message });
        }
      })
      .catch(() => {
        /* chain isolation */
      });
    return this.saveChain;
  }

  private setStatus(
    status: SaveStatus,
    detail?: { error?: string; at?: number },
  ): void {
    this.status = status;
    this.onStatus?.(status, detail);
  }
}
