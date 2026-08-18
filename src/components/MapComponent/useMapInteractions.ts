import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { highlightedSiteIcon, siteIcon } from './Styles/markerStyles';
import { getSiteIcon } from './siteIcons';
import { QueryItem, SearchItem } from './mapTypes';
import { LayerGroupName, layersConfig } from './layersConfig';
import { buildLayer, buildPhysicalLayer } from './mapUtils';
import { rasterService } from '../../services/RasterService';
import { RasterLayerCategory } from '../../types/raster';

type SiteMarkersRef = MutableRefObject<Record<string | number, L.Marker>>;
type RoadLayersRef = MutableRefObject<Record<string | number, L.Layer>>;

/**
 * Keep marker icons in sync with the current selection: the selected site (via
 * search or an incoming query) shows the highlighted icon, everything else
 * shows its type icon.
 */
export const useMarkerHighlight = (
  map: L.Map | null,
  siteMarkersRef: SiteMarkersRef,
  searchItem: SearchItem | undefined,
  effectiveQueryItem: QueryItem | undefined
): void => {
  useEffect(() => {
    if (!map) return;
    Object.entries(siteMarkersRef.current).forEach(([id, marker]) => {
      const isSelectedFromSearch =
        searchItem?.type === 'site' && String(searchItem.id) === String(id);
      const isSelectedFromQuery =
        effectiveQueryItem?.type === 'site' && String(effectiveQueryItem.id) === String(id);
      if (isSelectedFromSearch || isSelectedFromQuery) {
        marker.setIcon(highlightedSiteIcon);
      } else {
        const feature = (marker as L.Marker & { feature?: { properties?: { siteType?: string } } })
          .feature;
        marker.setIcon(feature?.properties?.siteType ? getSiteIcon(feature.properties.siteType) : siteIcon);
      }
    });
  }, [searchItem, effectiveQueryItem, map, siteMarkersRef]);
};

/**
 * Auto-zoom to a site/road when arriving from a detail page (`queryItem`) or
 * when returning to the atlas focused on the last selection (`focusItem`).
 * GeoJSON layers render asynchronously, so we retry until the target layer
 * exists (or give up after ~1s).
 */
export const useAutoZoom = (
  map: L.Map | null,
  queryItem: QueryItem | undefined,
  focusItem: QueryItem | undefined,
  siteMarkersRef: SiteMarkersRef,
  roadLayersRef: RoadLayersRef,
  zoomToPlace: (type: string, id: string | number) => void
): { pendingAutoZoom: MutableRefObject<boolean> } => {
  const pendingAutoZoom = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const zoomTarget = queryItem?.id !== '' && queryItem?.id != null ? queryItem : focusItem;
    if (!map || !zoomTarget || zoomTarget.id === '') return;

    pendingAutoZoom.current = true;

    let retryCount = 0;
    const maxRetries = 10; // Max 1 second of retries (10 * 100ms)

    const attemptZoom = () => {
      if (!pendingAutoZoom.current) return;
      let layerExists = false;
      if (zoomTarget.type === 'site') {
        layerExists = Boolean(siteMarkersRef.current[zoomTarget.id]);
      } else if (zoomTarget.type === 'road') {
        layerExists = Boolean(roadLayersRef.current[zoomTarget.id]);
      }

      if (layerExists) {
        zoomToPlace(zoomTarget.type, zoomTarget.id);
      } else if (retryCount < maxRetries) {
        retryCount++;
        retryTimeoutRef.current = setTimeout(attemptZoom, 100);
      }
    };

    // Wait initial delay for GeoJSON layers to render, then attempt zoom with retry
    retryTimeoutRef.current = setTimeout(attemptZoom, 300);

    return () => {
      pendingAutoZoom.current = false;
      clearTimeout(retryTimeoutRef.current);
    };
  }, [queryItem, focusItem, map, siteMarkersRef, roadLayersRef, zoomToPlace]);

  return { pendingAutoZoom };
};

export type OverlayKey = 'sites' | 'roads' | 'photos';

