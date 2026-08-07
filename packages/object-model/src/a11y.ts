import type { A11yMeta, CanvasObject } from "./schemas.js";

/** Derive a sensible accessible name from object fields. */
export function deriveA11yName(object: CanvasObject): string {
  switch (object.type) {
    case "note": {
      const line = object.text.trim().split(/\r?\n/)[0] ?? "";
      return line.slice(0, 80) || "Untitled note";
    }
    case "shape":
      return `${object.shape} shape`;
    case "frame":
      return object.title.trim() || "Untitled frame";
    case "connector":
      return "Connector";
    case "citation":
      return object.title.trim() || "Citation";
    case "summary":
      return object.status === "streaming"
        ? "Summary (streaming)"
        : object.status === "failed"
          ? "Summary (failed)"
          : object.text.trim().slice(0, 80) || "Summary";
    default: {
      const _exhaustive: never = object;
      return _exhaustive;
    }
  }
}

export function withDerivedA11y(
  object: CanvasObject,
  overrides?: Partial<A11yMeta>,
): A11yMeta {
  return {
    name: overrides?.name ?? deriveA11yName(object),
    description: overrides?.description ?? object.a11y.description,
  };
}
