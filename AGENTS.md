# AGENTS.md – AncientDataWebGIS Frontend (ADW-FE)

## Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes.

> Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

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

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Architecture Overview

React + Vite single-page app for the AncientData WebGIS project. It renders archaeological spatial data (sites, roads, modern references) on a Leaflet map and provides editing, dashboards, and a data-suggestion workflow against the Spring Boot backend.

- **Stack:** React 18, Vite 6, TypeScript, Redux Toolkit + React Redux, React Router, Leaflet / React-Leaflet (+ leaflet-draw), Recharts, Axios.
- **Entry:** `src/main.tsx` mounts `App.tsx`; routing lives in `src/components/Routes`.
- **State:** Redux store in `src/app/store.ts`; typed hooks in `src/app/hooks.ts`. Feature state (slices + thunks) under `src/features/<domain>` (`site`, `road`, `modref`, `authentication`).
- **API access:** Centralised Axios client in `src/api/config.ts`; per-domain wrappers in `src/services/*Service.ts`.
- **Domain UI:** Reusable components under `src/components` (e.g. `MapComponent`, `GeometryEditor`, `ModernReferencePicker`, `NavBarHook`); page-level views under `src/pages`.
- **Types:** Shared TypeScript types under `src/types`; geometry helpers under `src/utils`.

## Hard Rules for Agents

- Never call `axios` or `fetch()` directly from components or features. Always use the shared `apiClient` from `src/api/config.ts` via a service in `src/services/`.
- Never hard-code the API base URL. It is resolved from `VITE_API_BASE_URL` in `src/api/config.ts` (dev default `http://localhost:8080/api`, otherwise `/api`).
- Auth tokens are read/written through `src/features/authentication/authStorage.ts` and attached automatically by the Axios request interceptor — never set the `Authorization` header manually or read the token from raw storage strings.
- Component/feature data flow: components dispatch thunks (`src/features/<domain>/*Thunks.ts`) which call services; do not put network calls inside reducers/slices.
- TypeScript is the standard for new code (`.ts`/`.tsx`). Do not introduce new `.js`/`.jsx` source files. Use the typed Redux hooks from `src/app/hooks.ts`, not the raw `useDispatch`/`useSelector`.
- Lint must pass with zero warnings (`--max-warnings 0`). Do not disable rules inline to silence warnings without calling it out.
- Match formatting enforced by Prettier (`.prettierrc.json` / `.editorconfig`); never reformat unrelated files.
- All documentation, comments, and agent-generated text must be written in English.
- Skill file naming: new skill files must be named `STEAM_SKILL_{topic}.md` (e.g. `STEAM_SKILL_create-pr.md`). This prefix enables quick discovery via the `#` file picker across the whole workspace.

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

## Standard Request Template

```markdown
Goal:
- <one concrete frontend outcome>

Scope (allowed files):
- <file path 1>
- <file path 2>

Constraints:
- Keep changes surgical; no unrelated formatting/refactors.
- Follow existing ESLint/Prettier rules.

Success criteria:
- <observable UI behavior or test outcome>

Verify:
- npm run test:run -- <targeted test path if applicable>
- npm run lint
- npm run build

Non-goals:
- <explicitly list what should not be changed>
```

## Definition of Done

- UI/behavior change is testable and validated.
- Diff only touches files needed for the requested outcome.
- Lint, tests, and build pass after changes.
- Any API contract assumptions are documented in the task/PR note.

## API Integration Change Mode

When a change affects the backend contract, include all four items in the response:

1. Frontend contract delta (request params, response parsing, UI state updates).
2. Backend dependency note (which endpoint/schema expectation changed).
3. Compatibility note (fallbacks/migration handling if needed).
4. Verification list (tests plus one manual UI flow).

## Related Repositories

This repo is part of the AncientData WebGIS project. Sibling repos are checked out next to this one as shown below.

| Repo | Code | Purpose | Local path |
|------|------|---------|------------|
| AncientDataWebGIS | ADW | Spring Boot backend (REST API, PostGIS, JWT) | `../AncientDataWebGIS` |
| AncientDataWebGIS_FE | ADW-FE | React + Vite frontend (this repo) | `../AncientDataWebGIS_FE` |
| ancientdataworkspace | — | Cross-repo workspace root, shared agent rules and workflows | `../ancientdataworkspace` |

## Cross-Repo Work

Some changes span both backend (ADW) and frontend (ADW-FE).

- Be explicit when a change affects both API contracts.
- Validate each impacted repo independently before declaring done.
- Keep changes scoped; avoid opportunistic cross-repo refactors.

Sibling verification:

- Backend: `cd ../AncientDataWebGIS && ./gradlew test`
- Frontend: `cd ../AncientDataWebGIS_FE && npm run test:run && npm run lint && npm run build`

## Source of Truth

This file is the single source of agent guidance for this repo and supersedes any earlier `CLAUDE.md` / `CODEX.md` / workspace rule files. `.github/copilot-instructions.md` simply points here. Review and adjust these rules after major model updates or at least monthly.

