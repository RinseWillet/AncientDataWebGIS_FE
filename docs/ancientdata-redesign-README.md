# AncientData redesign — handoff

Everything decided on the design canvas, turned into files you can drop into
`AncientDataWebGIS_FE`. Three looks share one set of rules:

| | Day (default) | Night (dark mode) | Hercules (F9) |
|---|---|---|---|
| Feel | sage, paper, calm | night blue, cream | 1986 phosphor green on black |
| Basemap | `basemap/ancientdata-day.json` | `…-night.json` | `…-hercules.json` + contours |
| DEM ramp | `dem-elevation-ramp` | `…-night` | `…-hercules` |
| Fonts | Archivo · Newsreader · IBM Plex Mono | same | VT323 |

**The rules that never change between looks**

- Roads by evidence: **solid** = excavated/observed · **dashed** = traced/reconstructed · **dotted** = hypothetical · thin dash-dot = historical record only.
- Sites: **shape = type, filled = certain, outline = uncertain.**
- Evidence is always said in words too: *attested* · *inferred* · *hypothetical* (never colour alone). Raw codes (`R`, `hist_rec`, `ER-150CE`) stay visible, small, next to the plain words.
- Basemap is flat: no hillshade. Terrain comes from your DEMs (Day/Night) or contours (Hercules).

---

## What's in the folder

```
theme/
  tokens.css            colours, fonts, sizes for day / night / hercules + evidence badges + CRT overlay
  useTheme.ts           Day follows the device until chosen; Night toggle; Hercules on F9; remembered
basemap/
  ancientdata-day.json  MapLibre styles (OpenFreeMap tiles) — test in Maputnik
  ancientdata-night.json
  ancientdata-hercules.json   needs a contours source (see hercules/contours-and-hatching.md)
dem/
  demColorRamp.ts       legend ramps for all three looks (replaces MapLegend/demColorRamp.ts)
  dem-elevation-ramp*.sld     GeoServer styles, same 8 stops; lightness rises with height
map/
  roadStyles.ts         Leaflet PathOptions per evidence type and look (casing + line, halo)
records/
  CitedText.tsx         long texts → paragraphs, references found automatically → margin notes / pop-ups
  sidenotes.css
  figures.ts            isGeotagged() → "Show on map" only when a figure has coordinates
hercules/
  TypeOut.tsx           typed-out text (skippable, once per session, respects reduced motion)
  ScanImage.tsx + scanImage.css   green image drawn line by line when it arrives
  useReducedMotion.ts
  contours-and-hatching.md        gdal_contour → vector tiles; forest hatch image
news/
  newsLoader.ts         news as Markdown files (like the book), newest 3 for Home
  example-content/      one real item converted + the draft "new look" item
```

Paths inside the `.ts` files assume these folders sit directly under `src/`
(`src/theme`, `src/records`, …). Move them wherever you like and fix the imports.

---

## Order of work

Each step leaves the site working, so you can ship in between.

### 1 · Foundations (½–1 day)
1. Add the Google Fonts link (top of `tokens.css`) to `index.html`; import `theme/tokens.css` in `main.tsx`.
2. Call `useTheme()` once in `App.tsx`; put the Night toggle in the header and Hercules under Menu ▸ View.
3. Replace hard-coded colours in your CSS with the variables (`--paper`, `--ink`, `--field`, `--rule`, `--red` …). Start with the page box, header, menu and buttons: the rest follows.
4. Header: slim bar (56 px desktop). Phone: no fixed header/footer on the Atlas — the map gets the whole screen.

*Done when:* Day and Night both look right on Home and the Atlas, and the choice survives a reload.

### 2 · The map (1–2 days)
1. Put the three basemap JSONs in `public/basemaps/`. In `layersConfig.ts`, make the vector base layer's `styleUrl` depend on the theme (`/basemaps/ancientdata-${theme}.json`) and rebuild that layer when the theme changes. Keep OSM/Satellite as alternatives.
2. Roads: draw each road twice (casing, then line) with `map/roadStyles.ts`; point `roadStyleEntries` at `roadLineStyle` so the legend stays in sync.
3. Sites: red on white, filled = certain, outline = uncertain (see open question A).
4. GeoServer: update `dem-elevation-ramp` in place with the new day SLD; add the night and hercules SLDs as new styles; send `styles: demStyleFor(theme)` with the WMS request. Swap in `dem/demColorRamp.ts` for the legend.

