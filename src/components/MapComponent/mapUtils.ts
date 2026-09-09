import L from 'leaflet';
import { setWorkerUrl } from 'maplibre-gl';
// A literal `?url` import so Vite/Rollup can statically trace and copy the worker
// file into the production build - maplibre-gl computes its own worker URL from
// import.meta.url at runtime, which Rollup can't detect, so without this the
// worker script is silently missing from `dist/assets/` in production.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { LayerConfig } from './layersConfig';
import { apiBaseUrl } from '../../api/config';
import { RasterBounds } from '../../types/raster';

setWorkerUrl(maplibreWorkerUrl);

/** Builds a Leaflet tile/vector/WMS layer instance from a `layersConfig` entry. */
export const buildLayer = (config: LayerConfig): L.Layer => {
  if (config.kind === 'tile') return L.tileLayer(config.url, { attribution: config.attribution });
  if (config.kind === 'vector') {
    // The plugin always disables MapLibre GL's own on-canvas attribution
    // control and instead surfaces `customAttribution` through Leaflet's -
    // OpenFreeMap's style sources carry no attribution metadata of their
    // own, so without this the map would show no attribution at all.
    return maplibreGL({
      style: config.styleUrl,
      attributionControl: { customAttribution: config.attribution },
    });
  }
  return L.tileLayer.wms(config.url, {
    layers: config.layers,
    format: 'image/png',
    transparent: true,
  });
};

/**
 * Builds a Leaflet WMS layer for a raster catalog entry (`source` is a
 * GeoServer "workspace:layer" id), requested through the backend's read-only
 * `/api/raster/<workspace>/wms` proxy (see ADR-012).
 *
 * @param source a raster catalog entry's "workspace:layer" id
 * @param opacity initial layer opacity, forwarded to the WMS `opacity` param
 * @param isHillshade a multidirectional-hillshade sibling of a DEM layer (E3-5)
 *   - rendered with a multiply CSS blend so it darkens/textures whatever's
 *   beneath it (its elevation counterpart's colour ramp) instead of drawing as
 *   an independent, opaque tile. Requires the hillshade to be listed/ordered
 *   above its elevation sibling (see `RasterCatalogService`'s catalog order).
 */
export const buildPhysicalLayer = (
  source: string,
  opacity: number,
  isHillshade = false
): L.TileLayer.WMS => {
  const workspace = source.split(':')[0];
  return L.tileLayer.wms(`${apiBaseUrl}/raster/${workspace}/wms`, {
    layers: source,
    format: 'image/png',
    transparent: true,
    opacity,
    // GeoServer's GWC "Explicitly require TILED Parameter" setting means a GetMap request
    // only gets checked against the tile cache when it carries tiled=true - without this,
    // every request bypasses GWC entirely and re-renders from the source COG on every pan/
    // zoom, which is exactly the RAM/CPU load ADR-012's caching strategy exists to avoid.
    tiled: true,
    className: isHillshade ? 'physical-layer--hillshade' : undefined,
  } as L.WMSOptions);
};

export interface ZoomPadding {
  bottomRight: [number, number];
  topLeft: [number, number];
}

/**
 * Compute responsive fitBounds padding so the selected feature is not hidden
 * behind the info card. The layout differs by viewport width:
 *  - wide (> 800px):   info card on the right, reserve 400px there.
 *  - medium (> 600px): info card on the right, reserve 150px there.
 *  - mobile:           info card as a bottom sheet (~50vh), reserve bottom space.
 */
export const computeZoomPadding = (mapWidth: number): ZoomPadding => {
  if (mapWidth > 800) return { bottomRight: [400, 10], topLeft: [0, 10] };
  if (mapWidth > 600) return { bottomRight: [150, 5], topLeft: [0, 5] };
  return { bottomRight: [10, 250], topLeft: [10, 10] };
};

/**
 * Whether a raster catalog entry's WGS84 bounds overlap the map's current
 * visible viewport (simple axis-aligned rectangle intersection - the research
 * area doesn't cross the antimeridian, so no wraparound handling is needed).
 * Used to gate Physical-layer selectability by viewport (E3-7).
 */
