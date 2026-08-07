import { MutableRefObject, useEffect, useRef } from 'react';
import L from 'leaflet';
import { highlightedSiteIcon, siteIcon } from './Styles/markerStyles';
import { getSiteIcon } from './siteIcons';
import { QueryItem, SearchItem } from './mapTypes';

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


