# ADR 0004: Token-first design system with density modes

## Status

Accepted

## Context

The product needs both a **calm focus** aesthetic and **dense research tooling** without forking styles or restyling constantly. Accessibility requires shared focus rings, reduced motion, and contrast-aware tokens.

## Decision

1. Ship a single `@rkc/design-system` package with **CSS custom properties** as the source of truth.
2. Express density (`focus` / `research`) and theme (`dark` / `light`) as **root CSS classes** that remap tokens.
3. Provide **class-prefixed primitives** (`.rkc-button`, …) plus thin React wrappers.
4. Bridge **Tailwind** to the same variables in the web app for layout utilities.
5. Defer Storybook until more components exist; use an in-app token gallery for QA.

## Consequences

- App code should not invent hex colors for chrome.
- Density changes affect spacing, type, toolbar height, and panel width globally.
- Canvas engine may consume note color tokens later for object paints.
