# Plan: E10 — Site & Road Type Registry Consolidation

## Context
Site and road type label/icon/style definitions are scattered across the frontend, so adding, renaming, or restyling a type (e.g. a new "watermill" site type) currently means editing 3-5 files by hand and keeping their keys in sync. This was raised during E9-5 smoke testing, which already did the equivalent consolidation for road styles (`roadStyleEntries`/`roadStyleDifferentiator` in `utils/roadTypes.ts`). Full backlog entry: `E10` in `../AncientDataWebGIS/docs/features/FEATURE-SPEC-BACKLOG.md` (stories `E10-1`, `E10-2`, `E10-3`). Dependency `E9-5` is done, so there are no blockers to starting.

## Current State

**Site types** — split across 5 files, all keyed by the same `siteType` string (e.g. `castellum`, `pos_castellum`, `tum`, `ptum`, ...):
- `src/utils/siteTypes.ts` — `siteTypeLabels` (label text) + `siteTypeConverter` helper
- `src/components/MapComponent/siteIcons.ts` — `siteIconMap` (Leaflet `Icon`/`DivIcon` instances) + `getSiteIcon` helper
- `src/components/MapComponent/Styles/markerStyles.ts` — raw `Icon` constructors, plus `siteTypeIconUrls` (plain image URLs for `<img>` contexts)
- `src/pages/Dashboard.tsx` — its own `LABEL_MAPPING` constant, duplicating `siteTypeLabels` with different wording for chart labels
- Consumers: `MapContent.tsx:143` (`getSiteIcon`), `MapInfoCard.tsx:120` (`siteTypeLabels`), `SiteInfo.tsx:173` (`siteTypeConverter`), `MapLegend.tsx:84-87` (`siteTypeIconUrls` + `siteTypeLabels`)

**Known bug to fix, not just refactor:** `siteIconMap` and `siteTypeIconUrls` both map `ptum` ("possible barrow") to `tumulusIcon`/`tumulus.png` instead of the already-built-but-unused `possibleTumulusIcon`/`ptumulus.png` (`markerStyles.ts`). So possible-tumulus sites currently render with the confirmed-tumulus marker on the map and in the legend. Every other confirmed/possible pair (`castellum`/`pos_castellum`, `villa`/`pvilla`, `ship`/`pship`) already has a distinct icon — only tumulus regressed. Labels are already correct (`siteTypeLabels` and `Dashboard.tsx` both distinguish `tum`/`ptum`), so this is an icon-wiring fix only.

**Road types** — already mostly consolidated in E9-5:
- `src/utils/roadTypes.ts` — `roadStyleEntries: RoadStyleEntry[]` (`{ type, label, style }`) + `roadStyleDifferentiator` helper, consumed by both `MapContent` and `MapLegend`
- Remaining loose end: `notShowRoad` (fully transparent fallback style, in `markerStyles.ts`) is deliberately excluded from `roadStyleEntries` — confirm this is still the right call, or fold it in with an explicit "unrecognized" entry if that reads more consistently once site types have the same shape.

## Proposed Approach

Model the new site type registry after the `layersConfig.ts` pattern from E9-3 and the existing `roadStyleEntries` shape: one typed array/record as the single source of truth, with all call sites refactored to derive from it.

### Solution Steps

1. **E10-1 — Site type registry**
   - Create `src/utils/siteTypesConfig.ts` (or co-locate near `roadTypes.ts` for symmetry) exporting one typed structure, e.g.:
     ```ts
     export interface SiteTypeEntry {
       type: string;
       label: string;
       icon: Icon | DivIcon;
       iconUrl: string; // for <img> contexts (MapLegend)
     }
     export const siteTypeEntries: SiteTypeEntry[] = [ /* one row per site type */ ];
     ```
   - Fix the `ptum` entry to use `possibleTumulusIcon`/`ptumulus.png` instead of reusing the tumulus assets.
   - Provide equivalent helpers to the ones being replaced (`siteTypeConverter`, `getSiteIcon`) so call sites change imports, not call shape, where possible.
   - Update consumers: `MapContent.tsx:143`, `MapInfoCard.tsx:120`, `SiteInfo.tsx:173`, `MapLegend.tsx:84-87`.
   - Update `Dashboard.tsx`'s `LABEL_MAPPING` usage to pull labels from the new registry instead of maintaining its own copy (`Dashboard` only needs label text, not icons).
   - Delete the old `siteTypeLabels`, `siteIconMap`, `siteTypeIconUrls` maps once nothing references them.

2. **E10-2 — Road type registry**
   - Confirm `roadStyleEntries`/`roadStyleDifferentiator` (`utils/roadTypes.ts`) already satisfies the "single file to add a road type" bar.
   - Decide on the `notShowRoad` fallback question above and extend if needed.
   - This should be a small confirm-and-polish pass, not new structure — E9-5 already did the heavy lifting.

3. **E10-3 — Document the workflow**
   - Add a short comment block at the top of `siteTypesConfig.ts` (and `roadTypes.ts` if not already present) explaining how to add/rename/restyle a type.
   - Add a corresponding section to `AGENTS.md` (currently has no section on this topic) pointing at both config files as the sole place to touch.

## Verification

1. `npm run build` / `tsc` — no leftover imports of the deleted `siteTypeLabels`/`siteIconMap`/`siteTypeIconUrls`/`Dashboard.LABEL_MAPPING`.
2. Run/update existing tests that touch these call sites: `MapContent.test.tsx`, `MapLegend.test.tsx`, plus any `SiteInfo`/`MapInfoCard`/`Dashboard` tests — add a regression test asserting `ptum` resolves to a different icon than `tum`.
3. Manual smoke test in the Atlas: confirm a possible-tumulus site now shows a visually distinct marker from a confirmed tumulus, both on the map and in `MapLegend`.
4. Confirm adding a hypothetical new site type (e.g. temporarily add "watermill") only requires touching `siteTypesConfig.ts` — this is the acceptance bar from the backlog.
