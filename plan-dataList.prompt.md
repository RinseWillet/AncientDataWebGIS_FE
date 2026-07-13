# Plan: Fix DataList height in desktop mode

**Issue:** DataList does not use the full height of the page in desktop mode.

**Root Cause:** `.pagebox` has `overflow: auto` which allows scrolling and prevents proper flex height constraints. Without explicit height and overflow control at desktop breakpoints, the pagebox will shrink to content size rather than filling the grid cell.

## Solution Steps

1. Add a `@media screen and (min-width: 1200px)` rule to `src/pages/DataList.css` that:
   - Sets `.pagebox` to `overflow: hidden` (prevents outer scroll at pagebox level)
   - Explicitly sets `.pagebox { height: 100% }` to fill its grid cell in `.App` (grid row `1fr`)

2. Ensure `.table-container` class maintains:
   - `flex: 1` (grows to fill available space)
   - `min-height: 0` (allows flex children to shrink below content size)
   - `display: flex` with `flex-direction: column`
   - This allows internal scrolling of table rows only

3. Verify `.typeSwitch` stays `flex-shrink: 0` (already set) so it remains fixed height at top.

4. Confirm `.react-table` tbody scrolls internally when content exceeds `.table-container` height.

5. Pagination (`.pagination`) with `margin-top: 1rem; margin-bottom: 1rem` remains visible at bottom of `.table-container`.

## Implementation Details

**File to modify:** `/home/r-willet/IdeaProjects/AncientDataWebGIS_FE/src/pages/DataList.css`

**New media query to add:**
```css
@media screen and (min-width: 1200px) {
  .pagebox {
    overflow: hidden;
    height: 100%;
  }
}
```

## Layout Hierarchy (Desktop)

```
.App (grid: auto 1fr auto rows)
  ↓
.pagebox (1fr grid row) → height: 100%, overflow: hidden
  ├─ .typeSwitch (flex-shrink: 0) → fixed height
  └─ .table-container (flex: 1, min-height: 0) → grows, scrolls internally
      ├─ status messages (if loading/error)
      ├─ .react-table (width: 100%)
      └─ .pagination (margin-top: 1rem) → stays visible
```

## Desktop vs. Mobile Behavior

- **Desktop (≥ 1200px):** Pagebox fills viewport, no outer scroll. Only table rows scroll internally.
- **Mobile/Tablet (< 1200px):** Pagebox keeps `overflow: auto` to allow full page scroll. Content stacks vertically.

## Verification

1. Desktop (≥ 1200px): Open DataList page, confirm:
   - Table fills available space between type switch and pagination
   - Type switch and pagination do not scroll out of view
   - Only table rows scroll if content exceeds container height

3. Mobile (< 1200px): Confirm existing scroll behavior unchanged.

3. Run linter: `npm run lint` — must pass with `--max-warnings 0`.

4. Run tests: `npm run test:run` — must pass.

## Notes

- This change mirrors the Dashboard desktop layout pattern (see `Dashboard.css` lines 253–300).
- The `1200px` breakpoint aligns with the content-max-width and large desktop conventions.
- No TypeScript/component changes needed—CSS only.

Finally: ensure that the changes do not break other features/layout of the application (atlas map for example). The behaviour and layout of Site-/RoadInfo, Home, News, About, Dashboard, and To the Map should not be altered.
