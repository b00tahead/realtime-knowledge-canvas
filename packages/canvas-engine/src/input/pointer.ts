import {
  DEFAULT_MAX_ZOOM,
  DEFAULT_MIN_ZOOM,
  panByScreen,
  zoomAtScreen,
} from "../camera.js";
import type { Camera } from "../types.js";

export interface PointerControllerOptions {
  element: HTMLElement;
  getCamera: () => Camera;
  setCamera: (camera: Camera) => void;
  minZoom?: number;
  maxZoom?: number;
  /** Return true if the event target should not start a pan (e.g. SVG object). */
  shouldIgnorePanStart?: (target: EventTarget | null) => boolean;
}

/**
 * Space+drag or middle-button pan; wheel zoom toward cursor.
 */
export class PointerController {
  private el: HTMLElement;
  private getCamera: () => Camera;
  private setCamera: (c: Camera) => void;
  private minZoom: number;
  private maxZoom: number;
  private shouldIgnorePanStart?: (target: EventTarget | null) => boolean;

  private panning = false;
  private lastX = 0;
  private lastY = 0;
  private spaceDown = false;

  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onPointerDown: (e: PointerEvent) => void;
  private onPointerMove: (e: PointerEvent) => void;
  private onPointerUp: (e: PointerEvent) => void;
  private onWheel: (e: WheelEvent) => void;
  private onContextMenu: (e: Event) => void;

  constructor(opts: PointerControllerOptions) {
    this.el = opts.element;
    this.getCamera = opts.getCamera;
    this.setCamera = opts.setCamera;
    this.minZoom = opts.minZoom ?? DEFAULT_MIN_ZOOM;
    this.maxZoom = opts.maxZoom ?? DEFAULT_MAX_ZOOM;
    this.shouldIgnorePanStart = opts.shouldIgnorePanStart;

    this.onKeyDown = (e) => {
      if (e.code === "Space" && !e.repeat) {
        this.spaceDown = true;
        this.el.style.cursor = "grab";
      }
    };
    this.onKeyUp = (e) => {
      if (e.code === "Space") {
        this.spaceDown = false;
        if (!this.panning) this.el.style.cursor = "";
      }
    };
    this.onPointerDown = (e) => {
      const panButton = e.button === 1 || (e.button === 0 && this.spaceDown);
      if (!panButton) return;
      if (this.shouldIgnorePanStart?.(e.target) && !this.spaceDown && e.button !== 1) {
        return;
      }
      e.preventDefault();
      this.panning = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.el.setPointerCapture(e.pointerId);
      this.el.style.cursor = "grabbing";
    };
    this.onPointerMove = (e) => {
      if (!this.panning) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.setCamera(panByScreen(this.getCamera(), dx, dy));
    };
    this.onPointerUp = (e) => {
      if (!this.panning) return;
      this.panning = false;
      try {
        this.el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      this.el.style.cursor = this.spaceDown ? "grab" : "";
    };
    this.onWheel = (e) => {
      e.preventDefault();
      const rect = this.el.getBoundingClientRect();
      const screen = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const camera = this.getCamera();
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      this.setCamera(
        zoomAtScreen(
          camera,
          screen,
          camera.zoom * factor,
          this.minZoom,
          this.maxZoom,
        ),
      );
    };
    this.onContextMenu = (e) => {
      // avoid menu on middle-click related gestures
      if (this.spaceDown) e.preventDefault();
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.el.addEventListener("pointerdown", this.onPointerDown);
    this.el.addEventListener("pointermove", this.onPointerMove);
    this.el.addEventListener("pointerup", this.onPointerUp);
    this.el.addEventListener("pointercancel", this.onPointerUp);
    this.el.addEventListener("wheel", this.onWheel, { passive: false });
    this.el.addEventListener("contextmenu", this.onContextMenu);
  }

  isSpaceDown(): boolean {
    return this.spaceDown;
  }

  isPanning(): boolean {
    return this.panning;
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.el.removeEventListener("pointerdown", this.onPointerDown);
    this.el.removeEventListener("pointermove", this.onPointerMove);
    this.el.removeEventListener("pointerup", this.onPointerUp);
    this.el.removeEventListener("pointercancel", this.onPointerUp);
    this.el.removeEventListener("wheel", this.onWheel);
    this.el.removeEventListener("contextmenu", this.onContextMenu);
  }
}
