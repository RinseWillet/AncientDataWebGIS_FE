import { GeoJSON, LayersControl, Marker, Popup, ScaleControl, useMap } from 'react-leaflet';
import L, { LeafletMouseEvent, PathOptions } from 'leaflet';
import {
  histRec,
  hypotheticalRoute,
  notShowRoad,
  photoPinIcon,
  possibleRoad,
  road,
} from './Styles/markerStyles';
import './MapContent.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import GeometryEditor from '../GeometryEditor/GeometryEditor';
import { MutableRefObject, useCallback, useRef, useState } from 'react';
import BaseLayers from './BaseLayers';
import { getSiteIcon } from './siteIcons';
import { fitBoundsWithPadding } from './mapUtils';
import { useAutoZoom, useMarkerHighlight } from './useMapInteractions';
import { QueryItem, SearchItem } from './mapTypes';

export interface PhotoMarker {
  id: number;
  latitude: number;
  longitude: number;
  fullUrl: string;
  caption?: string | null;
}

interface MapContentProps {
  siteData: object;
  roadData: object;
  setShowInfoCard: (show: boolean) => void;
  setSearchItem: (item: SearchItem) => void;
  queryItem?: QueryItem;
  focusItem?: QueryItem;
  searchItem?: SearchItem;
  isEditing?: boolean;
  geometry?: string;
  onGeometryChange?: (wkt: string) => void;
  siteMarkersRef: MutableRefObject<Record<string | number, L.Marker>>;
  photoMarkers?: PhotoMarker[];
}


const roadStyleDifferentiator = (roadProps: { type?: string }): PathOptions => {
  switch (roadProps.type) {
    case 'possible road':
      return possibleRoad;
    case 'hypothetical route':
      return hypotheticalRoute;
    case 'road':
      return road;
    case 'hist_rec':
      return histRec;
    default:
      return notShowRoad;
  }
};

const MapContent = ({
  siteData,
  roadData,
  setShowInfoCard,
  setSearchItem,
  queryItem,
  focusItem,
  searchItem,
  isEditing,
  geometry,
  onGeometryChange = () => {},
  siteMarkersRef,
  photoMarkers = [],
}: MapContentProps) => {
  const map = useMap();
  const roadLayersRef: MutableRefObject<Record<string | number, L.Layer>> = useRef({});

  // queryItem drives the "arrived via SiteInfo/RoadInfo" highlight + zoom.
  // focusItem is zoom-only (e.g. after closing back to the plain atlas):
  // the view stays on the last selected item, but it is never highlighted,
  // and the user is free to pan/zoom away from it immediately.
  // Once the user makes a fresh selection by clicking any marker/road, a
  // carried-over queryItem highlight should be dropped for good. Compared
  // by value (not object identity) since a new queryItem object is created
  // on every parent render even when it still refers to the same site/road.
  const queryKey = queryItem ? `${queryItem.type}:${queryItem.id}` : '';
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
  const [queryDismissed, setQueryDismissed] = useState(false);
  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey);
    setQueryDismissed(false);
  }
  const effectiveQueryItem = queryDismissed ? undefined : queryItem;

  let selectedRoadId: string | number | null = null;
  if (searchItem?.type === 'road') {
    selectedRoadId = searchItem.id;
  } else if (effectiveQueryItem?.type === 'road') {
    selectedRoadId = effectiveQueryItem.id;
  }

  const zoomToPlace = useCallback(
    (type: string, id: string | number) => {
      if (!map) return;
      if (type === 'site') {
        const marker = siteMarkersRef.current[id];
        if (!marker) return;
        fitBoundsWithPadding(map, L.latLngBounds([marker.getLatLng()]), { maxZoom: 14 });
      } else if (type === 'road') {
        const roadLayer = roadLayersRef.current[id];
        if (!roadLayer || !('getBounds' in roadLayer)) return;
        fitBoundsWithPadding(map, (roadLayer as unknown as L.Polyline).getBounds());
      }
    },
    [map, siteMarkersRef]
  );

  useMarkerHighlight(map, siteMarkersRef, searchItem, effectiveQueryItem);
  const { pendingAutoZoom } = useAutoZoom(
    map,
    queryItem,
    focusItem,
    siteMarkersRef,
    roadLayersRef,
    zoomToPlace
  );

  const clickSite = (e: LeafletMouseEvent) => {
    pendingAutoZoom.current = false;
    const id = (
      e.sourceTarget as L.Marker & { feature?: { properties?: { id?: string | number } } }
    ).feature?.properties?.id;
    setQueryDismissed(true);
    setSearchItem({ type: 'site', id: id ?? '' });
    const marker = e.target as L.Marker;
    fitBoundsWithPadding(map, L.latLngBounds([marker.getLatLng()]), { maxZoom: 14 });
    setTimeout(() => setShowInfoCard(true), 100);
  };

  const clickRoad = (e: LeafletMouseEvent) => {
    pendingAutoZoom.current = false;
    const id = (e.target as L.Path & { feature?: { properties?: { id?: string | number } } })
      .feature?.properties?.id;
    setQueryDismissed(true);
    setSearchItem({ type: 'road', id: id ?? '' });
    fitBoundsWithPadding(map, (e.target as unknown as L.Polyline).getBounds());
    setShowInfoCard(true);
  };

  return (
    <>
      <LayersControl position="topleft" collapsed={true}>
        <BaseLayers />

        <LayersControl.Overlay checked name="Archaeological Sites">
          <GeoJSON
            data={siteData as GeoJSON.FeatureCollection}
            pointToLayer={(feature, latlng) => {
              const id = feature.properties?.id;
              const icon = getSiteIcon(feature.properties?.siteType);
              const marker = new L.Marker(latlng, { icon, alt: feature.properties?.name });
              (marker as L.Marker & { feature: GeoJSON.Feature }).feature = feature;
              siteMarkersRef.current[id] = marker;
              return marker;
            }}
            onEachFeature={(_feature, layer) => {
              layer.on({ click: clickSite });
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Roads and Routes">
          <GeoJSON
            data={roadData as GeoJSON.FeatureCollection}
            style={(feature) => {
              const isSelected = String(feature?.properties?.id) === String(selectedRoadId);
              return isSelected
                ? { weight: 3, color: 'yellow', zIndex: 20 }
                : roadStyleDifferentiator(feature?.properties ?? {});
            }}
            onEachFeature={(_feature, layer) => {
              const id = _feature.properties?.id;
              roadLayersRef.current[id] = layer;
              layer.on({ click: clickRoad });
            }}
          />
        </LayersControl.Overlay>

        {photoMarkers.length > 0 && (
          <LayersControl.Overlay checked name="Photos">
            <>
              {photoMarkers.map((photo) => (
                <Marker
                  key={photo.id}
                  position={[photo.latitude, photo.longitude]}
                  icon={photoPinIcon}
                >
                  <Popup>
                    <img
                      src={photo.fullUrl}
                      alt={photo.caption ?? ''}
                      style={{ maxWidth: '180px', display: 'block' }}
                    />
                    {photo.caption && <span>{photo.caption}</span>}
                  </Popup>
                </Marker>
              ))}
            </>
          </LayersControl.Overlay>
        )}
      </LayersControl>

      {isEditing && (
        <GeometryEditor
          geometry={geometry}
          onGeometryChange={onGeometryChange}
          isEditing={isEditing}
        />
      )}
      <ScaleControl position="bottomleft" />
    </>
  );
};

export default MapContent;
