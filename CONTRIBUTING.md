# Contributing

Thanks for your interest in Realtime Knowledge Canvas.

## Development

```bash
corepack enable
pnpm install
pnpm dev          # web app
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Use **Node 20+** and the repo’s pinned **pnpm** (`packageManager` in root `package.json`).

## Project conventions

- **TypeScript strict** everywhere; shared types live in `packages/object-model` and `packages/sync-protocol`.
- Prefer small, reviewable PRs that map to the slice roadmap (solo canvas → multiplayer → AI).
- Accessibility and paint budgets are product requirements, not optional polish.
- Do not introduce freeform HTML as canvas content; AI and tools must emit schema-validated objects.
- Design tokens live in `packages/design-system`; avoid one-off colors in app code.

## Commit and PR hygiene

- Describe *what* and *why*, not only *what files*.
- Include tests for object-model / engine utilities when behavior changes.
- Note a11y impact when changing focus, keyboard, or object chrome.

## License

By contributing, you agree that your contributions are licensed under the **Apache License 2.0**.