export const boundsIntersectViewport = (bounds: RasterBounds, viewport: L.LatLngBounds): boolean =>
  bounds.west <= viewport.getEast() &&
  bounds.east >= viewport.getWest() &&
  bounds.south <= viewport.getNorth() &&
  bounds.north >= viewport.getSouth();

/**
 * Percentage (0-100) of `viewport`'s area covered by the intersection of `bounds` and
 * `viewport` - same simple, un-projected degree-box math as `boundsIntersectViewport` above
 * (no latitude/cos-correction: the research area doesn't cross the antimeridian, and a "more
 * correct" projected-area calculation here would be inconsistent with the rest of this file's
 * intentionally approximate area handling). Used to gate Historical Maps sheet selectability
 * by how much of the currently-visible map a sheet would actually cover, replacing a per-sheet
 * zoom floor that didn't scale across wildly different sheet sizes.
 *
 * Returns 0 for no overlap (including edge-touching, i.e. zero-width/height intersection -
 * unlike `boundsIntersectViewport`, a literal edge touch contributes 0% area, which is
 * mathematically correct for a percentage even though it counts as "intersecting" there).
 *
 * If `viewport` itself has zero area (a real map always has a non-zero container size, but a
 * jsdom-mounted one in tests reports 0x0, degenerating `map.getBounds()`/
 * `effectiveViewportBounds` to a single point), there's no meaningful percentage of a
 * zero-area region - falls back to plain point-containment via `boundsIntersectViewport` (100%
 * if the point is within `bounds`, 0% otherwise), so this function's threshold check agrees
 * with what `boundsIntersectViewport` alone would have said in that situation.
 */
export const viewportCoveragePercent = (bounds: RasterBounds, viewport: L.LatLngBounds): number => {
  const viewportArea = (viewport.getEast() - viewport.getWest()) * (viewport.getNorth() - viewport.getSouth());
  if (viewportArea <= 0) return boundsIntersectViewport(bounds, viewport) ? 100 : 0;

  const intersectWidth = Math.min(bounds.east, viewport.getEast()) - Math.max(bounds.west, viewport.getWest());
  const intersectHeight = Math.min(bounds.north, viewport.getNorth()) - Math.max(bounds.south, viewport.getSouth());
  if (intersectWidth <= 0 || intersectHeight <= 0) return 0;

  return ((intersectWidth * intersectHeight) / viewportArea) * 100;
};

/**
 * The geographic bounds of the portion of the map container actually visible to the user -
 * `map.getBounds()` narrowed to exclude the strip on the left currently covered by the
 * always-left-docked `LayerPanel` overlay (see `LayerPanel.css`). Plain `map.getBounds()`
 * returns the *entire* container's bounds regardless of what's visually occluded by chrome
 * sitting on top of it, which is misleading input for viewport-based gating
 * (`boundsIntersectViewport`, `viewportCoveragePercent`) - a sheet only "in view" behind the
 * panel isn't actually visible to the user.
 *
 * `occludedLeftPx <= 0` (no panel, or not yet measured) short-circuits to plain
 * `map.getBounds()` - both to avoid the extra `containerPointToLatLng` calls when there's
 * nothing to account for, and so every zero-occlusion caller behaves exactly as before this
 * function existed. An `occludedLeftPx` at/beyond the container's own pixel width is clamped
 * to that width, degenerating to a zero-area viewport at the container's right edge rather
 * than an inverted box.
 */
export const effectiveViewportBounds = (map: L.Map, occludedLeftPx: number): L.LatLngBounds => {
  if (occludedLeftPx <= 0) return map.getBounds();
  const size = map.getSize();
  const left = Math.min(occludedLeftPx, size.x);
  return L.latLngBounds(map.containerPointToLatLng([left, 0]), map.containerPointToLatLng([size.x, size.y]));
};

/** fitBounds a map to the given bounds using responsive padding. */
export const fitBoundsWithPadding = (
  map: L.Map,
  bounds: L.LatLngBounds,
  extraOptions: L.FitBoundsOptions = {}
): void => {
  const padding = computeZoomPadding(map.getPixelBounds().getSize().x);
  map.fitBounds(bounds, {
    paddingBottomRight: padding.bottomRight,
    paddingTopLeft: padding.topLeft,
    ...extraOptions,
  });
};

