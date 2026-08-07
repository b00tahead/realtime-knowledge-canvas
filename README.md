# Realtime Knowledge Canvas

Open-source **collaborative thinking surface**: infinite whiteboard + structured research objects (notes, citations, diagrams, AI summaries, live data feeds).

The canvas is the product — not a document editor with a map view bolted on. Multiple people can work on the same board with presence, live cursors, and conflict-free editing. AI streams structured objects *onto* the canvas as first-class peers.

**License:** [Apache-2.0](./LICENSE)

## Status

**Slice 1 in progress** — design system landed; next is engine + offline canvas.

| Slice | Goal | Status |
|-------|------|--------|
| **1** | Solo infinite canvas + offline + a11y + sub-16 ms paint path | In progress |
| **2** | Realtime multiplayer (presence, Yjs CRDT, dual-channel sync) | Planned |
| **3** | AI-assisted objects streaming onto the canvas | Planned |

## Why this exists

Whiteboards usually fail accessibility and choke under large object counts. Research tools usually fail at spatial thinking. Collaboration layers often burn bandwidth on every cursor frame. This project treats those as first-class engineering problems:

- Spatial canvas that stays **keyboard-navigable** without collapsing into a pure form UI
- **Dual-channel sync**: cheap ephemeral presence vs durable CRDT content
- **Dual-surface render**: WebGL for scale, SVG/DOM for interaction and a11y
- One **design system** with focus vs research density modes
- **Multi-tenant isolation** from the first multiplayer milestone

## Monorepo layout

```
apps/
  web/                 React + TypeScript client (Vite)
  api/                 Node/TS BFF (Slice 2+)
packages/
  canvas-engine/       WebGL + SVG canvas engine
  design-system/       Tokens, density modes, components
  object-model/        Zod schemas + document ops (shared by all layers)
  sync-protocol/       CRDT/presence adapters (Yjs behind interface)
  offline/             Service worker + IndexedDB helpers
services/              Go microservices (presence, AI) — Slice 2–3
docs/adr/              Architecture decision records
```

Packages are structured so they can be **extracted into separate repos** later if independent versioning or deploy becomes necessary. We stay monorepo until that pays for itself.

## Quick start

**Requirements:** Node 20+, [pnpm](https://pnpm.io/) 9+

```bash
corepack enable
pnpm install
pnpm dev
```

App: [http://localhost:5173](http://localhost:5173)

```bash
pnpm typecheck   # all packages
pnpm test
pnpm build
pnpm lint
```

## Stack (targets)

| Layer | Choice |
|-------|--------|
| Web | React, TypeScript, Vite |
| Engine | Custom WebGL + SVG overlay |
| Styling | `@rkc/design-system` tokens + components; Tailwind + SASS in web |
| Local-first | IndexedDB, service workers, background sync |
| Collab (Slice 2) | WebSockets + Yjs (behind `sync-protocol` adapters) |
| API | Node/TypeScript BFF |
| Presence / AI | Go services |
| Isolation | Tenant-scoped rooms, short-lived WS tickets |

## Design principles

1. **Vertical slices** — each shippable demo is complete for its scope.
2. **Schema-first objects** — AI and UI share `object-model`; no freeform HTML on the canvas.
3. **A11y is Slice 1** — not polish after multiplayer.
4. **Paint budget as product** — performance fixtures and mid-range laptop targets.
5. **Calm + dense** — one system, two density modes (`focus` / `research`).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Architecture notes live under [`docs/`](./docs/).

## Roadmap snapshot

1. Engine spike + design tokens + object model  
2. Notes, selection, pan/zoom, local persistence  
3. Keyboard object graph + offline shell  
4. Multiplayer presence + CRDT content channel  
5. AI jobs that stream validated canvas events  

---

*Thinking tool, not just a document container.*