export interface OverlayVisibility {
  sites: boolean;
  roads: boolean;
  photos: boolean;
}

/** Groups whose layer selection is exclusive (radio-like: one active at a time). */
type ExclusiveGroupName = Extract<LayerGroupName, 'Historical Maps' | 'Aerial Imagery'>;

/**
 * A raster catalog entry (see `/api/raster/catalog`, E3-2), tracked by
 * either the "Physical" (DEM) or "Historical Maps" (scanned map sheets)
 * LayerPanel group depending on its catalog `category`. Unlike the
 * exclusive Historical/Aerial `layersConfig` groups above, any number of
 * these can be visible at once within their own group, each with its own
 * opacity. Array order is also map z-order within that group: index 0 is
 * the topmost (rendered last/on top), matching how it's listed in the
 * LayerPanel (first row = frontmost layer).
 */
export interface PhysicalLayerState {
  source: string;
  name: string;
  attribution: string;
  category: RasterLayerCategory;
  visible: boolean;
  opacity: number;
  /** Shared name grouping multiple sheets of the same atlas/series (e.g. "1818 De
   * Man - Nijmegen"), or undefined for a standalone entry. See E3-2's `collection`. */
  collection?: string;
  /** True for a multidirectional-hillshade sibling of a DEM layer (E3-5) - rendered
   * with a multiply blend over whatever's beneath it. See E3-2's `hillshade`. */
  hillshade: boolean;
}

export interface LayerPanelState {
  activeBaseLayer: string;
  activeHistoricalLayer: string | null;
  activeAerialLayer: string | null;
  overlayVisibility: OverlayVisibility;
  /** DEM-category catalog entries only (rendered under "Physical"). */
  physicalLayers: PhysicalLayerState[];
  /** HISTORICAL_MAP-category catalog entries only (rendered under "Historical Maps"). */
  historicalMapSheets: PhysicalLayerState[];
}

export interface LayerPanelControl {
  state: LayerPanelState;
  selectBaseLayer: (name: string) => void;
  toggleExclusiveLayer: (group: ExclusiveGroupName, name: string) => void;
  toggleOverlay: (key: OverlayKey) => void;
  togglePhysicalLayer: (source: string) => void;
  setPhysicalLayerOpacity: (source: string, opacity: number) => void;
  movePhysicalLayer: (source: string, direction: 'up' | 'down') => void;
  toggleHistoricalMapSheet: (source: string) => void;
  setHistoricalMapSheetOpacity: (source: string, opacity: number) => void;
  moveHistoricalMapSheet: (source: string, direction: 'up' | 'down') => void;
  /** Turns every sheet in a `collection` on if any are hidden, or off if all are visible. */
  toggleHistoricalMapCollection: (collection: string) => void;
}

/** Stacks the "Historical Maps" sheets group above any number of "Physical" (DEM) layers. */
const HISTORICAL_MAP_SHEET_ZINDEX_BASE = 1000;

/** Adds/removes/opacity-syncs/z-indexes a toggleable raster layer group's Leaflet tiles to match state. */
const syncLayerGroupToMap = (
  map: L.Map,
  layers: PhysicalLayerState[],
  refs: MutableRefObject<Record<string, L.TileLayer.WMS>>,
  zIndexBase: number
) => {
  layers.forEach((layer) => {
    const existing = refs.current[layer.source];
    if (layer.visible) {
      if (existing) {
        existing.setOpacity(layer.opacity);
      } else {
        refs.current[layer.source] = buildPhysicalLayer(
          layer.source,
          layer.opacity,
          layer.hillshade
        ).addTo(map);
      }
    } else if (existing) {
      map.removeLayer(existing);
      delete refs.current[layer.source];
    }
  });
  layers.forEach((layer, index) => {
    refs.current[layer.source]?.setZIndex(zIndexBase + layers.length - index);
  });
};

/** Entries with no `collection` are all treated as one shared "ungrouped" bucket, so they
 * can still reorder against each other - only entries in *different* named collections
 * (e.g. two different atlases) are prevented from swapping with one another. */
