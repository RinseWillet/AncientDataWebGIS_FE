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

export interface WmsLayerConfig extends LayerConfigBase {
  kind: 'wms';
  url: string;
  layers: string;
}

export type LayerConfig = TileLayerConfig | WmsLayerConfig;

export const layersConfig: LayerConfig[] = [
  {
    kind: 'tile',
    name: 'Positron Modern Topographical',
    group: 'Topographical',
    attribution: ' OpenStreetMap contributors,  CartoDB',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
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
    layers: 'ruhr-lubi_1926',
  },
  {
    kind: 'wms',
    name: '1934',
    group: 'Aerial Imagery',
    groupLabel: 'Aerial Photos (Ruhr, Germany)',
    url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1934?',
    layers: 'ruhr-lubi_1934',
  },
  {
    kind: 'wms',
    name: '1952',
    group: 'Aerial Imagery',
    groupLabel: 'Aerial Photos (Ruhr, Germany)',
    url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1952?',
    layers: 'ruhr-lubi_1952',
  },
  {
    kind: 'wms',
    name: '1952 Köln',
    group: 'Aerial Imagery',
    groupLabel: 'Aerial Photos (Köln, Germany)',
    url: 'https://www.wms.nrw.de/geobasis/wms_nw_hist_dop_1952?',
    layers: 'köln-lubi_1952',
  },
];

/** The default base map, used to render a fixed tile layer when `showLayerChrome` is false. */
export const positronBaseLayer = layersConfig.find(
  (config): config is TileLayerConfig => config.kind === 'tile' && Boolean(config.checked)
) as TileLayerConfig;
