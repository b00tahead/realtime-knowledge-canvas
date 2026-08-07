# Roadmap

## Slice 1 — Solo infinite canvas

- [x] Monorepo scaffold (pnpm, turbo, CI, Apache-2.0)
- [x] Design system tokens + focus/research density
- [x] Object model package (Zod schemas, factories, reading order)
- [x] Canvas engine spike (WebGL + SVG, pan/zoom, paint logging)
- [x] Local persistence (IndexedDB + autosave)
- [x] Note tool + selection
- [ ] Keyboard + a11y navigation
- [ ] Offline shell (service worker)
- [ ] Perf fixtures (1k / 5k objects)

## Slice 2 — Realtime multiplayer

- [ ] Auth + tenant + canvas metadata API
- [ ] Presence service (Go)
- [ ] Yjs durable channel behind `sync-protocol`
- [ ] Live cursors + awareness (ephemeral channel)
- [ ] Roles: owner / editor / viewer
- [ ] Reconnect + offline merge with multiplayer

## Slice 3 — AI on canvas

- [ ] AI job API + Go orchestrator
- [ ] Streaming object events onto the canvas
- [ ] Citation + summary object types
- [ ] Quotas, audit, eval hooks
