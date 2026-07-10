import { GeoJSON, LayersControl, ScaleControl, TileLayer, useMap, WMSTileLayer } from 'react-leaflet';
import L, { Icon, DivIcon, PathOptions, LeafletMouseEvent } from 'leaflet';
import {
  castellumIcon,
  cemeteryIcon,
  cityIcon,
  highlightedSiteIcon,
  histRec,
  hypotheticalRoute,
  legionaryFortIcon,
  mileStoneIcon,
  notShowRoad,
  possibleCastellumIcon,
  possibleRoad,
  possibleShipIcon,
  possibleVillaIcon,
  road,
  sanctuaryIcon,
  settlementIcon,
  settlementStoneIcon,
  shipIcon,
  siteIcon,
  tumulusIcon,
  villaIcon,
  watchtowerIcon,
} from './Styles/markerStyles';
import './MapContent.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import GeometryEditor from '../GeometryEditor/GeometryEditor';
import { useEffect, MutableRefObject, useRef, useCallback } from 'react';

interface SearchItem {
  type: string;
  id: string | number;
}

interface QueryItem {
  type: string;
  id: string | number;
}

interface MapContentProps {
  siteData: object;
  roadData: object;
  setShowInfoCard: (show: boolean) => void;
  setSearchItem: (item: SearchItem) => void;
  queryItem?: QueryItem;
  searchItem?: SearchItem;
  isEditing?: boolean;
  geometry?: string;
  onGeometryChange?: (wkt: string) => void;
  siteMarkersRef: MutableRefObject<Record<string | number, L.Marker>>;
}

const siteIconMap: Record<string, Icon | DivIcon> = {
  castellum: castellumIcon,
  pos_castellum: possibleCastellumIcon,
  legfort: legionaryFortIcon,
  watchtower: watchtowerIcon,
  city: cityIcon,
  cem: cemeteryIcon,
  ptum: tumulusIcon,
  tum: tumulusIcon,
  villa: villaIcon,
  pvilla: possibleVillaIcon,
  sett: settlementIcon,
  settS: settlementStoneIcon,
  sanctuary: sanctuaryIcon,
  ship: shipIcon,
  pship: possibleShipIcon,
  site: siteIcon,
  milestone: mileStoneIcon,
};

const getSiteIcon = (type: string): Icon | DivIcon => siteIconMap[type] ?? siteIcon;

const roadStyleDifferentiator = (roadProps: { type?: string }): PathOptions => {
  switch (roadProps.type) {
    case 'possible road': return possibleRoad;
    case 'hypothetical route': return hypotheticalRoute;
    case 'road': return road;
    case 'hist_rec': return histRec;
    default: return notShowRoad;
  }
};

