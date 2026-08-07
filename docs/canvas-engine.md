# Canvas engine

Package: `@rkc/canvas-engine`

Dual-surface infinite canvas (ADR 0002):

| Surface | Role |
|---------|------|
| **WebGL2** | Camera transform, batched axis-aligned rects, clear + paint timing |
| **SVG** | Hit targets, labels (when zoomed in), selection stroke, a11y names |

React is **not** required — `CanvasEngine` mounts into any `HTMLElement`. The web app uses `CanvasHost` as a thin host.

## Quick use

```ts
import { CanvasEngine, createStressRects } from "@rkc/canvas-engine";
import { createEmptyDocument, createNote, upsertObject } from "@rkc/object-model";

const engine = new CanvasEngine({
  container: document.getElementById("stage")!,
  onStats: (s) => console.log(s.lastPaintMs, s.visibleCount),
});

let doc = createEmptyDocument("demo");
doc = upsertObject(doc, createNote("Hello", { transform: { x: 0, y: 0, w: 200, h: 120 } }));
engine.setDocument(doc);

// or stress:
// engine.setRects(createStressRects(1000));

// later:
engine.destroy();
```

## Controls (spike)

| Input | Action |
|-------|--------|
| Scroll wheel | Zoom toward cursor |
| Space + drag | Pan |
| Middle mouse drag | Pan |
| Click object (SVG) | Select |
| Click empty | Clear selection |

## Performance

- Paint budget: **`PAINT_BUDGET_MS` = 16**
- Each frame: world AABB cull → upload visible rect triangle list → draw → sync SVG for visible set only
- HUD in the web app shows last/avg paint ms, visible/total objects, fps estimate

### Spike limits (honest)

- Full buffer rewrite every frame (no dirty regions / GPU instancing yet)
- SVG rebuilds all visible nodes (no keyed patching)
- No text in WebGL — labels only on SVG when zoom ≥ ~0.55
- Connectors not drawn yet

These are intentional for PR4; later PRs add LOD, spatial index, and incremental updates.

## Public API (highlights)

- `CanvasEngine` — lifecycle, `setDocument` / `setRects` / `setCamera`, stats
- `createCamera`, `screenToWorld`, `worldToScreen`, `panByScreen`, `zoomAtScreen`
- `cullRects`, `documentToRenderRects`, `createStressRects`
- `PAINT_BUDGET_MS`, `EngineStats`
