# Hercules map: contours and forest hatching

The Hercules basemap (`basemap/ancientdata-hercules.json`) shows terrain only as contour lines
made from your own DEMs, and hatches forests. Two small jobs.

## 1. Contours from the DEMs

**Option A — pre-made (recommended: fast on phones, you control the look)**

```bash
# per DEM (or on a merged VRT); 2.5 m interval, attribute "elev"
gdalbuildvrt dem_all.vrt dem_gelderland_nrw.tif dem_swalmen.tif dem_venlo_geldern.tif dem_mgladbach.tif
gdal_contour -a elev -i 2.5 -f GPKG dem_all.vrt contours.gpkg
# optional: smooth + drop tiny rings in QGIS (Vector ▸ Geometry ▸ Smooth; filter $length > 150)
```

Serve them as vector tiles with source-layer name `contour`, then replace
`__CONTOURS_TILE_URL__` in the style. Two easy ways:

- **PMTiles** (one static file, no server work):
  `ogr2ogr -f GeoJSON contours.geojson contours.gpkg`
  `tippecanoe -o contours.pmtiles -l contour -Z9 -z14 --drop-densest-as-needed contours.geojson`
  Put the file next to the app, add the `pmtiles` protocol (`npm i pmtiles`, then
  `maplibregl.addProtocol('pmtiles', new Protocol().tile)`) and use
  `"url": "pmtiles:///basemaps/contours.pmtiles"` instead of `"tiles"`.
- **GeoServer** (you already run it): publish `contours.gpkg`, enable the vector tiles
  extension, and point `"tiles"` at the GWC TMS/XYZ endpoint for `application/vnd.mapbox-vector-tile`.

The style draws a line every 10 m a bit stronger (`contour-major`) and the in-between ones faint
from zoom 11 (`contour-minor`); change the `10` in the filters if you prefer another step.

**Option B — live** with [`maplibre-contour`](https://github.com/onthegomap/maplibre-contour):
needs your DEMs as Terrain-RGB tiles; contours are computed in the browser. Nice, but heavier on a Fairphone.

## 2. Forest hatching

The `landcover-wood` layer uses `"fill-pattern": "hatch"`. Add that image at runtime, so no custom sprite is needed:

```ts
// after the maplibre layer is created (maplibre-gl-leaflet):
const map = glLayer.getMaplibreMap();
map.on('styleimagemissing', (e) => {
  if (e.id !== 'hatch') return;
  const s = 10, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#2C9A4C'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, s); g.lineTo(s, 0); g.stroke();       // 45° line
  g.beginPath(); g.moveTo(-s/2, s/2); g.lineTo(s/2, -s/2); g.moveTo(s/2, s*1.5); g.lineTo(s*1.5, s/2); g.stroke(); // seamless edges
  map.addImage('hatch', g.getImageData(0, 0, s, s));
});
```

## 3. Labels

The style uses OpenFreeMap's Noto Sans glyphs (VT323 isn't available as map glyphs).
Map labels in VT323 are possible later by converting the font to glyph PBFs
(e.g. with `font-maker` / `build_pbf_glyphs`) and hosting them yourself. Low priority.