const UNGROUPED_KEY = '__ungrouped__';
const groupKeyOf = (layer: PhysicalLayerState): string => layer.collection ?? UNGROUPED_KEY;

/** toggle/setOpacity/move handlers for one toggleable raster layer group's state setter. */
const createLayerGroupHandlers = (setLayers: Dispatch<SetStateAction<PhysicalLayerState[]>>) => ({
  toggle: (source: string) =>
    setLayers((prev) =>
      prev.map((layer) => (layer.source === source ? { ...layer, visible: !layer.visible } : layer))
    ),
  setOpacity: (source: string, opacity: number) =>
    setLayers((prev) => prev.map((layer) => (layer.source === source ? { ...layer, opacity } : layer))),
  /**
   * direction 'up' moves a layer toward index 0 (frontmost/top row); 'down' moves it toward
   * the back. Only swaps with the nearest neighbor sharing the same `collection` (or the
   * shared ungrouped bucket), so reordering a sheet within one atlas can't shuffle it into
   * a different atlas's z-order - matches how `ToggleableLayerRows` renders each collection
   * as its own filtered slice, whose boundary (first/last row) buttons are disabled.
   */
  move: (source: string, direction: 'up' | 'down') =>
    setLayers((prev) => {
      const index = prev.findIndex((layer) => layer.source === source);
      if (index === -1) return prev;
      const group = groupKeyOf(prev[index]);
      const step = direction === 'up' ? -1 : 1;
      let targetIndex = index + step;
      while (targetIndex >= 0 && targetIndex < prev.length && groupKeyOf(prev[targetIndex]) !== group) {
        targetIndex += step;
      }
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    }),
  /** Turns every layer in `collection` on if any are hidden, or off if all are visible. */
  toggleCollection: (collection: string) =>
    setLayers((prev) => {
      const inCollection = prev.filter((layer) => layer.collection === collection);
      const allVisible = inCollection.length > 0 && inCollection.every((layer) => layer.visible);
      return prev.map((layer) =>
        layer.collection === collection ? { ...layer, visible: !allVisible } : layer
      );
    }),
});

const findLayerConfig = (group: LayerGroupName, name: string) =>
  layersConfig.find((config) => config.group === group && config.name === name);

const defaultBaseLayerName = (): string =>
  layersConfig.find((config) => config.kind === 'tile' && config.checked)?.name ??
  (layersConfig.find((config) => config.kind === 'tile')?.name as string);

/**
 * Drives the actual Leaflet base/historical/aerial layers for the Atlas
 * `LayerPanel`: one active base layer (always on), and at most one active
 * layer per exclusive overlay group (historical maps / aerial imagery).
 * Sites/roads/photos visibility is tracked here too, but toggling those is
 * left to the caller (MapContent renders/unmounts its own GeoJSON layers).
 */
