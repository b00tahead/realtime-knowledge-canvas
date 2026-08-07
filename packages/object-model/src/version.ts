/** Schema version for persisted canvas documents. Bump when shapes change. */
export const OBJECT_MODEL_VERSION = 1 as const;

export type ObjectModelVersion = typeof OBJECT_MODEL_VERSION;
