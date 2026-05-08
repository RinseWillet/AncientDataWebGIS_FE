# TypeScript Migration Evaluation

## Current State

- Frontend is JavaScript-based with React + Vite.
- ESLint is active and currently stable.
- Test baseline now exists via Vitest + React Testing Library.
- Build and lint are currently green.

## Risks of Full Immediate Migration

- High churn across many files with mixed concerns (map stack, Redux, routing).
- Large review/merge burden and higher regression risk.
- Non-trivial typing effort around Leaflet + leaflet-draw integrations.

## Recommended Strategy: Incremental (New Files First)

1. Keep current JS code working and stable.
2. Allow new utility modules to be written in `.ts`/`.tsx` first.
3. Migrate by feature slice over time (auth -> api -> map-related modules).
4. Add strictness gradually (`noImplicitAny`, then stricter options later).

This approach minimizes delivery risk while steadily reducing technical debt.

## Suggested Pilot Scope

- Start with a low-coupling utility/helper module in `src/utils`.
- Next, migrate auth selectors/storage where types are straightforward.
- Defer map-heavy modules until type boundaries are established.

## Initial Tooling Plan (When Ready)

- Add `typescript` and `@types/*` as needed.
- Add a minimal `tsconfig.json` with `allowJs: true` for coexistence.
- Keep Vite/React setup unchanged initially.
- Maintain existing lint/test/build gates during migration.

## Decision

Proceed with incremental migration, not a freeze-and-rewrite.

