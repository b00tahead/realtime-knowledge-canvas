import type { CanvasDocument, CanvasObject } from "@rkc/object-model";
import {
  createCamera,
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
  screenToWorld,
  visibleWorldBounds,
  worldToScreen,
} from "./camera.js";
import { GlRenderer } from "./gl/renderer.js";
import { PointerController } from "./input/pointer.js";
import { PerfTracker } from "./perf.js";
import { CANVAS_BG_DARK, CANVAS_BG_LIGHT } from "./color.js";
import {
  createStressRects,
  documentToRenderRects,
  objectsToRenderRects,
  type CanvasSurface,
} from "./scene.js";
import { cullRects } from "./spatial.js";
import { SvgOverlay } from "./svg/overlay.js";
import type {
  Camera,
  EngineOptions,
  EngineStats,
  EngineTool,
  RenderRect,
  ViewportSize,
  WorldPoint,
} from "./types.js";

const DRAG_THRESHOLD_PX = 3;
const DBLCLICK_MS = 350;
const DBLCLICK_SLOP_PX = 6;

interface ObjectDragState {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  moved: boolean;
  /** Capture only after drag starts so dblclick still fires. */
  captured: boolean;
}

interface LastClickState {
  id: string;
  at: number;
  x: number;
  y: number;
}

export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Dual-surface canvas engine: WebGL bulk draw + SVG a11y/hit overlay.
 * Framework-agnostic — React only mounts the container.
 */
export class CanvasEngine {
  readonly container: HTMLElement;
  private host: HTMLDivElement;
  private renderer: GlRenderer;
  private overlay: SvgOverlay;
  private pointer: PointerController;
  private ro: ResizeObserver;
  private perf = new PerfTracker();

  private camera: Camera = createCamera();
  private viewport: ViewportSize = { width: 1, height: 1, dpr: 1 };
  private rects: RenderRect[] = [];
  private selectedId: string | null = null;
  private tool: EngineTool = "select";
  private surface: CanvasSurface = "dark";
  private minZoom: number;
  private maxZoom: number;
  /** Last document/objects source so surface changes can rebuild colors. */
  private lastDoc: CanvasDocument | null = null;
  private lastStressCount: number | null = null;
  private onStats?: (stats: EngineStats) => void;
  private onSelect?: (id: string | null) => void;
  private onTransformEnd?: (id: string, position: WorldPoint) => void;
  private onEditRequest?: (id: string) => void;
  private onPlace?: (world: WorldPoint) => void;
  private onDeleteRequest?: (id: string) => void;
  private onToolChange?: (tool: EngineTool) => void;

  private drag: ObjectDragState | null = null;
  private lastClick: LastClickState | null = null;
  private dirty = true;
  private raf = 0;
  private running = false;
  private lastStats: EngineStats = {
    lastPaintMs: 0,
    avgPaintMs: 0,
    objectCount: 0,
    visibleCount: 0,
    withinBudget: true,
    fps: 0,
  };

  private onHostPointerDown: (e: PointerEvent) => void;
  private onHostPointerMove: (e: PointerEvent) => void;
  private onHostPointerUp: (e: PointerEvent) => void;
  private onHostDblClick: (e: MouseEvent) => void;
  private onHostKeyDown: (e: KeyboardEvent) => void;

