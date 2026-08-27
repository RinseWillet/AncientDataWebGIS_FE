import { Dispatch, MutableRefObject, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { highlightedSiteIcon, siteIcon } from './Styles/markerStyles';
import { getSiteIcon } from '../../utils/siteTypesConfig';
import { QueryItem, SearchItem } from './mapTypes';
import { LayerGroupName, layersConfig } from './layersConfig';
import { boundsIntersectViewport, buildLayer, buildPhysicalLayer } from './mapUtils';
import { rasterService } from '../../services/RasterService';
import { RasterBounds, RasterLayerCategory, RasterZoom } from '../../types/raster';

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
  /** WGS84 extent, from the catalog's `RasterBoundsDTO`. Used to gate both Physical-layer
   * (E3-7, against a shared global floor) and Historical Maps sheet (E3-8, against this
   * entry's own `zoom.min`) selectability by viewport. */
  bounds: RasterBounds;
  /** Curated display zoom range, from the catalog's `RasterZoomDTO`. `zoom.min` is used as
   * this entry's own per-layer zoom floor for Historical Maps sheet gating (E3-8) - unlike
   * Physical/DEM's shared `PHYSICAL_MIN_ZOOM_FLOOR`, sheet scale varies too widely (city-scale
   * historical topo sheets vs. much larger-scale cadastral maps) for one global floor to work.
   * `zoom.max` is unused for gating either group. */
  zoom: RasterZoom;
  /** Whether this row's toggle is currently blocked from being turned on: below the
   * applicable zoom floor, or its `bounds` don't intersect the current viewport (Physical:
   * E3-7's global floor; Historical Maps sheets: E3-8's own `zoom.min`). Never `true` for an
   * already-visible layer: panning/zooming away from an enabled layer must not trap the user
   * unable to turn it back off, so gating only blocks the on-transition. */
  disabled: boolean;
  /** User-facing explanation shown next to a `disabled` row; `null` when not disabled. */
  disabledReason: string | null;
}

/**
 * Global minimum zoom below which the entire Physical group is disabled (E3-7),
 * regardless of any individual layer's bounds. Set to 8 to match every DEM
 * layer's own curated `zoom.min` in `RasterCatalogService`: below that, none of
 * them would render tiles anyway, so this stops a fully-zoomed-out user from
 * enabling all 5 DEM areas (and their hillshade siblings) at once and
 * hammering GeoServer/the NAS, without being any stricter than the layers'
 * existing zoom ranges. Confirmed with the project owner.
 */
export const PHYSICAL_MIN_ZOOM_FLOOR = 8;

/** Whether `bounds` currently satisfies both E3-7 gates: at/above the zoom floor and
 * intersecting the map's live viewport. Ignores visibility entirely - used both by
 * `gatePhysicalLayer` (for a not-yet-visible row) and by the auto-off effect below
 * (to decide whether an *already*-visible row needs to be turned off). */
const isPhysicalLayerWithinGate = (bounds: RasterBounds, map: L.Map): boolean =>
  map.getZoom() >= PHYSICAL_MIN_ZOOM_FLOOR && boundsIntersectViewport(bounds, map.getBounds());

/**
 * Decides whether one Physical-group row should be gated off (E3-7). Pure
 * function of the layer and the map's live zoom/bounds, so it's cheap to
 * recompute per render and easy to unit test without mounting Leaflet.
 */
export const gatePhysicalLayer = (
  layer: Pick<PhysicalLayerState, 'visible' | 'bounds'>,
  map: L.Map | null
): { disabled: boolean; disabledReason: string | null } => {
  if (layer.visible || !map) return { disabled: false, disabledReason: null };
  if (map.getZoom() < PHYSICAL_MIN_ZOOM_FLOOR) {
    return { disabled: true, disabledReason: 'Zoom in further to enable Physical layers.' };
  }
  if (!boundsIntersectViewport(layer.bounds, map.getBounds())) {
    return { disabled: true, disabledReason: "Pan the map to this layer's area to enable it." };
  }
  return { disabled: false, disabledReason: null };
};

/** Fallback message (E3-8) shown when gating leaves a Historical Maps section/collection with
 * nothing selectable. Unlike E3-7's two distinct zoom/pan hints, this is a single message: with
 * a per-sheet zoom floor instead of one shared constant, a mixed set of hidden sheets in the
 * same collection can be gated off for different reasons (some too-zoomed-out, some out of
 * view), so there's no one specific instruction that's always correct - "pan or zoom" covers
 * both without guessing which applies. */
export const HISTORICAL_MAP_SHEET_GATE_HINT =
  'No historical maps match this area/zoom — pan or zoom in to reveal sheets.';

