import { worldToScreen } from "../camera.js";
import { rgbaToCss } from "../color.js";
import { hashSeed, pointsToPath, roughRectangle } from "../rough.js";
import { maxLinesForHeight, wrapText } from "../text-layout.js";
import type { Camera, RenderRect, ViewportSize } from "../types.js";

/** Above this many visible objects, simplify strokes. */
const DETAIL_OBJECT_CAP = 180;
/** Below this zoom, skip rough geometry. */
const ROUGH_MIN_ZOOM = 0.28;
const TEXT_MIN_ZOOM = 0.4;
const LINE_HEIGHT = 1.3;

/**
 * SVG interaction / a11y overlay: rough outlines + wrapped body text.
 */
export class SvgOverlay {
  readonly svg: SVGSVGElement;
  private root: SVGGElement;
  private defs: SVGDefsElement;
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

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);
    this.defs = defs;

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
   * Hit targets stay rectangular; ink is rough outline; text wraps inside.
   */
  sync(
    rects: readonly RenderRect[],
    camera: Camera,
    viewport: ViewportSize,
    selectedId: string | null,
  ): void {
    this.svg.setAttribute("viewBox", `0 0 ${viewport.width} ${viewport.height}`);
    this.root.replaceChildren();
    this.defs.replaceChildren();

    const detailed =
      camera.zoom >= ROUGH_MIN_ZOOM && rects.length <= DETAIL_OBJECT_CAP;

    for (const r of rects) {
      const tl = worldToScreen(camera, { x: r.x, y: r.y });
      const br = worldToScreen(camera, { x: r.x + r.w, y: r.y + r.h });
      const x = tl.x;
      const y = tl.y;
      const w = Math.max(1, br.x - tl.x);
      const h = Math.max(1, br.y - tl.y);
      const seed = hashSeed(r.id);
      const selected = selectedId === r.id;
      const strokeCss = rgbaToCss(r.stroke);
      const body = r.text || r.label;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("data-id", r.id);
      g.setAttribute("role", "img");
      g.setAttribute("aria-label", r.label);
      g.setAttribute("tabindex", "-1");
      g.style.pointerEvents = "auto";
      g.style.cursor = selected ? "grab" : "pointer";
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onActivate?.(r.id);
        }
      });

      // Invisible AABB hit target (stable picking)
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      hit.setAttribute("x", String(x));
      hit.setAttribute("y", String(y));
      hit.setAttribute("width", String(w));
      hit.setAttribute("height", String(h));
      hit.setAttribute("fill", "transparent");
      hit.setAttribute("stroke", "none");
      g.appendChild(hit);

      if (detailed) {
        const geom = roughRectangle(x, y, w, h, {
          seed,
          roughness: selected ? 1.05 : 1.25,
          bowing: 1.1,
          strokePasses: 2,
          density: camera.zoom >= 1 ? 1.2 : 0.9,
        });

        const sw = Math.max(1.35, Math.min(2.8, 1.7 * Math.sqrt(camera.zoom)));
        for (let i = 0; i < geom.strokePasses.length; i += 1) {
          const pass = geom.strokePasses[i]!;
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          path.setAttribute("d", pointsToPath(pass, true));
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", strokeCss);
          path.setAttribute(
            "stroke-width",
            String(i === 0 ? sw : sw * 0.82),
          );
          path.setAttribute("stroke-linejoin", "round");
          path.setAttribute("stroke-linecap", "round");
          path.setAttribute("opacity", i === 0 ? "0.95" : "0.5");
          path.style.pointerEvents = "none";
          g.appendChild(path);
        }

        if (selected) {
          const ring = roughRectangle(x - 4, y - 4, w + 8, h + 8, {
            seed: seed ^ 0xabc,
            roughness: 1.45,
            bowing: 1.25,
            strokePasses: 1,
          });
          const sel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          sel.setAttribute("d", pointsToPath(ring.strokePasses[0]!, true));
          sel.setAttribute("fill", "none");
          sel.setAttribute("stroke", "rgba(110,168,254,0.95)");
          sel.setAttribute(
            "stroke-width",
            String(Math.max(1.5, 2 * camera.zoom)),
          );
          sel.setAttribute("stroke-linejoin", "round");
          sel.setAttribute("stroke-dasharray", "7 5");
          sel.style.pointerEvents = "none";
          g.appendChild(sel);
        }
      } else {
        const simple = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        simple.setAttribute("x", String(x));
        simple.setAttribute("y", String(y));
        simple.setAttribute("width", String(w));
        simple.setAttribute("height", String(h));
        simple.setAttribute("rx", "2");
        simple.setAttribute("fill", "none");
        simple.setAttribute(
          "stroke",
          selected ? "rgba(110,168,254,0.9)" : strokeCss,
        );
        simple.setAttribute("stroke-width", selected ? "2" : "1");
        simple.style.pointerEvents = "none";
        g.appendChild(simple);
      }

      // Wrapped body text clipped to the rect
      if (camera.zoom >= TEXT_MIN_ZOOM && h >= 20 && w >= 28 && body) {
        this.appendWrappedText(g, r.id, body, x, y, w, h, camera.zoom);
      }

      this.root.appendChild(g);
    }
  }

  private appendWrappedText(
    g: SVGGElement,
    id: string,
    body: string,
    x: number,
    y: number,
    w: number,
    h: number,
    zoom: number,
  ): void {
    const padX = Math.max(8, Math.min(14, 10 * zoom));
    const padY = Math.max(6, Math.min(12, 8 * zoom));
    const fontSize = Math.min(18, Math.max(11, 13 * zoom));
    const innerW = Math.max(0, w - padX * 2);
    const innerH = Math.max(0, h - padY * 2);
    const maxLines = maxLinesForHeight(innerH, fontSize, LINE_HEIGHT, 0);
    if (maxLines < 1 || innerW < 8) return;

    const { lines } = wrapText(body, innerW, fontSize, maxLines);

    // Clip to padded box so ink never spills past the outline
    const clipId = `clip-${cssSafeId(id)}`;
    const clip = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "clipPath",
    );
    clip.setAttribute("id", clipId);
    const clipRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    clipRect.setAttribute("x", String(x + padX * 0.5));
    clipRect.setAttribute("y", String(y + padY * 0.5));
    clipRect.setAttribute("width", String(Math.max(1, w - padX)));
    clipRect.setAttribute("height", String(Math.max(1, h - padY)));
    clip.appendChild(clipRect);
    this.defs.appendChild(clip);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(x + padX));
    text.setAttribute("y", String(y + padY + fontSize));
    text.setAttribute("fill", "var(--rkc-canvas-ink, rgba(235,235,240,0.9))");
    text.setAttribute("font-size", String(fontSize));
    text.setAttribute(
      "font-family",
      'var(--rkc-font-sketch, "Virgil", "Segoe Print", "Comic Sans MS", cursive)',
    );
    text.setAttribute("clip-path", `url(#${clipId})`);
    text.style.pointerEvents = "none";
    text.style.userSelect = "none";

    const dy = fontSize * LINE_HEIGHT;
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan",
      );
      tspan.setAttribute("x", String(x + padX));
      if (i === 0) {
        tspan.setAttribute("dy", "0");
      } else {
        tspan.setAttribute("dy", String(dy));
      }
      tspan.textContent = line.length === 0 ? "\u00a0" : line;
      text.appendChild(tspan);
    });

    g.appendChild(text);
  }

  destroy(): void {
    this.root.replaceChildren();
    this.defs.replaceChildren();
    this.svg.remove();
  }
}

function cssSafeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}
