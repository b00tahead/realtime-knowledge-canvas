import { worldToScreen } from "../camera.js";
import type { Camera, RenderRect, ViewportSize } from "../types.js";

/**
 * SVG interaction / a11y overlay.
 * Spike: draws focusable groups for visible rects (labels + hit targets).
 * Pointer drag/place is owned by CanvasEngine on the host; overlay keeps
 * keyboard activation for assistive tech.
 */
export class SvgOverlay {
  readonly svg: SVGSVGElement;
  private root: SVGGElement;
  private onActivate?: (id: string) => void;

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "Canvas objects");
    svg.style.position = "absolute";
    svg.style.inset = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "hidden";

    const root = document.createElementNS("http://www.w3.org/2000/svg", "g");
    root.setAttribute("data-rkc-overlay-root", "true");
    svg.appendChild(root);
    this.root = root;
  }

  setActivateHandler(handler: ((id: string) => void) | undefined): void {
    this.onActivate = handler;
  }

  /**
   * Rebuild overlay nodes for visible rects.
   * Keeps pointer-events on shapes so keyboard/AT can target them later;
   * pan is handled on the engine host (capture phase).
   */
  sync(
    rects: readonly RenderRect[],
    camera: Camera,
    viewport: ViewportSize,
    selectedId: string | null,
  ): void {
    this.svg.setAttribute("viewBox", `0 0 ${viewport.width} ${viewport.height}`);
    // Clear and rebuild (spike; later: keyed patching)
    this.root.replaceChildren();

    for (const r of rects) {
      const tl = worldToScreen(camera, { x: r.x, y: r.y });
      const br = worldToScreen(camera, { x: r.x + r.w, y: r.y + r.h });
      const x = tl.x;
      const y = tl.y;
      const w = Math.max(1, br.x - tl.x);
      const h = Math.max(1, br.y - tl.y);

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("data-id", r.id);
      g.setAttribute("role", "img");
      g.setAttribute("aria-label", r.label);
      g.setAttribute("tabindex", "-1");
      g.style.pointerEvents = "auto";
      g.style.cursor = selectedId === r.id ? "grab" : "pointer";
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onActivate?.(r.id);
        }
      });

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(w));
      rect.setAttribute("height", String(h));
      rect.setAttribute("rx", "6");
      rect.setAttribute(
        "fill",
        selectedId === r.id ? "rgba(110,168,254,0.12)" : "transparent",
      );
      rect.setAttribute(
        "stroke",
        selectedId === r.id ? "rgba(110,168,254,0.95)" : "transparent",
      );
      rect.setAttribute("stroke-width", selectedId === r.id ? "2" : "0");

      // Subtle label when zoomed in enough
      if (camera.zoom >= 0.55 && h >= 18) {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        text.setAttribute("x", String(x + 8));
        text.setAttribute("y", String(y + Math.min(20, h * 0.35)));
        text.setAttribute("fill", "rgba(232,234,239,0.92)");
        text.setAttribute("font-size", String(Math.min(14, 12 * camera.zoom)));
        text.setAttribute("font-family", "var(--rkc-font-sans, system-ui, sans-serif)");
        text.style.pointerEvents = "none";
        text.textContent =
          r.label.length > 40 ? `${r.label.slice(0, 37)}…` : r.label;
        g.append(rect, text);
      } else {
        g.append(rect);
      }

      this.root.appendChild(g);
    }
  }

  destroy(): void {
    this.root.replaceChildren();
    this.svg.remove();
  }
}
