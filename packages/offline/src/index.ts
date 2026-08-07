/**
 * @rkc/offline
 *
 * Local-first persistence (IndexedDB) + online/save status helpers.
 * Service worker registration arrives in a later Slice 1 PR.
 */

export {
  DEFAULT_LOCAL_CANVAS_ID,
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  STORE_CANVASES,
} from "./constants.js";

export {
  createInitialOfflineStatus,
  getBrowserOnlineStatus,
  saveStatusLabel,
  type OfflineStatus,
  type SaveStatus,
  type SyncStatus,
} from "./status.js";

export { openOfflineDb, idbRequest, idbTxDone } from "./db.js";
// idbRequest / idbTxDone exported for advanced callers and tests

export {
  CanvasStore,
  getDefaultCanvasStore,
  resetDefaultCanvasStore,
  type CanvasStoreOptions,
} from "./canvas-store.js";

export {
  PersistenceSession,
  type PersistenceSessionOptions,
} from "./persistence-session.js";

export type { CanvasMeta, CanvasRecord } from "./types.js";
