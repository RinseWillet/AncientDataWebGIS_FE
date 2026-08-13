import { MutableRefObject, useEffect, useRef, useState } from 'react';
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
 * A raster catalog entry (see `/api/raster/catalog`, E3-2) as tracked by the
 * "Physical" LayerPanel group. Unlike the exclusive Historical/Aerial
 * groups, any number of these can be visible at once, each with its own
 * opacity. `physicalLayers`' array order is also its map z-order: index 0
 * is the topmost (rendered last/on top), matching how it's listed in the
 * LayerPanel (first row = frontmost layer).
 */
export interface PhysicalLayerState {
  source: string;
  name: string;
  attribution: string;
  category: RasterLayerCategory;
  visible: boolean;
  opacity: number;
}

export interface LayerPanelState {
  activeBaseLayer: string;
  activeHistoricalLayer: string | null;
  activeAerialLayer: string | null;
  overlayVisibility: OverlayVisibility;
  physicalLayers: PhysicalLayerState[];
}

export interface LayerPanelControl {
  state: LayerPanelState;
  selectBaseLayer: (name: string) => void;
  toggleExclusiveLayer: (group: ExclusiveGroupName, name: string) => void;
  toggleOverlay: (key: OverlayKey) => void;
  togglePhysicalLayer: (source: string) => void;
  setPhysicalLayerOpacity: (source: string, opacity: number) => void;
  movePhysicalLayer: (source: string, direction: 'up' | 'down') => void;
}

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
  const physicalLayerRefs = useRef<Record<string, L.TileLayer.WMS>>({});

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
  // real map instance when the Physical group is actually shown (layerPanel
  // is true), so this skips the request entirely on RoadInfo/SiteInfo/Home.
  // A failed fetch just leaves physicalLayers empty, so the LayerPanel's
  // Physical section stays unrendered rather than showing a broken group.
  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    rasterService
      .getCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setPhysicalLayers(
          catalog.map((entry) => ({
            source: entry.source,
            name: entry.name,
            attribution: entry.attribution,
            category: entry.category,
            visible: false,
            opacity: 1,
          }))
        );
      })
      .catch((error) => {
        console.error('Failed to load raster catalog', error);
      });
    return () => {
      cancelled = true;
    };
  }, [map]);

  // Sync visible physical layers to the map: add/remove on visibility
  // change, update opacity in place, and re-apply z-order (index 0 = front)
  // whenever the array's order changes.
  useEffect(() => {
    if (!map) return;
    physicalLayers.forEach((physicalLayer) => {
      const existing = physicalLayerRefs.current[physicalLayer.source];
      if (physicalLayer.visible) {
        if (existing) {
          existing.setOpacity(physicalLayer.opacity);
        } else {
          physicalLayerRefs.current[physicalLayer.source] = buildPhysicalLayer(
            physicalLayer.source,
            physicalLayer.opacity
          ).addTo(map);
        }
      } else if (existing) {
        map.removeLayer(existing);
        delete physicalLayerRefs.current[physicalLayer.source];
      }
    });
    physicalLayers.forEach((physicalLayer, index) => {
      physicalLayerRefs.current[physicalLayer.source]?.setZIndex(physicalLayers.length - index);
    });
  }, [map, physicalLayers]);

  // Remove any remaining physical layers if the map instance itself changes/unmounts.
  useEffect(() => {
    return () => {
      Object.values(physicalLayerRefs.current).forEach((layer) => map?.removeLayer(layer));
      physicalLayerRefs.current = {};
    };
  }, [map]);

  const toggleExclusiveLayer = (group: ExclusiveGroupName, name: string) => {
    const setActive = group === 'Historical Maps' ? setActiveHistoricalLayer : setActiveAerialLayer;
    setActive((prev) => (prev === name ? null : name));
  };

  const toggleOverlay = (key: OverlayKey) => {
    setOverlayVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePhysicalLayer = (source: string) => {
    setPhysicalLayers((prev) =>
      prev.map((layer) => (layer.source === source ? { ...layer, visible: !layer.visible } : layer))
    );
  };

  const setPhysicalLayerOpacity = (source: string, opacity: number) => {
    setPhysicalLayers((prev) =>
      prev.map((layer) => (layer.source === source ? { ...layer, opacity } : layer))
    );
  };

  /** direction 'up' moves a layer toward index 0 (frontmost/top row); 'down' moves it toward the back. */
  const movePhysicalLayer = (source: string, direction: 'up' | 'down') => {
    setPhysicalLayers((prev) => {
      const index = prev.findIndex((layer) => layer.source === source);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  return {
    state: {
      activeBaseLayer,
      activeHistoricalLayer,
      activeAerialLayer,
      overlayVisibility,
      physicalLayers,
    },
    selectBaseLayer: setActiveBaseLayer,
    toggleExclusiveLayer,
    toggleOverlay,
    togglePhysicalLayer,
    setPhysicalLayerOpacity,
    movePhysicalLayer,
  };
};

