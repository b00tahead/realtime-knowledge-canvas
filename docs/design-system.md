# Design system

Package: `@rkc/design-system`

One system, two density modes, dark/light themes. Tokens first — no one-off hex in app chrome.

## Install styles (once per app)

```ts
import "@rkc/design-system/tokens.css";
import "@rkc/design-system/components.css";
```

## Theme + density on the root

```tsx
import {
  densityClassName,
  themeClassName,
  type DensityMode,
  type ThemeMode,
} from "@rkc/design-system";

const density: DensityMode = "focus"; // or "research"
const theme: ThemeMode = "dark"; // or "light"

<div className={`${themeClassName(theme)} ${densityClassName(density)}`}>
  …
</div>
```

| Mode | Intent |
|------|--------|
| **focus** | Calm, spacious chrome for deep work |
| **research** | Compact panels, denser type, more metadata |

## Tokens

CSS variables under `--rkc-*`:

- **Color** — `bg`, `surface`, `border`, `text`, `accent`, semantic (`success` / `warning` / `danger`), note accents
- **Space** — `--rkc-space-1` … `--rkc-space-8` (remapped by density)
- **Type** — sizes, weights, sans/mono stacks
- **Radius, elevation, z-index, motion** — including reduced-motion zeros

Prefer `var(--rkc-color-accent)` (or Tailwind bridge colors) over raw hex.

## React primitives

| Component | Role |
|-----------|------|
| `Toolbar` | App chrome header |
| `Panel` | Side inspector |
| `Button` | primary / secondary / ghost / danger |
| `Select` | Labeled control |
| `Badge` | Status chips |
| `SkipLink` | Keyboard skip target |
| `LiveRegion` | Screen-reader announcements |
| `TokenSwatchGrid` | Gallery for density/theme QA |

Class names use the `rkc-` prefix so SASS modules and Tailwind can coexist.

## Tailwind

The web app maps Tailwind theme keys to the same CSS variables (see `apps/web/tailwind.config.ts`). Use utilities like `bg-rkc-surface` / `text-rkc-muted` for layout glue; use design-system components for interactive chrome.

## Storybook

Full Storybook is deferred until the component inventory stabilizes. Until then, the web app **inspector panel** shows live token swatches and reacts to theme/density toggles.
