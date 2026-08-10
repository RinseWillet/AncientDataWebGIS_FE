import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// Side-effect import: extends `L.control` with `.groupedLayers(...)`.
// Must be imported after `leaflet` so the plugin can attach to the global `L`.
import 'leaflet-groupedlayercontrol';
import 'leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css';

interface TileLayerConfig {
  kind: 'tile';
  name: string;
  attribution: string;
  url: string;
  checked?: boolean;
}

interface WmsLayerConfig {
  kind: 'wms';
  name: string;
  url: string;
  layers: string;
  checked?: boolean;
}

type LayerConfig = TileLayerConfig | WmsLayerConfig;

interface OverlayGroupConfig {
  /** Group label shown in the layer control, e.g. "Aerial Photos (Ruhr, Germany)". */
  groupName: string;
  /** When true only one layer in this group can be active at a time (radio buttons). */
  exclusive?: boolean;
  layers: WmsLayerConfig[];
}

/** True basemaps: mutually exclusive, always fill the whole map. */
const baseLayerConfigs: TileLayerConfig[] = [
  {
    kind: 'tile',
    name: 'Positron Modern Topographical',
    attribution: ' OpenStreetMap contributors,  CartoDB',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    checked: true,
  },
  {
    kind: 'tile',
    name: 'Open Street Map Topographical',
    attribution: ' OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    kind: 'tile',
    name: 'Satellite',
    attribution: 'Tiles  Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
];

/**
 * Grouped overlays: layered on top of whichever base map is active. Each group
 * is exclusive, so e.g. switching between aerial-photo years swaps them out
 * without needing to change the base map underneath.
 */
const overlayGroups: OverlayGroupConfig[] = [
  {
    groupName: 'Historical Maps (NRW)',
    exclusive: true,
    layers: [
      {
        kind: 'wms',
        name: '1801–1828: Kartenaufnahme der Rheinlande',
        url: 'https://www.wms.nrw.de/geobasis/wms_nw_tranchot?',
        layers: 'nw_tranchot',
      },
      {
        kind: 'wms',
        name: '1836–1850: Preuische Kartenaufnahme',
        url: 'https://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?',
        layers: 'nw_uraufnahme_rw',
      },
      {
        kind: 'wms',
        name: '1891–1912: Preuische Kartenaufnahme',
        url: 'https://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?',
        layers: 'nw_neuaufnahme',
      },
    ],
  },
  {
    groupName: 'Aerial Photos (Ruhr, Germany)',
    exclusive: true,
    layers: [
      {
        kind: 'wms',
        name: '1926',
        url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1926?',
        layers: 'lubi_1926',
      },
      {
        kind: 'wms',
        name: '1934',
        url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1934?',
        layers: 'lubi_1934',
      },
      {
        kind: 'wms',
        name: '1952',
        url: 'https://geodaten.metropoleruhr.de/lubi/lubi_1952?',
        layers: 'lubi_1952',
      },
    ],
  },
];

const buildLayer = (config: LayerConfig): L.Layer =>
  config.kind === 'tile'
    ? L.tileLayer(config.url, { attribution: config.attribution })
    : L.tileLayer.wms(config.url, {
        layers: config.layers,
        format: 'image/png',
        transparent: true,
      });

/** Builds the flat base-layer map and picks out the default (checked) layer. */
const buildBaseLayerEntries = (configs: TileLayerConfig[]) => {
  const entries: Record<string, L.Layer> = {};
  let defaultLayer: L.Layer | undefined;

  configs.forEach((config) => {
    const layer = buildLayer(config);
    entries[config.name] = layer;
    if (config.checked) defaultLayer = layer;
  });

  return { entries, defaultLayer };
};

/** Builds a single group's layer entries and collects any default (checked) layers. */
const buildOverlayGroupEntries = (group: OverlayGroupConfig) => {
  const entries: Record<string, L.Layer> = {};
  const defaultLayers: L.Layer[] = [];

  group.layers.forEach((config) => {
    const layer = buildLayer(config);
    entries[config.name] = layer;
    if (config.checked) defaultLayers.push(layer);
  });

  return { entries, defaultLayers };
};

/** Builds the grouped overlay map and collects all default (checked) layers across groups. */
const buildGroupedOverlayEntries = (groups: OverlayGroupConfig[]) => {
  const entries: Record<string, Record<string, L.Layer>> = {};
  const defaultLayers: L.Layer[] = [];

  groups.forEach((group) => {
    const groupResult = buildOverlayGroupEntries(group);
    entries[group.groupName] = groupResult.entries;
    defaultLayers.push(...groupResult.defaultLayers);
  });

  return { entries, defaultLayers };
};

/** Removes all base and overlay layers from the map, e.g. during effect cleanup. */
const removeAllLayers = (
  map: L.Map,
  baseLayerEntries: Record<string, L.Layer>,
  groupedOverlayEntries: Record<string, Record<string, L.Layer>>
) => {
  Object.values(baseLayerEntries).forEach((layer) => map.removeLayer(layer));
  Object.values(groupedOverlayEntries)
    .flatMap((group) => Object.values(group))
    .forEach((layer) => map.removeLayer(layer));
};

/**
 * Renders a grouped layer control (base maps + collapsible groups of
 * overlays, e.g. historical maps / aerial photos) using the
 * leaflet-groupedlayercontrol plugin. Unlike react-leaflet's own
 * LayersControl, this supports nested groups and lets overlay groups stack
 * on top of whichever base map is selected instead of replacing it.
 */
const BaseLayers = () => {
  const map = useMap();

  useEffect(() => {
    const { entries: baseLayerEntries, defaultLayer: defaultBaseLayer } =
      buildBaseLayerEntries(baseLayerConfigs);
    const { entries: groupedOverlayEntries, defaultLayers: defaultOverlayLayers } =
      buildGroupedOverlayEntries(overlayGroups);

    const exclusiveGroups = overlayGroups
      .filter((group) => group.exclusive)
      .map((group) => group.groupName);

    const control = L.control.groupedLayers(
      baseLayerEntries,
      groupedOverlayEntries as unknown as Record<string, Record<string, L.LayerGroup>>,
      { collapsed: true, position: 'topleft', exclusiveGroups }
    );

    control.addTo(map);
    defaultBaseLayer?.addTo(map);
    defaultOverlayLayers.forEach((layer) => layer.addTo(map));

    return () => {
      control.remove();
      removeAllLayers(map, baseLayerEntries, groupedOverlayEntries);
    };
  }, [map]);

  return null;
};

export default BaseLayers;