export const useLayerPanelControl = (map: L.Map | null): LayerPanelControl => {
  const [activeBaseLayer, setActiveBaseLayer] = useState<string>(defaultBaseLayerName);
  const [activeHistoricalLayer, setActiveHistoricalLayer] = useState<string | null>(null);
  const [activeAerialLayer, setActiveAerialLayer] = useState<string | null>(null);
  const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>({
    sites: true,
    roads: true,
    photos: true,
  });
  const [physicalLayers, setPhysicalLayers] = useState<PhysicalLayerState[]>([]);
  const [historicalMapSheets, setHistoricalMapSheets] = useState<PhysicalLayerState[]>([]);
  const physicalLayerRefs = useRef<Record<string, L.TileLayer.WMS>>({});
  const historicalMapSheetRefs = useRef<Record<string, L.TileLayer.WMS>>({});

  useEffect(() => {
    if (!map) return;
    const config = findLayerConfig('Topographical', activeBaseLayer);
    if (!config) return;
    const layer = buildLayer(config).addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, activeBaseLayer]);

  useEffect(() => {
    if (!map || !activeHistoricalLayer) return;
    const config = findLayerConfig('Historical Maps', activeHistoricalLayer);
    if (!config) return;
    const layer = buildLayer(config).addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, activeHistoricalLayer]);

  useEffect(() => {
    if (!map || !activeAerialLayer) return;
    const config = findLayerConfig('Aerial Imagery', activeAerialLayer);
    if (!config) return;
    const layer = buildLayer(config).addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, activeAerialLayer]);

  // Load the raster catalog once `map` is set - the caller only passes a
  // real map instance when the Physical/Historical Maps groups are actually
  // shown (layerPanel is true), so this skips the request entirely on
  // RoadInfo/SiteInfo/Home. Split by category: DEM entries drive "Physical",
  // HISTORICAL_MAP entries drive "Historical Maps"'s sheet list. A failed
  // fetch just leaves both empty, so those LayerPanel sections stay
  // unrendered rather than showing a broken group.
  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    rasterService
      .getCatalog()
      .then((catalog) => {
        if (cancelled) return;
        const toLayerState = (entry: (typeof catalog)[number]): PhysicalLayerState => ({
          source: entry.source,
          name: entry.name,
          attribution: entry.attribution,
          category: entry.category,
          collection: entry.collection,
          hillshade: entry.hillshade,
          visible: false,
          opacity: 1,
        });
        setPhysicalLayers(catalog.filter((entry) => entry.category === 'DEM').map(toLayerState));
        setHistoricalMapSheets(
          catalog.filter((entry) => entry.category === 'HISTORICAL_MAP').map(toLayerState)
        );
      })
      .catch((error) => {
        console.error('Failed to load raster catalog', error);
      });
    return () => {
      cancelled = true;
    };
  }, [map]);

  // Sync each toggleable raster layer group to the map: add/remove on
  // visibility change, update opacity in place, and re-apply z-order
  // (index 0 = front) whenever a group's array order changes. Historical
  // map sheets are always stacked above Physical/DEM layers.
  useEffect(() => {
    if (!map) return;
    syncLayerGroupToMap(map, physicalLayers, physicalLayerRefs, 0);
  }, [map, physicalLayers]);

  useEffect(() => {
    if (!map) return;
    syncLayerGroupToMap(map, historicalMapSheets, historicalMapSheetRefs, HISTORICAL_MAP_SHEET_ZINDEX_BASE);
  }, [map, historicalMapSheets]);

  // Remove any remaining toggleable raster layers if the map instance itself changes/unmounts.
  useEffect(() => {
    return () => {
      Object.values(physicalLayerRefs.current).forEach((layer) => map?.removeLayer(layer));
      physicalLayerRefs.current = {};
      Object.values(historicalMapSheetRefs.current).forEach((layer) => map?.removeLayer(layer));
      historicalMapSheetRefs.current = {};
    };
  }, [map]);

  const toggleExclusiveLayer = (group: ExclusiveGroupName, name: string) => {
    const setActive = group === 'Historical Maps' ? setActiveHistoricalLayer : setActiveAerialLayer;
    setActive((prev) => (prev === name ? null : name));
  };

  const toggleOverlay = (key: OverlayKey) => {
    setOverlayVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const physicalLayerHandlers = createLayerGroupHandlers(setPhysicalLayers);
  const historicalMapSheetHandlers = createLayerGroupHandlers(setHistoricalMapSheets);

  return {
    state: {
      activeBaseLayer,
      activeHistoricalLayer,
      activeAerialLayer,
      overlayVisibility,
      physicalLayers,
      historicalMapSheets,
    },
    selectBaseLayer: setActiveBaseLayer,
    toggleExclusiveLayer,
    toggleOverlay,
    togglePhysicalLayer: physicalLayerHandlers.toggle,
    setPhysicalLayerOpacity: physicalLayerHandlers.setOpacity,
    movePhysicalLayer: physicalLayerHandlers.move,
    toggleHistoricalMapSheet: historicalMapSheetHandlers.toggle,
    setHistoricalMapSheetOpacity: historicalMapSheetHandlers.setOpacity,
    moveHistoricalMapSheet: historicalMapSheetHandlers.move,
    toggleHistoricalMapCollection: historicalMapSheetHandlers.toggleCollection,
  };
};