*Done when:* the Atlas matches the canvas boards "Atlas — new style" (Day and Night).

### 3 · Atlas interaction (2–3 days)
1. **Desktop: no clustering** — all 807 markers. **Phone: clustering** (Leaflet.markercluster or supercluster) to keep the Fairphone smooth.
2. **Tap picker:** on map click, collect every site/road within ~12 px of the click. One hit → open it; several → the small "N features here" card with name, type and evidence.
3. Layer panel as a short card opened from a slim rail (desktop) / a button (phone), legend inside it. Historical maps become the **Back in time** switch: Today · 1926–61 · 1801–1912 · 16th–18th c.
4. Near me (phone): GPS button → nearest records list, sorted by distance.

### 4 · Records (2–3 days)
1. **Panel beside the map** (desktop, 520 px) / bottom sheet (phone): evidence rows in words, the start of the Description, figures grouped, actions *Open full page · Zoom to route · Share · Suggest*. No Location text here — the map shows it.
2. **Full page (reading):** tabs Location / Description, `CitedText` for both, reading column 680 px at 21 px Newsreader, references in the margin; reading time = words ÷ 200.
3. **Figure viewer:** dark stage, caption and facts beside the image, arrow keys/swipe, strip with maps apart from photos. `isGeotagged()` decides if *Show on map* appears. Edit/Delete only for admins, inside ⋯.

### 5 · Pages (1–2 days)
1. **Home:** headline *Following the roads back in time*, eyebrow *Research atlas · Lower Rhine, Meuse & beyond*, the new subline; the Back-in-time strip; newest 3 news items.
2. **News:** move items from `News.tsx` to `src/content/news/*.md` (`news/newsLoader.ts`); month groups, tags, filter chips, lead item. RSS can be generated from the same list at build time.
3. **Data page:** Recharts `BarChart layout="vertical"`, sorted, one colour (`--ink`/sage) for sites; roads with their map line style next to the label; Table view + CSV download; keep "last updated".
4. **Suggest a change:** five numbered steps; pick the record by name (search) instead of ID; "What should change?" chips are written into the start of `summary` (e.g. `[Course] …`) so the API stays the same; opening it from a record fills steps 1–2.

### 6 · Hercules (2–3 days, the fun part)
1. `[data-theme='hercules']` is already in `tokens.css`: menu bar in inverse video, double-border windows (`.window`), scanlines + vignette via `.crt`.
2. Basemap + contours: follow `hercules/contours-and-hatching.md`.
3. Records: `TypeOut` for the first paragraph of Description; `ScanImage` for figures; evidence as `ATTESTED` (inverse), `<INFERRED>`, `?HYPOTHETICAL?` (done by CSS on `.ev--*`).
4. Keyboard hints in a status line (F1 Atlas · F2 Research · F3 Data · F9 Day · Esc back); optional one-second boot screen with the real counts, first switch-on only.
5. Test with *reduce motion* on: no typing, no scan, no blink — still green.

---

## Open questions (answer before the step that needs them)

- **A · Site certainty.** "Filled = certain" needs a field. Is there one (e.g. a certainty/evidence column), or should it come from the type itself (e.g. `pship` = possible shipwreck, the `?` in "(Prehistoric?) barrow")?
- **B · Figure kind.** Maps vs photographs: a `kind` column on media would be cleanest. `figures.ts` guesses from geotagging until then.
- **C · Date codes.** Make one lookup (`R` → Roman, `R?` → Roman?, `ER-150CE` → Early Roman, until 150 CE, …) so every page shows words plus the raw code.
- **D · Data page line** "[share] of the network is proven on the ground" — compute from `lengthKmByType` (road ÷ total).

## Checks before calling it done
- Fairphone 5: Atlas pans smoothly with clustering on; images lazy-load with thumbnails.
- Keyboard: every panel and the tap picker work without a mouse; focus is visible in all three looks.
- Contrast: body text ≥ 4.5 : 1 in Day and Night (the tokens are chosen for this).
- `prefers-reduced-motion`: nothing moves in Hercules.
- No flashing anywhere; the cursor blinks at 1 Hz.

Design reference: the Claude Design canvas "AncientData — UI redesign" (boards: Style guide,
Atlas, Home + headline, Basemap, DEM ramp, Phone round 3, Desktop round 2, Suggest & Data, News, Hercules).