/** Whether `layer` currently satisfies both E3-8 gates: at/above its own `zoom.min` and
 * intersecting the map's live viewport. Mirrors `isPhysicalLayerWithinGate`, but reads the
 * zoom floor off the layer itself instead of the shared `PHYSICAL_MIN_ZOOM_FLOOR`, since sheet
 * scale varies too widely for one global floor (see `PhysicalLayerState.zoom` doc comment). */
const isHistoricalSheetWithinGate = (
  layer: Pick<PhysicalLayerState, 'bounds' | 'zoom'>,
  map: L.Map
): boolean => map.getZoom() >= layer.zoom.min && boundsIntersectViewport(layer.bounds, map.getBounds());

/**
 * Decides whether one Historical Maps sheet row should be gated off (E3-8), extending E3-7's
 * viewport-gating principle with a per-entry zoom floor (`layer.zoom.min`) instead of a shared
 * constant. Pure function, mirroring `gatePhysicalLayer`.
 */
export const gateHistoricalMapSheet = (
  layer: Pick<PhysicalLayerState, 'visible' | 'bounds' | 'zoom'>,
  map: L.Map | null
): { disabled: boolean; disabledReason: string | null } => {
  if (layer.visible || !map) return { disabled: false, disabledReason: null };
  if (!isHistoricalSheetWithinGate(layer, map)) {
    return { disabled: true, disabledReason: HISTORICAL_MAP_SHEET_GATE_HINT };
  }
  return { disabled: false, disabledReason: null };
};

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

/**
 * toggle/setOpacity/move/toggleCollection handlers for one toggleable raster layer group's
 * state setter. `isGatedOff`, if given, marks layers currently gated off (E3-7 for Physical,
 * E3-8 for Historical Maps sheets) - `move` steps over them so "move up/down" only reorders
 * among rows actually rendered in the filtered `LayerPanel` list rather than silently
 * swapping with a hidden neighbor, and `toggleCollection`'s "select all" excludes them so
 * bulk-toggling a collection never attempts to turn on a sheet the gate would immediately
 * reject, and its checked/indeterminate state reflects only the rows the user can see.
 */
