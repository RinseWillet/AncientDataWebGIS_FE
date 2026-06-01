# AGENTS.md – AncientDataWebGIS Frontend (ADW-FE)

## Behavioral Guidelines

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
- Don't infer behavior from names. Always read the implementation of a function before making claims about what it does.
- Never take action without explicit user confirmation. Always present your plan or intention and wait for approval before executing.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

> Bias toward caution over speed. For trivial tasks, use judgment.

- **Surgical changes.** Only touch what the request requires. Match existing style. Don't improve adjacent code, comments, or formatting. Mention unrelated dead code — don't delete it.
- **Clean up your own mess.** Remove imports/variables/functions YOUR changes made unused. Don't remove pre-existing dead code.
- **Goal-driven.** Turn tasks into verifiable goals. For multi-step work, state a brief plan with verification steps. Keep lint/tests/build green.

## Architecture Overview

React + Vite SPA rendering archaeological spatial data on a Leaflet map with editing, dashboards, and a data-suggestion workflow against the Spring Boot backend.

- **Stack:** React 18, Vite 6, TypeScript, Redux Toolkit, React Router, Leaflet / React-Leaflet (+ leaflet-draw), Recharts, Axios.
- **Entry:** `src/main.tsx` → `App.tsx`; routing in `src/components/Routes`.
- **State:** Redux store `src/app/store.ts`; typed hooks `src/app/hooks.ts`. Slices + thunks under `src/features/<domain>` (`site`, `road`, `modref`, `authentication`).
- **API:** Centralised Axios client `src/api/config.ts`; per-domain wrappers in `src/services/*Service.ts`.
- **UI:** Reusable components under `src/components`; page-level views under `src/pages`.
- **Types:** `src/types`; geometry helpers `src/utils`.

## Hard Rules

- Never call `axios`/`fetch()` directly. Use `apiClient` from `src/api/config.ts` via `src/services/`.
- Never hard-code the API base URL — resolved from `VITE_API_BASE_URL` in `src/api/config.ts`.
- Auth tokens: read/write through `src/features/authentication/authStorage.ts` only. The Axios interceptor attaches them — never set `Authorization` manually.
- Data flow: components → thunks (`src/features/<domain>/*Thunks.ts`) → services. No network calls in reducers/slices.
- TypeScript only (`.ts`/`.tsx`). No new `.js`/`.jsx` files. Use typed hooks from `src/app/hooks.ts`, not raw `useDispatch`/`useSelector`.
- Lint must pass with `--max-warnings 0`. Don't disable rules inline without flagging it.
- Match Prettier formatting (`.prettierrc.json` / `.editorconfig`); never reformat unrelated files.
- All text (docs, comments, agent output) in English.

## Quick Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Unit tests (watch) | `npm run test` |
| Unit tests (CI) | `npm run test:run` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Format check | `npm run format:check` |
| Full verify gate | `npm run test:run && npm run lint && npm run build` |

## Definition of Done

- UI/behavior change is testable and validated.
- Diff only touches files needed for the goal.
- Lint, tests, and build pass.
- API contract assumptions documented in task/PR note.

## Planning & ADRs

- **Always plan** epics (E-level) before coding. **Recommended** for M/L stories spanning both repos or new API contracts. **Skip** for trivial fixes.
- Create a new ADR (`../AncientDataWebGIS/docs/architecture/adr/`, use `ADR-TEMPLATE.md`) when introducing new tech/libraries, changing state management/CI-CD/auth patterns, or establishing new architectural conventions.

## Documentation Pointers

| Document | Location |
|----------|----------|
| ADR index | `../AncientDataWebGIS/docs/architecture/adr/README.md` |
| Feature backlog | `../AncientDataWebGIS/docs/features/FEATURE-SPEC-BACKLOG.md` |
| Feature specs | `../AncientDataWebGIS/docs/features/README.md` |
| TypeScript migration | `docs/typescript-migration-evaluation.md` |

## API Integration Change Mode

When a change affects the backend contract, include:

1. Frontend contract delta (request params, response parsing, UI state updates).
2. Backend dependency note (which endpoint/schema expectation changed).
3. Compatibility note (fallbacks/migration handling if needed).
4. Verification list (tests + one manual UI flow).

## Cross-Repo Work

| Repo | Code | Local path |
|------|------|------------|
| AncientDataWebGIS | ADW | `../AncientDataWebGIS` |
| AncientDataWebGIS_FE | ADW-FE | `../AncientDataWebGIS_FE` (this repo) |
| ancientdataworkspace | — | `../ancientdataworkspace` |

- Be explicit when a change affects both API contracts.
- Validate each repo independently before declaring done.
- Backend: `cd ../AncientDataWebGIS && ./gradlew test`
- Frontend: `cd ../AncientDataWebGIS_FE && npm run test:run && npm run lint && npm run build`

## Source of Truth

This file is the single source of agent guidance for this repo and supersedes any earlier `CLAUDE.md` / `CODEX.md` / workspace rule files. `.github/copilot-instructions.md` simply points here.