  constructor(options: EngineOptions) {
    this.container = options.container;
    this.minZoom = options.minZoom ?? DEFAULT_MIN_ZOOM;
    this.maxZoom = options.maxZoom ?? DEFAULT_MAX_ZOOM;
    this.onStats = options.onStats;
    this.tool = options.tool ?? "select";
    this.surface = options.surface ?? "dark";

    const host = document.createElement("div");
    host.className = "rkc-canvas-engine";
    host.style.position = "relative";
    host.style.width = "100%";
    host.style.height = "100%";
    host.style.overflow = "hidden";
    host.style.touchAction = "none";
    host.tabIndex = 0;
    host.setAttribute("role", "application");
    host.setAttribute(
      "aria-label",
      "Infinite canvas. Space-drag or middle-mouse to pan, scroll to zoom. Drag notes to move. Delete removes selection.",
    );
    this.applyHostChrome(host);

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    host.append(canvas, svg);
    this.container.replaceChildren(host);
    this.host = host;

    this.renderer = new GlRenderer(
      canvas,
      options.background ??
        (this.surface === "light" ? CANVAS_BG_LIGHT : CANVAS_BG_DARK),
    );
    this.overlay = new SvgOverlay(svg);
    this.overlay.setActivateHandler((id) => {
      this.select(id);
    });

    this.pointer = new PointerController({
      element: host,
      getCamera: () => this.camera,
      setCamera: (c) => {
        this.camera = c;
        this.dirty = true;
      },
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      shouldIgnorePanStart: (target) => {
        if (!(target instanceof Element)) return false;
        return Boolean(target.closest("[data-id]"));
      },
    });

    this.onHostPointerDown = (e) => this.handlePointerDown(e);
    this.onHostPointerMove = (e) => this.handlePointerMove(e);
    this.onHostPointerUp = (e) => this.handlePointerUp(e);
    this.onHostDblClick = (e) => this.handleDblClick(e);
    this.onHostKeyDown = (e) => this.handleKeyDown(e);

    host.addEventListener("pointerdown", this.onHostPointerDown);
    host.addEventListener("pointermove", this.onHostPointerMove);
    host.addEventListener("pointerup", this.onHostPointerUp);
    host.addEventListener("pointercancel", this.onHostPointerUp);
    host.addEventListener("dblclick", this.onHostDblClick);
    host.addEventListener("keydown", this.onHostKeyDown);

    this.ro = new ResizeObserver(() => {
      this.measure();
      this.dirty = true;
    });
    this.ro.observe(host);
    this.measure();
    this.applyToolCursor();
    this.start();
  }

  setOnStats(handler: ((stats: EngineStats) => void) | undefined): void {
    this.onStats = handler;
  }

  setOnSelect(handler: ((id: string | null) => void) | undefined): void {
    this.onSelect = handler;
  }

  /** Fired once when a drag-move ends (document should commit here). */
  setOnTransformEnd(
    handler: ((id: string, position: WorldPoint) => void) | undefined,
  ): void {
    this.onTransformEnd = handler;
  }

  /** Double-click on an object (e.g. focus inspector text). */
  setOnEditRequest(handler: ((id: string) => void) | undefined): void {
    this.onEditRequest = handler;
  }

  /** Click empty canvas while note tool is active. */
  setOnPlace(handler: ((world: WorldPoint) => void) | undefined): void {
    this.onPlace = handler;
  }

  /** Delete/Backspace with a selection (when host is focused). */
  setOnDeleteRequest(handler: ((id: string) => void) | undefined): void {
    this.onDeleteRequest = handler;
  }

  /** Fired when the engine changes tool (e.g. Escape exits note tool). */
  setOnToolChange(handler: ((tool: EngineTool) => void) | undefined): void {
    this.onToolChange = handler;
  }

  getTool(): EngineTool {
    return this.tool;
  }

  setTool(tool: EngineTool): void {
    if (this.tool === tool) return;
    this.tool = tool;
    this.applyToolCursor();
    this.onToolChange?.(tool);
  }

  getSurface(): CanvasSurface {
    return this.surface;
  }

  setSurface(surface: CanvasSurface): void {
    if (this.surface === surface) return;
    this.surface = surface;
    this.renderer.setBackground(
      surface === "light" ? CANVAS_BG_LIGHT : CANVAS_BG_DARK,
    );
    this.applyHostChrome(this.host);
    if (this.lastStressCount && this.lastStressCount > 0) {
      this.setRects(
        createStressRects(this.lastStressCount, { surface: this.surface }),
      );
    } else if (this.lastDoc) {
      this.setRects(documentToRenderRects(this.lastDoc, this.surface));
    }
    this.dirty = true;
  }

  getCamera(): Camera {
    return { ...this.camera };
  }

  setCamera(camera: Partial<Camera>): void {
    this.camera = {
      x: camera.x ?? this.camera.x,
      y: camera.y ?? this.camera.y,
      zoom: camera.zoom ?? this.camera.zoom,
    };
    this.dirty = true;
  }

