# ADR 0002: Dual-surface canvas engine (WebGL + SVG)

## Status

Accepted

## Context

We need sub-16 ms paint with thousands of objects *and* accessible, keyboard-navigable interaction. Pure WebGL is hard to expose to assistive tech; pure SVG/DOM struggles at large object counts.

## Decision

Build a **custom dual-surface engine**:

1. **WebGL scene** — camera transforms, bulk geometry, LOD, spatial culling, high-frequency pan/zoom.
2. **SVG/DOM overlay** — hit targets for the active set, text editing, focus rings, accessible names/roles, live regions.

The engine lives in `packages/canvas-engine` and is independent of React (React mounts/host only).

## Consequences

- Clear ownership: WebGL for scale, DOM for a11y and text.
- More engineering than adopting Konva/Fabric wholesale; justified by product goals.
- Early engine spike must prove paint budgets before deep feature work.
