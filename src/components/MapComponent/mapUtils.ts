import L from 'leaflet';
import { LayerConfig } from './layersConfig';
import { apiBaseUrl } from '../../api/config';
import { RasterBounds } from '../../types/raster';

/** Builds a Leaflet tile/WMS layer instance from a `layersConfig` entry. */
export const buildLayer = (config: LayerConfig): L.Layer =>
  config.kind === 'tile'
    ? L.tileLayer(config.url, { attribution: config.attribution })
    : L.tileLayer.wms(config.url, {
        layers: config.layers,
        format: 'image/png',
        transparent: true,
      });

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

