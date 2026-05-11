import { GeoJSON, LayersControl, ScaleControl, TileLayer, useMap, WMSTileLayer } from 'react-leaflet';
import L, { Icon, DivIcon, PathOptions, LeafletMouseEvent, LeafletEventHandlerFn } from 'leaflet';
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
import { useEffect, MutableRefObject } from 'react';

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

  let selectedRoadId: string | number | null = null;
  if (searchItem?.type === 'road') {
    selectedRoadId = searchItem.id;
  } else if (queryItem?.type === 'road') {
    selectedRoadId = queryItem.id;
  }

  useEffect(() => {
    if (!map) return;
    Object.entries(siteMarkersRef.current).forEach(([id, marker]) => {
      if (searchItem?.type === 'site' && String(searchItem.id) === String(id)) {
        marker.setIcon(highlightedSiteIcon);
      } else {
        const feature = (marker as L.Marker & { feature?: { properties?: { siteType?: string } } }).feature;
        const icon = feature?.properties?.siteType
          ? getSiteIcon(feature.properties.siteType)
          : siteIcon;
        marker.setIcon(icon);
      }
    });
  }, [searchItem, map, siteMarkersRef]);

  const clickZoomSite = (e: LeafletMouseEvent) => {
    const { lat, lng } = e.target.getLatLng();
    const x = map.getPixelBounds().getSize().x;
    let offset = 0;
    if (x > 800) offset = 0.01;
    else if (x > 600) offset = 0.005;
    else if (x > 400) offset = 0.00025;
    map.setView([lat, lng + offset], 14);
  };

  const clickZoomRoad = (layer: L.Path) => {
    const bounds = (layer as unknown as L.Polyline).getBounds();
    const x = map.getPixelBounds().getSize().x;
    let pad: { bottomRight: [number, number]; topLeft: [number, number] };
    if (x > 800) pad = { bottomRight: [400, 10], topLeft: [0, 10] };
    else if (x > 600) pad = { bottomRight: [150, 5], topLeft: [0, 5] };
    else if (x > 400) pad = { bottomRight: [100, 3], topLeft: [0, 3] };
    else pad = { bottomRight: [10, 20], topLeft: [10, 10] };
    map.fitBounds(bounds, { paddingBottomRight: pad.bottomRight, paddingTopLeft: pad.topLeft });
  };

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

  return (
    <>
      <LayersControl position="topleft" collapsed={true}>
        <LayersControl.BaseLayer checked name="Positron Modern Topographical">
          <TileLayer
            attribution=" OpenStreetMap contributors,  CartoDB"
            url="http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
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
          <WMSTileLayer url="http://www.wms.nrw.de/geobasis/wms_nw_tranchot?" layers="nw_tranchot" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="1836–1850: Preuische Kartenaufnahme">
          <WMSTileLayer url="http://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?" layers="nw_uraufnahme_rw" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="1891–1912: Preuische Kartenaufnahme">
          <WMSTileLayer url="http://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?" layers="nw_neuaufnahme" />
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
              layer.on({ click: clickSite as LeafletEventHandlerFn });
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
              layer.on({ click: clickRoad as LeafletEventHandlerFn });
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

