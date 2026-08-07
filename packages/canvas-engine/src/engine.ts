import type { CanvasDocument, CanvasObject } from "@rkc/object-model";
import {
  createCamera,
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
  visibleWorldBounds,
} from "./camera.js";
import { GlRenderer } from "./gl/renderer.js";
import { PointerController } from "./input/pointer.js";
import { PerfTracker } from "./perf.js";
import { documentToRenderRects, objectsToRenderRects } from "./scene.js";
import { cullRects } from "./spatial.js";
import { SvgOverlay } from "./svg/overlay.js";
import type {
  Camera,
  EngineOptions,
  EngineStats,
  RenderRect,
  ViewportSize,
} from "./types.js";

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
  private minZoom: number;
  private maxZoom: number;
  private onStats?: (stats: EngineStats) => void;
  private onSelect?: (id: string | null) => void;

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

  constructor(options: EngineOptions) {
    this.container = options.container;
    this.minZoom = options.minZoom ?? DEFAULT_MIN_ZOOM;
    this.maxZoom = options.maxZoom ?? DEFAULT_MAX_ZOOM;
    this.onStats = options.onStats;

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
      "Infinite canvas. Space-drag or middle-mouse to pan, scroll to zoom.",
    );

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    host.append(canvas, svg);
    this.container.replaceChildren(host);
    this.host = host;

    this.renderer = new GlRenderer(canvas, options.background);
    this.overlay = new SvgOverlay(svg);
    this.overlay.setActivateHandler((id) => {
      this.selectedId = id;
      this.onSelect?.(id);
      this.dirty = true;
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

    // Empty-canvas click clears selection
    host.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const t = e.target as Element | null;
      if (t && t.closest("[data-id]")) return;
      if (this.selectedId) {
        this.selectedId = null;
        this.onSelect?.(null);
        this.dirty = true;
      }
    });

    this.ro = new ResizeObserver(() => {
      this.measure();
      this.dirty = true;
    });
    this.ro.observe(host);
    this.measure();
    this.start();
  }

  setOnStats(handler: ((stats: EngineStats) => void) | undefined): void {
    this.onStats = handler;
  }

  setOnSelect(handler: ((id: string | null) => void) | undefined): void {
    this.onSelect = handler;
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
    this.selectedId = id;
    this.dirty = true;
  }

  setRects(rects: RenderRect[]): void {
    this.rects = rects;
    this.dirty = true;
  }

  setObjects(objects: Iterable<CanvasObject>): void {
    this.setRects(objectsToRenderRects(objects));
  }

  setDocument(doc: CanvasDocument): void {
    this.setRects(documentToRenderRects(doc));
    if (doc.camera) {
      this.setCamera(doc.camera);
    }
  }

  /** Force a redraw on the next animation frame. */
  requestRender(): void {
    this.dirty = true;
  }

  focus(): void {
    this.host.focus();
  }

  destroy(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.pointer.destroy();
    this.overlay.destroy();
    this.renderer.destroy();
    this.container.replaceChildren();
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
