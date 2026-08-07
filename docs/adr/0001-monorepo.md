# ADR 0001: Monorepo first, extract later

## Status

Accepted

## Context

The product spans a React client, a custom canvas engine, shared schemas, offline helpers, a Node BFF, and (later) Go services for presence and AI. Multi-repo from day one multiplies CI, versioning, and contribution friction for a young open-source project.

## Decision

Use a **pnpm + Turborepo monorepo** with clear package boundaries:

- `apps/*` — deployable applications
- `packages/*` — libraries with stable public surfaces
- `services/*` — language-specific microservices (Go), added when Slice 2–3 starts

Extract a package into its own repository only when there is a **second consumer** or **independent release/deploy pressure**.

## Consequences

- Fast shared-type iteration for Slice 1.
- Extraction path is documented in the root README.
- Contributors clone one repo to run the full local story for Slice 1.
