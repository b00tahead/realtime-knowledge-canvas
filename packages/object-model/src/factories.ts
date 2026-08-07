import { createId } from "./ids.js";
import { deriveA11yName } from "./a11y.js";
import type {
  A11yMeta,
  CitationObject,
  ConnectorObject,
  FrameObject,
  NoteObject,
  ShapeKind,
  ShapeObject,
  SummaryObject,
  SummaryStatus,
  Transform2D,
} from "./schemas.js";
import type { UserId } from "./ids.js";

export interface CreateObjectOptions {
  id?: string;
  parentId?: string;
  createdBy?: UserId;
  updatedAt?: number;
  zIndex?: number;
  order?: number;
  a11y?: Partial<A11yMeta>;
  transform?: Partial<Transform2D>;
}

const DEFAULT_TRANSFORM: Transform2D = {
  x: 0,
  y: 0,
  w: 200,
  h: 120,
};

function resolveBase(options: CreateObjectOptions = {}) {
  const now = options.updatedAt ?? Date.now();
  return {
    id: options.id ?? createId(),
    parentId: options.parentId,
    transform: { ...DEFAULT_TRANSFORM, ...options.transform },
    zIndex: options.zIndex ?? 0,
    createdBy: options.createdBy ?? "local",
    updatedAt: now,
    order: options.order,
  };
}

export function createNote(
  text = "",
  options: CreateObjectOptions & { color?: string } = {},
): NoteObject {
  const base = resolveBase(options);
  const note: NoteObject = {
    ...base,
    type: "note",
    text,
    color: options.color,
    a11y: { name: "Untitled note" },
  };
  note.a11y = {
    name: options.a11y?.name ?? deriveA11yName(note),
    description: options.a11y?.description,
  };
  return note;
}

export function createShape(
  shape: ShapeKind = "rect",
  options: CreateObjectOptions & { fill?: string; stroke?: string } = {},
): ShapeObject {
  const base = resolveBase({
    ...options,
    transform: { w: 160, h: 100, ...options.transform },
  });
  const obj: ShapeObject = {
    ...base,
    type: "shape",
    shape,
    fill: options.fill,
    stroke: options.stroke,
    a11y: { name: `${shape} shape` },
  };
  obj.a11y = {
    name: options.a11y?.name ?? deriveA11yName(obj),
    description: options.a11y?.description,
  };
  return obj;
}

export function createFrame(
  title = "Frame",
  options: CreateObjectOptions = {},
): FrameObject {
  const base = resolveBase({
    ...options,
    transform: { w: 480, h: 320, ...options.transform },
  });
  const obj: FrameObject = {
    ...base,
    type: "frame",
    title,
    a11y: { name: title },
  };
  obj.a11y = {
    name: options.a11y?.name ?? deriveA11yName(obj),
    description: options.a11y?.description,
  };
  return obj;
}

export function createConnector(
  fromId: string,
  toId: string,
  options: CreateObjectOptions = {},
): ConnectorObject {
  const base = resolveBase({
    ...options,
    transform: { x: 0, y: 0, w: 1, h: 1, ...options.transform },
  });
  const obj: ConnectorObject = {
    ...base,
    type: "connector",
    fromId,
    toId,
    a11y: { name: "Connector" },
  };
  obj.a11y = {
    name: options.a11y?.name ?? deriveA11yName(obj),
    description: options.a11y?.description,
  };
  return obj;
}

export function createCitation(
  title: string,
  options: CreateObjectOptions & {
    url?: string;
    authors?: string[];
  } = {},
): CitationObject {
  const base = resolveBase({
    ...options,
    transform: { w: 240, h: 100, ...options.transform },
  });
  const obj: CitationObject = {
    ...base,
    type: "citation",
    title,
    url: options.url,
    authors: options.authors,
    a11y: { name: title },
  };
  obj.a11y = {
    name: options.a11y?.name ?? deriveA11yName(obj),
    description: options.a11y?.description,
  };
  return obj;
}

export function createSummary(
  text = "",
  options: CreateObjectOptions & {
    status?: SummaryStatus;
    sourceIds?: string[];
  } = {},
): SummaryObject {
  const base = resolveBase({
    ...options,
    transform: { w: 280, h: 160, ...options.transform },
  });
  const obj: SummaryObject = {
    ...base,
    type: "summary",
    text,
    status: options.status ?? "ready",
    sourceIds: options.sourceIds,
    a11y: { name: "Summary" },
  };
  obj.a11y = {
    name: options.a11y?.name ?? deriveA11yName(obj),
    description: options.a11y?.description,
  };
  return obj;
}