const MapContent = ({
  siteData,
  roadData,
  setShowInfoCard,
  setSearchItem,
  queryItem,
  searchItem,
  isEditing,
  geometry,
  onGeometryChange = () => {},
  siteMarkersRef,
}: MapContentProps) => {
  const map = useMap();
  const roadLayersRef: MutableRefObject<Record<string | number, L.Layer>> = useRef({});

  let selectedRoadId: string | number | null = null;
  if (searchItem?.type === 'road') {
    selectedRoadId = searchItem.id;
  } else if (queryItem?.type === 'road') {
    selectedRoadId = queryItem.id;
  }

  useEffect(() => {
    if (!map) return;
    Object.entries(siteMarkersRef.current).forEach(([id, marker]) => {
      const isSelectedFromSearch = searchItem?.type === 'site' && String(searchItem.id) === String(id);
      const isSelectedFromQuery = queryItem?.type === 'site' && String(queryItem.id) === String(id);
      if (isSelectedFromSearch || isSelectedFromQuery) {
        marker.setIcon(highlightedSiteIcon);
      } else {
        const feature = (marker as L.Marker & { feature?: { properties?: { siteType?: string } } }).feature;
        const icon = feature?.properties?.siteType
          ? getSiteIcon(feature.properties.siteType)
          : siteIcon;
        marker.setIcon(icon);
      }
    });
  }, [searchItem, queryItem, map, siteMarkersRef]);

  const clickZoomSite = (e: LeafletMouseEvent) => {
    const marker = e.target as L.Marker;
    const x = map.getPixelBounds().getSize().x;
    const bounds = L.latLngBounds([marker.getLatLng()]);
    let pad: { bottomRight: [number, number]; topLeft: [number, number] };
    if (x > 800) pad = { bottomRight: [400, 10], topLeft: [0, 10] };
    else if (x > 600) pad = { bottomRight: [150, 5], topLeft: [0, 5] };
    else pad = { bottomRight: [10, 250], topLeft: [10, 10] }; // Mobile: account for 50vh infocard
    map.fitBounds(bounds, { paddingBottomRight: pad.bottomRight, paddingTopLeft: pad.topLeft, maxZoom: 14 });
  };

  const clickZoomRoad = (layer: L.Path) => {
    const bounds = (layer as unknown as L.Polyline).getBounds();
    const x = map.getPixelBounds().getSize().x;
    let pad: { bottomRight: [number, number]; topLeft: [number, number] };
    if (x > 800) pad = { bottomRight: [400, 10], topLeft: [0, 10] };
    else if (x > 600) pad = { bottomRight: [150, 5], topLeft: [0, 5] };
    else pad = { bottomRight: [10, 250], topLeft: [10, 10] }; // Increased bottom padding for mobile infocard
    map.fitBounds(bounds, { paddingBottomRight: pad.bottomRight, paddingTopLeft: pad.topLeft });
  };

  const zoomToPlace = useCallback((type: string, id: string | number) => {
    if (!map) return;
    const x = map.getPixelBounds().getSize().x;
    let pad: { bottomRight: [number, number]; topLeft: [number, number] };
    if (x > 800) pad = { bottomRight: [400, 10], topLeft: [0, 10] };
    else if (x > 600) pad = { bottomRight: [150, 5], topLeft: [0, 5] };
    else pad = { bottomRight: [10, 250], topLeft: [10, 10] };

    if (type === 'site') {
      const marker = siteMarkersRef.current[id];
      if (!marker) return;
      const bounds = L.latLngBounds([marker.getLatLng()]);
      map.fitBounds(bounds, { paddingBottomRight: pad.bottomRight, paddingTopLeft: pad.topLeft, maxZoom: 14 });
    } else if (type === 'road') {
      const roadLayer = roadLayersRef.current[id];
      if (!roadLayer || !('getBounds' in roadLayer)) return;
      const bounds = (roadLayer as unknown as L.Polyline).getBounds();
      map.fitBounds(bounds, { paddingBottomRight: pad.bottomRight, paddingTopLeft: pad.topLeft });
    }
  }, [map, siteMarkersRef, roadLayersRef]);

  const clickSite = (e: LeafletMouseEvent) => {
    const id = (e.sourceTarget as L.Marker & { feature?: { properties?: { id?: string | number } } })
      .feature?.properties?.id;
    setSearchItem({ type: 'site', id: id ?? '' });
    clickZoomSite(e);
    setTimeout(() => setShowInfoCard(true), 100);
  };

  const clickRoad = (e: LeafletMouseEvent) => {
    const id = (e.target as L.Path & { feature?: { properties?: { id?: string | number } } })
      .feature?.properties?.id;
    setSearchItem({ type: 'road', id: id ?? '' });
    clickZoomRoad(e.target as L.Path);
    setShowInfoCard(true);
  };

  // Auto-zoom when queryItem is set (from SiteInfo/RoadInfo pages)
  useEffect(() => {
    if (!map || !queryItem || queryItem.id === '') return;

    let retryCount = 0;
    const maxRetries = 10; // Max 1 second of retries (10 * 100ms)

    const attemptZoom = () => {
      if (queryItem.type === 'site') {
        if (siteMarkersRef.current[queryItem.id]) {
          zoomToPlace(queryItem.type, queryItem.id);
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(attemptZoom, 100);
        }
      } else if (queryItem.type === 'road') {
        if (roadLayersRef.current[queryItem.id]) {
          zoomToPlace(queryItem.type, queryItem.id);
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(attemptZoom, 100);
        }
      }
    };

    // Wait initial delay for GeoJSON layers to render, then attempt zoom with retry
    const delayedZoom = setTimeout(attemptZoom, 300);

    return () => clearTimeout(delayedZoom);
  }, [queryItem, map, siteMarkersRef, roadLayersRef, zoomToPlace]);

  return (
    <>
       <LayersControl position="topleft" collapsed={true}>
         <LayersControl.BaseLayer checked name="Positron Modern Topographical">
           <TileLayer
             attribution=" OpenStreetMap contributors,  CartoDB"
             url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
           />
         </LayersControl.BaseLayer>
         <LayersControl.BaseLayer name="Open Street Map Topographical">
           <TileLayer
             attribution=" OpenStreetMap"
             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
           />
         </LayersControl.BaseLayer>
         <LayersControl.BaseLayer name="Satellite">
           <TileLayer
             attribution="Tiles  Esri"
             url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
           />
         </LayersControl.BaseLayer>
         <LayersControl.BaseLayer name="1801–1828: Kartenaufnahme der Rheinlande">
           <WMSTileLayer url="https://www.wms.nrw.de/geobasis/wms_nw_tranchot?" layers="nw_tranchot" />
         </LayersControl.BaseLayer>
         <LayersControl.BaseLayer name="1836–1850: Preuische Kartenaufnahme">
           <WMSTileLayer url="https://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?" layers="nw_uraufnahme_rw" />
         </LayersControl.BaseLayer>
         <LayersControl.BaseLayer name="1891–1912: Preuische Kartenaufnahme">
           <WMSTileLayer url="https://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?" layers="nw_neuaufnahme" />
        </LayersControl.BaseLayer>

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

