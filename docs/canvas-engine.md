# Canvas engine

Package: `@rkc/canvas-engine`

Dual-surface infinite canvas (ADR 0002):

| Surface | Role |
|---------|------|
| **WebGL2** | Camera transform, batched soft fills, paint timing (transparent over CSS paper) |
| **SVG** | Rough hand-drawn strokes, hachure (LOD), labels, hit targets, selection ring, a11y |

Visual language is **Excalidraw-adjacent**: outline-only rough rects (no fills for now), wrapped body text clipped inside each note, sketch typography (`--rkc-font-sketch` / Virgil), and a dotted paper board. Per-note colors can return later.

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

## Controls

| Input | Action |
|-------|--------|
| Scroll wheel | Zoom toward cursor |
| Space + drag | Pan |
| Middle mouse drag | Pan |
| Click object | Select |
| Drag object | Move (commit on pointer up) |
| Double-click object | Edit request (host opens in-place editor) |
| Click empty (select tool) | Clear selection |
| Click empty (note tool) | Place note at world point |
| Delete / Backspace | Delete request for selection |
| Escape (note tool) | Switch to select tool |

Tools: `select` | `note` via `setTool()`.

## Performance

- Paint budget: **`PAINT_BUDGET_MS` = 16**
- Each frame: world AABB cull → upload visible rect triangle list → draw → sync SVG for visible set only
- HUD in the web app shows last/avg paint ms, visible/total objects, fps estimate

### Spike limits (honest)

- Full buffer rewrite every frame (no dirty regions / GPU instancing yet)
- SVG rebuilds all visible nodes (no keyed patching)
- Rough strokes simplify / drop hachure past object or zoom thresholds
- No text in WebGL — labels only on SVG when zoom ≥ ~0.5
- Connectors not drawn yet

Later: keyed SVG patching, GPU stroke instancing, world-space grid that pans with the camera.

## Public API (highlights)

- `CanvasEngine` — lifecycle, `setDocument` / `setRects` / `setCamera`, tools + selection
- Callbacks: `setOnSelect`, `setOnTransformEnd`, `setOnEditRequest`, `setOnPlace`, `setOnDeleteRequest`
- `createCamera`, `screenToWorld`, `worldToScreen`, `panByScreen`, `zoomAtScreen`
- `cullRects`, `documentToRenderRects`, `createStressRects`
- `PAINT_BUDGET_MS`, `EngineStats`, `EngineTool`
