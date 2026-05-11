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

## Phase 1 Pilot (Implemented)

- Added a minimal mixed-mode `tsconfig.json` with `allowJs: true` and `noEmit: true`.
- Added `src/vite-env.d.ts` for Vite environment typing.
- Updated ESLint and the `lint` script to include `.ts` and `.tsx` files while leaving the existing JS workflow intact.
- Migrated these low-risk shared modules first:
  - `src/features/authentication/authStorage.ts`
  - `src/features/authentication/authSelectors.ts`
  - `src/api/config.ts`
  - `src/components/Routes/PrivateRoute.tsx`
  - `src/components/Routes/AdminRoute.tsx`

## Next Recommended Slice

- Migrate additional low-coupling auth/api helpers and tests.
- Introduce shared app/store types only when enough TS usage exists to justify them.
- Revisit `src/utils/geometryUtils.js` and map-related modules in a later, isolated PR.

## Phase 2 Pilot (Implemented)

- Migrated auth service layer to TypeScript:
  - `src/services/authService.ts`
- Migrated auth Redux slice to TypeScript:
  - `src/features/authentication/authSlice.ts`
- Kept extensionless imports intact so JS and TS modules continue to interoperate during migration.
- Preserved existing auth runtime behavior and error fallbacks while adding lightweight types for thunks and auth state.

## Next Recommended Slice (Phase 3)

- Add typed Redux helpers (`RootState`, `AppDispatch`, typed hooks) with minimal app-wide churn.
- Migrate low-coupling service modules next (`RoadService`, `SiteService`, `ModernReferenceService`) before UI-heavy components.
- Keep Leaflet/geometry-editor modules deferred to a dedicated later phase.

## Phase 3 Pilot (Implemented)

- Migrated store setup to TypeScript:
  - `src/app/store.ts` (exports `store`, `RootState`, `AppDispatch`)
- Added typed Redux hooks:
  - `src/app/hooks.ts` (`useAppDispatch`, `useAppSelector`)
- Updated auth selectors to consume the centralized store `RootState` type:
  - `src/features/authentication/authSelectors.ts`
- Adopted typed selector hooks in migrated route wrappers:
  - `src/components/Routes/PrivateRoute.tsx`
  - `src/components/Routes/AdminRoute.tsx`
- Migrated one low-coupling service module to TypeScript:
  - `src/services/RoadService.ts`

## Next Recommended Slice (Phase 4)

- Migrate remaining low-coupling services (`SiteService`, `ModernReferenceService`) before touching larger UI slices.
- Introduce typed dispatch/selector hooks in additional TSX components as they are migrated.
- Keep map/geometry editor modules deferred to an isolated phase.

## Phase 4 Pilot (Implemented)

- Migrated remaining low-coupling service modules to TypeScript:
  - `src/services/SiteService.ts`
  - `src/services/ModernReferenceService.ts`
- All three services (`RoadService`, `SiteService`, `ModernReferenceService`) now typed and share a common pattern.
- Service layer TypeScript foundation is complete and ready for broader adoption.

## Next Recommended Slice (Phase 5)

- Migrate key thunk/Redux feature slices that depend on these services:
  - `src/features/site/siteThunks.js` (uses `SiteService`)
  - `src/features/road/roadThunks.js` (uses `RoadService`)
  - `src/features/modref/modRefThunks.js` (uses `ModernReferenceService`)
- Consider lightly typed Redux slices for consistency with Phase 2's `authSlice.ts`.
- Still defer map/geometry editor modules to an isolated phase.

## Phase 5 Pilot (Implemented)

- Migrated all Redux slice + thunk pairs to TypeScript:
  - `src/features/road/roadSlice.ts` + `src/features/road/roadThunks.ts`
  - `src/features/site/siteSlice.ts` + `src/features/site/siteThunks.ts`
  - `src/features/modref/modRefSlice.ts` + `src/features/modref/modRefThunks.ts`
- Introduced typed `PayloadAction` on all slice reducers.
- Typed thunk dispatch with `AppDispatch` from the centralized store.
- Shared `getErrorMessage` helper pattern consistent across all thunk files.
- Redux feature layer migration is now complete (all slices/thunks typed).

## Phase 6 Pilot (Implemented)

- Migrated utility geometry conversion helpers to TypeScript:
  - `src/utils/geometryUtils.ts`
- Preserved existing conversion behavior for supported formats (`Point` and `MultiLineString` in WKT parsing, full GeoJSON -> WKT switch cases).
- Kept this migration isolated from Leaflet and `GeometryEditor` UI logic to maintain low risk.

## Phase 7 Pilot (Implemented)

- Migrated low-coupling non-map pages/components to TypeScript:
  - `src/pages/About.tsx`
  - `src/pages/News.tsx`
  - `src/pages/NoPage.tsx`
  - `src/components/Footer/Footer.tsx`
  - `src/components/NavBarHook/NavbarHook.tsx`
- Preserved existing route/layout behavior while introducing typed Redux hooks usage in `NavbarHook`.
- Kept all map/Leaflet/geometry-editor components out of scope for this phase.