const createLayerGroupHandlers = (
  setLayers: Dispatch<SetStateAction<PhysicalLayerState[]>>,
  isGatedOff: (layer: PhysicalLayerState) => boolean = () => false
) => ({
  toggle: (source: string) =>
    setLayers((prev) =>
      prev.map((layer) => (layer.source === source ? { ...layer, visible: !layer.visible } : layer))
    ),
  setOpacity: (source: string, opacity: number) =>
    setLayers((prev) => prev.map((layer) => (layer.source === source ? { ...layer, opacity } : layer))),
  /**
   * direction 'up' moves a layer toward index 0 (frontmost/top row); 'down' moves it toward
   * the back. Only swaps with the nearest neighbor sharing the same `collection` (or the
   * shared ungrouped bucket) and not skipped by `shouldSkipForMove`, so reordering a sheet
   * within one atlas can't shuffle it into a different atlas's z-order - matches how
   * `ToggleableLayerRows` renders each collection as its own filtered slice, whose boundary
   * (first/last row) buttons are disabled.
   */
  move: (source: string, direction: 'up' | 'down') =>
    setLayers((prev) => {
      const index = prev.findIndex((layer) => layer.source === source);
      if (index === -1) return prev;
      const group = groupKeyOf(prev[index]);
      const step = direction === 'up' ? -1 : 1;
      let targetIndex = index + step;
      while (
        targetIndex >= 0 &&
        targetIndex < prev.length &&
        (groupKeyOf(prev[targetIndex]) !== group || isGatedOff(prev[targetIndex]))
      ) {
        targetIndex += step;
      }
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    }),
  /** Turns every currently-selectable (not gated-off) layer in `collection` on if any of
   * them are hidden, or off if all of them are visible - a gated-off sheet is left untouched
   * either way, since the gate would immediately reject turning it on regardless. */
  toggleCollection: (collection: string) =>
    setLayers((prev) => {
      const selectableInCollection = prev.filter(
        (layer) => layer.collection === collection && !isGatedOff(layer)
      );
      const allVisible =
        selectableInCollection.length > 0 && selectableInCollection.every((layer) => layer.visible);
      return prev.map((layer) =>
        layer.collection === collection && !isGatedOff(layer) ? { ...layer, visible: !allVisible } : layer
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
          bounds: entry.bounds,
          zoom: entry.zoom,
          visible: false,
          opacity: 1,
          disabled: false,
          disabledReason: null,
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

  // `map.getZoom()`/`getBounds()` are live reads off a mutable Leaflet instance, not
  // reactive state, so `gatedPhysicalLayers`/`gatedHistoricalMapSheets` below need an explicit
  // nudge to recompute whenever the viewport actually changes (E3-7, extended to Historical
  // Maps sheets by E3-8). The same handler also auto-turns a visible layer in either group
  // back off once it stops satisfying its own gate (E3-7 follow-up, confirmed with the
  // project owner): otherwise it would keep requesting WMS tiles for wherever the user has
  // since panned/zoomed to - defeating the point of gating enablement in the first place -
  // and its row would stay checked but hidden from the filtered LayerPanel list below.
  // Re-enabling it once back in range is a normal toggle.
  const [viewportVersion, setViewportVersion] = useState(0);
  useEffect(() => {
    if (!map) return;
    const onViewportChange = () => {
      setViewportVersion((version) => version + 1);
      setPhysicalLayers((prev) => {
        let changed = false;
        const next = prev.map((layer) => {
          if (!layer.visible || isPhysicalLayerWithinGate(layer.bounds, map)) return layer;
          changed = true;
          return { ...layer, visible: false };
        });
        return changed ? next : prev;
      });
      setHistoricalMapSheets((prev) => {
        let changed = false;
        const next = prev.map((layer) => {
          if (!layer.visible || isHistoricalSheetWithinGate(layer, map)) return layer;
          changed = true;
          return { ...layer, visible: false };
        });
        return changed ? next : prev;
      });
    };
    map.on('moveend', onViewportChange);
    map.on('zoomend', onViewportChange);
    return () => {
      map.off('moveend', onViewportChange);
      map.off('zoomend', onViewportChange);
    };
  }, [map]);

  // Physical (DEM) layers decorated with live viewport/zoom gating against the shared global
  // floor (E3-7); Historical Maps sheets decorated the same way but against each entry's own
  // `zoom.min` (E3-8).
  const gatedPhysicalLayers = useMemo(
    () => physicalLayers.map((layer) => ({ ...layer, ...gatePhysicalLayer(layer, map) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [physicalLayers, map, viewportVersion]
  );
  const gatedHistoricalMapSheets = useMemo(
    () => historicalMapSheets.map((layer) => ({ ...layer, ...gateHistoricalMapSheet(layer, map) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historicalMapSheets, map, viewportVersion]
  );

  const toggleExclusiveLayer = (group: ExclusiveGroupName, name: string) => {
    const setActive = group === 'Historical Maps' ? setActiveHistoricalLayer : setActiveAerialLayer;
    setActive((prev) => (prev === name ? null : name));
  };

  const toggleOverlay = (key: OverlayKey) => {
    setOverlayVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const physicalLayerHandlers = createLayerGroupHandlers(
    setPhysicalLayers,
    (layer) => !map || !isPhysicalLayerWithinGate(layer.bounds, map)
  );
  const historicalMapSheetHandlers = createLayerGroupHandlers(
    setHistoricalMapSheets,
    (layer) => !map || !isHistoricalSheetWithinGate(layer, map)
  );

  // Blocks turning a gated-off Physical row on (E3-7's "enabling one is blocked");
  // turning an already-visible row off is never gated (see `gatePhysicalLayer`).
  const togglePhysicalLayer = (source: string) => {
    const layer = gatedPhysicalLayers.find((candidate) => candidate.source === source);
    if (layer?.disabled) return;
    physicalLayerHandlers.toggle(source);
  };

  // Blocks turning a gated-off Historical Maps sheet on (E3-8, mirroring E3-7's Physical
  // gate); turning an already-visible row off is never gated (see `gateHistoricalMapSheet`).
  const toggleHistoricalMapSheet = (source: string) => {
    const layer = gatedHistoricalMapSheets.find((candidate) => candidate.source === source);
    if (layer?.disabled) return;
    historicalMapSheetHandlers.toggle(source);
  };

  return {
    state: {
      activeBaseLayer,
      activeHistoricalLayer,
      activeAerialLayer,
      overlayVisibility,
      physicalLayers: gatedPhysicalLayers,
      historicalMapSheets: gatedHistoricalMapSheets,
    },
    selectBaseLayer: setActiveBaseLayer,
    toggleExclusiveLayer,
    toggleOverlay,
    togglePhysicalLayer,
    setPhysicalLayerOpacity: physicalLayerHandlers.setOpacity,
    movePhysicalLayer: physicalLayerHandlers.move,
    toggleHistoricalMapSheet,
    setHistoricalMapSheetOpacity: historicalMapSheetHandlers.setOpacity,
    moveHistoricalMapSheet: historicalMapSheetHandlers.move,
    toggleHistoricalMapCollection: historicalMapSheetHandlers.toggleCollection,
  };
};

