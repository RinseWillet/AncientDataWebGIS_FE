# AncientDataWebGIS Frontend

React + Vite frontend for the AncientDataWebGIS project.

## Requirements

- Node.js 18+
- npm 9+

## Install

```bash
npm install
```

## Scripts

- `npm run dev` - start local development server
- `npm run build` - create production build in `dist/`
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint checks
- `npm run format` - format files with Prettier
- `npm run format:check` - verify formatting without writing changes
- `npm run test` - run Vitest in watch mode
- `npm run test:run` - run Vitest once (CI-friendly)

## ESLint Setup

This project uses ESLint v9 with flat config in `eslint.config.js`.

Legacy `.eslintrc.cjs` is no longer used by default in ESLint v9 and is kept only for reference.

## Formatting

Formatting standards are defined by:

- `.editorconfig`
- `.prettierrc.json`
- `.prettierignore`

Use `npm run format` to apply formatting and `npm run format:check` for validation.

## Testing

Vitest + React Testing Library are configured for a lightweight smoke-test baseline.

Key files:

- `vite.config.js` (`test` section)
- `src/test/setupTests.js`
- `src/App.smoke.test.jsx`

## Environment Configuration

The API client reads `VITE_API_BASE_URL` from Vite env vars.

- If `VITE_API_BASE_URL` is set, it is used.
- If not set and running in dev mode, default is `http://localhost:8080/api`.
- In non-dev mode, default is `/api`.

Example `.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

## Quick Verification

```bash
npm run lint
npm run test:run
npm run build
```

## TypeScript Migration Note

See `docs/typescript-migration-evaluation.md` for the incremental migration recommendation.