## Phase 8 Pilot (Implemented)

- Migrated app shell entry modules to TypeScript:
  - `src/App.tsx`
  - `src/main.tsx`
- Preserved route structure and provider wiring while moving the entry layer to TS.
- Added a root-element null guard in `main.tsx` for safer startup behavior.

## Phase 9 Pilot (Implemented)

- Added focused Vitest coverage for geometry utility conversion behavior:
  - `src/utils/geometryUtils.test.ts`
- Covered supported conversion paths and error handling for both directions:
  - `geoJSONtoWKT` (`Point`, `MultiLineString`, invalid geometry, unsupported type)
  - `wktToGeoJSON` (`POINT`, `MULTILINESTRING`, invalid input type, unsupported format)
- This test layer now protects utility behavior before a later Leaflet/geometry-editor migration phase.

## Next Recommended Slice (Phase 10)

- Migrate additional low-coupling non-map page modules where straightforward (`Home`, `DataList`, `News`-adjacent wrappers already partially covered).
- Consider adding typed data interfaces for road/site/modref payloads to reduce `unknown` usage incrementally.
- Keep Leaflet / leaflet-draw / `GeometryEditor` component deferred to a final, dedicated phase.

## Phase 10 Pilot (Implemented)

- Migrated all non-map pages to TypeScript:
  - `src/pages/Home.tsx`
  - `src/pages/AdminPanel.tsx`
  - `src/pages/LoginRegister.tsx`
  - `src/pages/DataList.tsx`
- All migrated pages now use `useAppDispatch` / `useAppSelector` typed hooks.
- `LoginRegister.tsx` adds typed form state (`FormData`) and typed event handlers.
- `DataList.tsx` adds typed column definitions (`ColumnDef<RowItem>`) and typed row click handler.
- Deferred: `src/pages/RoadInfo.jsx` and `src/pages/SiteInfo.jsx` — both embed `MapComponent` and are earmarked for the dedicated map-layer phase.

## Next Recommended Slice (Phase 11)

- Migrate `src/pages/RoadInfo.jsx` and `src/pages/SiteInfo.jsx` together with `src/components/MapComponent/` (Leaflet/geometry-editor integration) in one dedicated map phase.
- Consider introducing a shared DTO/types module (`src/types/`) to tighten `unknown` payload types across slices once map types are stabilised.
- Evaluate enabling `noImplicitAny` after the map phase is landed.

## Phase 11 Pilot (Implemented)

- Migrated entire map layer to TypeScript in one coordinated PR:
  - `src/components/MapComponent/Styles/markerStyles.ts` — typed `PathOptions`, icon factory helper
  - `src/components/GeometryEditor/GeometryEditor.tsx` — typed `leaflet-draw` event handlers
  - `src/components/ModernReferencePicker/ModernReferencePicker.tsx` — typed `ModernReference` interface
  - `src/components/MapComponent/MapInfoCard.tsx` — typed Redux selectors, GeoJSON feature shapes
  - `src/components/MapComponent/MapContent.tsx` — typed Leaflet `PathOptions`, `LeafletMouseEvent`, site/road click handlers, marker ref
  - `src/components/MapComponent/MapBuilder.tsx` — typed Redux hooks, typed `siteMarkersRef`
  - `src/components/MapComponent/MapComponent.tsx` — typed `L.Map` state, typed props
  - `src/pages/RoadInfo.tsx` — typed edit form, GeoJSON feature shapes, typed `ModernReference`
  - `src/pages/SiteInfo.tsx` — typed edit form, GeoJSON feature shapes, typed `ModernReference`
- Widened `geoJSONtoWKT` parameter type in `geometryUtils.ts` to accept `GeoJSON.Geometry`
  (which includes `GeometryCollection`) safely, preserving runtime behavior.
- `draw: undefined` instead of `draw: false` in `GeometryEditor` to satisfy `@types/leaflet-draw`.
- All `PropTypes` removed across migrated files — replaced by TypeScript interface props.
- All migrated map components use `useAppDispatch` / `useAppSelector` typed hooks.
- No runtime behavior changes.

## Migration Status: COMPLETE ✅

All source files in `src/` have been migrated from `.js`/`.jsx` to `.ts`/`.tsx`.

The only remaining `.jsx` file is the smoke test:
- `src/App.smoke.test.jsx` — can be migrated to `.tsx` as a future minor housekeeping task.

## Recommended Post-Migration Steps

1. Enable `"strict": true` in `tsconfig.json` incrementally:
   - Start with `"noImplicitAny": true` alone.
   - Then add `"strictNullChecks": true`.
   - Then full `"strict": true`.
2. Replace `unknown` payload types in Redux slices with proper DTO interfaces once backend contract is stable.
3. Add a `src/types/` shared module for GeoJSON feature/collection shapes reused across pages and components.
4. Consider migrating `src/App.smoke.test.jsx` to `.tsx` as a minor housekeeping step.

## Decision

Proceed with incremental migration, not a freeze-and-rewrite.

