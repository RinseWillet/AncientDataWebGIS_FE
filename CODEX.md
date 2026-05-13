# CODEX.md

Use this file for Codex-style agents working in the frontend repo.

## Base policy

- Follow `../ancientdataworkspace/AGENT-RULES.md`.
- Keep repo behavior aligned with `CLAUDE.md` in this directory.

## Frontend context

- Stack: React 18, Vite, TypeScript, Redux Toolkit.
- Main code: `src/`.
- Tests: Vitest + React Testing Library.

## Verification commands

```bash
npm run test:run
npm run lint
npm run build
```

## Agent-specific behavior notes

- Avoid formatting or refactoring unrelated files.
- Keep component and hook changes minimal and task-focused.
- Call out backend/API dependency assumptions in task output.