  getStats(): EngineStats {
    return { ...this.lastStats };
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  setSelectedId(id: string | null): void {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.dirty = true;
  }

  setRects(rects: RenderRect[]): void {
    // Don't clobber in-flight drag positions with a stale document snapshot
    if (this.drag?.moved) return;
    this.rects = rects;
    this.dirty = true;
  }

  setObjects(objects: Iterable<CanvasObject>): void {
    this.lastDoc = null;
    this.lastStressCount = null;
    this.setRects(objectsToRenderRects(objects, this.surface));
  }

  setDocument(doc: CanvasDocument): void {
    this.lastDoc = doc;
    this.lastStressCount = null;
    this.setRects(documentToRenderRects(doc, this.surface));
    if (doc.camera) {
      this.setCamera(doc.camera);
    }
  }

  /** Stress grid fixtures (not persisted). */
  setStress(count: number): void {
    this.lastDoc = null;
    this.lastStressCount = count;
    this.setRects(createStressRects(count, { surface: this.surface }));
  }

  /** Force a redraw on the next animation frame. */
  requestRender(): void {
    this.dirty = true;
  }

  focus(): void {
    this.host.focus();
  }

  /**
   * Screen-space AABB of an object relative to the engine host (CSS px).
   * Used for in-place editors.
   */
  getObjectScreenRect(id: string): ScreenRect | null {
    const r = this.rects.find((x) => x.id === id);
    if (!r) return null;
    const tl = worldToScreen(this.camera, { x: r.x, y: r.y });
    const br = worldToScreen(this.camera, {
      x: r.x + r.w,
      y: r.y + r.h,
    });
    return {
      x: tl.x,
      y: tl.y,
      w: Math.max(1, br.x - tl.x),
      h: Math.max(1, br.y - tl.y),
    };
  }

  destroy(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.host.removeEventListener("pointerdown", this.onHostPointerDown);
    this.host.removeEventListener("pointermove", this.onHostPointerMove);
    this.host.removeEventListener("pointerup", this.onHostPointerUp);
    this.host.removeEventListener("pointercancel", this.onHostPointerUp);
    this.host.removeEventListener("dblclick", this.onHostDblClick);
    this.host.removeEventListener("keydown", this.onHostKeyDown);
    this.pointer.destroy();
    this.overlay.destroy();
    this.renderer.destroy();
    this.container.replaceChildren();
  }

  private select(id: string | null): void {
    if (this.selectedId === id) {
      this.onSelect?.(id);
      return;
    }
    this.selectedId = id;
    this.onSelect?.(id);
    this.dirty = true;
  }

  private applyHostChrome(host: HTMLElement): void {
    host.dataset.surface = this.surface;
    host.style.setProperty(
      "--rkc-canvas-ink",
      this.surface === "light"
        ? "rgba(28, 28, 30, 0.9)"
        : "rgba(235, 235, 240, 0.9)",
    );
    // Match paper under transparent GL so pan/zoom never flashes wrong clear
    host.style.backgroundColor =
      this.surface === "light" ? "#f8f5ef" : "#121318";
  }

  private applyToolCursor(): void {
    if (this.drag?.moved) {
      this.host.style.cursor = "grabbing";
      return;
    }
    if (this.pointer.isSpaceDown()) return; // pan controller owns grab cursor
    this.host.style.cursor = this.tool === "note" ? "crosshair" : "";
  }

  private clientToWorld(clientX: number, clientY: number): WorldPoint {
    const rect = this.host.getBoundingClientRect();
    return screenToWorld(this.camera, {
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  }

  private hitObjectId(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null;
    // Walk from target; when pointer is captured, target may be the host
    const el = target.closest("[data-id]");
    if (!el) return null;
    return el.getAttribute("data-id");
  }

  /** Spatial hit-test in world space (topmost by array order / z). */
  private hitObjectAtClient(clientX: number, clientY: number): string | null {
    const world = this.clientToWorld(clientX, clientY);
    // rects are sorted low→high z; pick last containing
    for (let i = this.rects.length - 1; i >= 0; i -= 1) {
      const r = this.rects[i]!;
      if (
        world.x >= r.x &&
        world.x <= r.x + r.w &&
        world.y >= r.y &&
        world.y <= r.y + r.h
      ) {
        return r.id;
      }
    }
    return null;
  }

  private requestEdit(id: string): void {
    this.select(id);
    this.onEditRequest?.(id);
    // Prevent a third click from treating this as another double
    this.lastClick = null;
  }

  private handlePointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    if (this.pointer.isSpaceDown() || this.pointer.isPanning()) return;

    // Prefer DOM hit, fall back to spatial (needed under pointer capture)
    const id =
      this.hitObjectId(e.target) ??
      this.hitObjectAtClient(e.clientX, e.clientY);

    if (id) {
      this.select(id);
      const rect = this.rects.find((r) => r.id === id);
      if (!rect) return;
      // Do NOT capture yet — early capture retargets dblclick to the host
      this.drag = {
        id,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: rect.x,
        originY: rect.y,
        moved: false,
        captured: false,
      };
      return;
    }

    // Empty canvas
    this.lastClick = null;
    if (this.tool === "note") {
      e.preventDefault();
      const world = this.clientToWorld(e.clientX, e.clientY);
      this.onPlace?.(world);
      return;
    }

    if (this.selectedId) {
      this.select(null);
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== e.pointerId) return;
    if (this.pointer.isPanning()) return;

    const dxScreen = e.clientX - this.drag.startClientX;
    const dyScreen = e.clientY - this.drag.startClientY;
    if (
      !this.drag.moved &&
      Math.hypot(dxScreen, dyScreen) < DRAG_THRESHOLD_PX
    ) {
      return;
    }

    if (!this.drag.captured) {
      try {
        this.host.setPointerCapture(e.pointerId);
        this.drag.captured = true;
      } catch {
        /* ignore */
      }
    }

    this.drag.moved = true;
    this.lastClick = null; // drag cancels double-click chain
    const zoom = this.camera.zoom || 1;
    const nextX = this.drag.originX + dxScreen / zoom;
    const nextY = this.drag.originY + dyScreen / zoom;

    this.rects = this.rects.map((r) =>
      r.id === this.drag!.id ? { ...r, x: nextX, y: nextY } : r,
    );
    this.host.style.cursor = "grabbing";
    this.dirty = true;
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== e.pointerId) return;

    const { id, moved, captured } = this.drag;
    const rect = this.rects.find((r) => r.id === id);
    this.drag = null;

    if (captured) {
      try {
        this.host.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }

    this.applyToolCursor();

    if (moved && rect) {
      this.onTransformEnd?.(id, { x: rect.x, y: rect.y });
      return;
    }

    // Click (no drag): detect double-click without relying on dblclick target
    const now = performance.now();
    const prev = this.lastClick;
    if (
      prev &&
      prev.id === id &&
      now - prev.at <= DBLCLICK_MS &&
      Math.hypot(e.clientX - prev.x, e.clientY - prev.y) <= DBLCLICK_SLOP_PX
    ) {
      this.requestEdit(id);
      return;
    }

    this.lastClick = {
      id,
      at: now,
      x: e.clientX,
      y: e.clientY,
    };
  }

  private handleDblClick(e: MouseEvent): void {
    // Spatial hit: pointer capture can make e.target the host, missing data-id
    const id =
      this.hitObjectId(e.target) ??
      this.hitObjectAtClient(e.clientX, e.clientY);
    if (!id) return;
    e.preventDefault();
    this.requestEdit(id);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      if (this.tool === "note") {
        e.preventDefault();
        this.setTool("select");
        return;
      }
      if (this.selectedId) {
        e.preventDefault();
        this.select(null);
        return;
      }
    }

    if (
      (e.key === "Delete" || e.key === "Backspace") &&
      this.selectedId &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey
    ) {
      // Don't steal backspace from form fields if focus somehow leaves host
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      this.onDeleteRequest?.(this.selectedId);
    }
  }

  private measure(): void {
    const rect = this.host.getBoundingClientRect();
    this.viewport = {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    this.renderer.resize(this.viewport);
  }

  private start(): void {
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      if (this.dirty) {
        this.paint();
        this.dirty = false;
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private paint(): void {
    const t0 = performance.now();
    const view = visibleWorldBounds(this.camera, this.viewport, 64);
    const visible = cullRects(this.rects, view);

    this.renderer.draw(visible, this.camera, this.viewport);
    this.overlay.sync(visible, this.camera, this.viewport, this.selectedId);

    const paintMs = performance.now() - t0;
    this.lastStats = this.perf.recordPaint(
      paintMs,
      this.rects.length,
      visible.length,
    );
    this.onStats?.(this.lastStats);
  }
}
