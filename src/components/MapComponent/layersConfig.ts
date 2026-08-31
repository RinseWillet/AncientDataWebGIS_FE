import { RasterBounds, RasterZoom } from '../../types/raster';

/**
 * Single source of truth for every selectable map layer. Consumed by
 * `BaseLayers.tsx` (Leaflet grouped layer control, used on RoadInfo/SiteInfo)
 * and, from E9-4 onward, the custom Atlas `LayerPanel` sidebar.
 */
export type LayerGroupName = 'Topographical' | 'Aerial Imagery' | 'Historical Maps';

interface LayerConfigBase {
  name: string;
  /** Canonical section this layer belongs to (drives LayerPanel grouping). */
  group: LayerGroupName;
  /**
   * Display label for the grouped overlay control, where more specific
   * regional context is useful (e.g. "Historical Maps (NRW)"). Falls back to
   * `group` when omitted.
   */
  groupLabel?: string;
  checked?: boolean;
}

export interface TileLayerConfig extends LayerConfigBase {
  kind: 'tile';
  attribution: string;
  url: string;
}

export interface VectorLayerConfig extends LayerConfigBase {
  kind: 'vector';
  attribution: string;
  styleUrl: string;
}

export interface WmsLayerConfig extends LayerConfigBase {
  kind: 'wms';
  url: string;
  layers: string;
  /**
   * Optional viewport/zoom gate (E3-9, mirroring E3-7/E3-8's raster-catalog gating): when
   * present, `LayerPanel` hides this entry unless the map viewport intersects `bounds` and
   * the zoom is at or above `zoom.min`. Entries without `bounds` are never gated.
   */
  bounds?: RasterBounds;
  zoom?: RasterZoom;
}

export type LayerConfig = TileLayerConfig | VectorLayerConfig | WmsLayerConfig;

/** Base layers: mutually exclusive raster or vector tiles that fill the whole map. */
export const isBaseLayerConfig = (
  config: LayerConfig
): config is TileLayerConfig | VectorLayerConfig =>
  config.kind === 'tile' || config.kind === 'vector';

export const layersConfig: LayerConfig[] = [
  {
    kind: 'vector',
    name: 'Positron Modern Topographical',
    group: 'Topographical',
    attribution: ' OpenFreeMap  OpenMapTiles  OpenStreetMap contributors',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    checked: true,
  },
  {
    kind: 'tile',
    name: 'Open Street Map Topographical',
    group: 'Topographical',
    attribution: ' OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    kind: 'tile',
    name: 'Satellite',
    group: 'Topographical',
    attribution: 'Tiles  Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    kind: 'wms',
    name: '1801–1828: Kartenaufnahme der Rheinlande',
    group: 'Historical Maps',
    groupLabel: 'Historical Maps (NRW)',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_tranchot?',
    layers: 'nw_tranchot',
  },
  {
    kind: 'wms',
    name: '1836–1850: Preuische Kartenaufnahme',
    group: 'Historical Maps',
    groupLabel: 'Historical Maps (NRW)',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?',
    layers: 'nw_uraufnahme_rw',
  },
  {
    kind: 'wms',
    name: '1891–1912: Preuische Kartenaufnahme',
    group: 'Historical Maps',
    groupLabel: 'Historical Maps (NRW)',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?',
    layers: 'nw_neuaufnahme',
  },
  {
    kind: 'wms',
    name: '1926',
    group: 'Aerial Imagery',
    groupLabel: 'Aerial Photos (Ruhr, Germany)',
    url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1926?',
    layers: 'lubi_1926',
    bounds: { south: 51.167497, west: 6.227895, north: 51.860887, east: 8.055436 },
    zoom: { min: 9, max: 19 },
  },
  {
    kind: 'wms',
    name: '1934',
    group: 'Aerial Imagery',
    groupLabel: 'Aerial Photos (Ruhr, Germany)',
    url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1934?',
    layers: 'lubi_1934',
    bounds: { south: 51.167497, west: 6.227895, north: 51.860887, east: 8.055436 },
    zoom: { min: 9, max: 19 },
  },
  {
    kind: 'wms',
    name: '1952',
    group: 'Aerial Imagery',
    groupLabel: 'Aerial Photos (Ruhr, Germany)',
    url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1952?',
    layers: 'lubi_1952',
    bounds: { south: 51.167497, west: 6.227895, north: 51.860887, east: 8.055436 },
    zoom: { min: 9, max: 19 },
  },
  {
    kind: 'wms',
    name: '1952 Köln',
    group: 'Aerial Imagery',
    groupLabel: 'Aerial Photos (Köln, Germany)',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_hist_dop?',
    layers: 'nw_hist_dop_1952',
  },
];

/** The default base map, used to render a fixed base layer when `showLayerChrome` is false. */
export const positronBaseLayer = layersConfig.find(
  (config): config is TileLayerConfig | VectorLayerConfig =>
    isBaseLayerConfig(config) && Boolean(config.checked)
) as TileLayerConfig | VectorLayerConfig;
