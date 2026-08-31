import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// Side-effect import: extends `L.control` with `.groupedLayers(...)`.
// Must be imported after `leaflet` so the plugin can attach to the global `L`.
import 'leaflet-groupedlayercontrol';
import 'leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css';
import {
  isBaseLayerConfig,
  layersConfig,
  TileLayerConfig,
  VectorLayerConfig,
  WmsLayerConfig,
} from './layersConfig';
import { buildLayer } from './mapUtils';

interface OverlayGroupConfig {
  /** Group label shown in the layer control, e.g. "Aerial Photos (Ruhr, Germany)". */
  groupName: string;
  /** When true only one layer in this group can be active at a time (radio buttons). */
  exclusive?: boolean;
  layers: WmsLayerConfig[];
}

/** True basemaps: mutually exclusive, always fill the whole map. */
const baseLayerConfigs: (TileLayerConfig | VectorLayerConfig)[] =
  layersConfig.filter(isBaseLayerConfig);

/**
 * Grouped overlays: layered on top of whichever base map is active. Each group
 * is exclusive, so e.g. switching between aerial-photo years swaps them out
 * without needing to change the base map underneath. Derived from
 * `layersConfig`, grouping WMS entries by their display label (falling back
 * to the canonical `group` name) and preserving config order.
 */
const overlayGroups: OverlayGroupConfig[] = (() => {
  const groupOrder: string[] = [];
  const layersByGroup = new Map<string, WmsLayerConfig[]>();

  layersConfig.forEach((config) => {
    if (config.kind !== 'wms') return;
    const groupName = config.groupLabel ?? config.group;
    if (!layersByGroup.has(groupName)) {
      layersByGroup.set(groupName, []);
      groupOrder.push(groupName);
    }
    layersByGroup.get(groupName)?.push(config);
  });

  return groupOrder.map((groupName) => ({
    groupName,
    exclusive: true,
    layers: layersByGroup.get(groupName) ?? [],
  }));
})();

/** Builds the flat base-layer map and picks out the default (checked) layer. */
const buildBaseLayerEntries = (configs: (TileLayerConfig | VectorLayerConfig)[]) => {
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

/**
 * Renders a single fixed, non-toggleable base layer (tile or vector)
 * imperatively via `buildLayer`, for pages with no layer-control chrome
 * (e.g. the Home page preview map).
 */
export const FixedBaseLayer = ({ config }: { config: TileLayerConfig | VectorLayerConfig }) => {
  const map = useMap();

  useEffect(() => {
    const layer = buildLayer(config).addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, config]);

  return null;
};

export default BaseLayers;
