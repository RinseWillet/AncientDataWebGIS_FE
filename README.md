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

## ESLint Setup

This project uses ESLint v9 with flat config in `eslint.config.js`.

Legacy `.eslintrc.cjs` is no longer used by default in ESLint v9 and is kept only for reference.

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
npm run build
```
