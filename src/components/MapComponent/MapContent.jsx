import {
  useMap,
  GeoJSON,
  TileLayer,
  LayersControl,
  ScaleControl,
  WMSTileLayer
} from 'react-leaflet';
import {
  notShowRoad, possibleRoad, road, histRec, hypotheticalRoute,
  castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon,
  watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon,
  settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon,
  sanctuaryIcon, mileStoneIcon, highlightedSiteIcon
} from './Styles/MarkerStyles';
import './MapContent.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import GeometryEditor from '../GeometryEditor/GeometryEditor';
import { useEffect } from 'react';

const MapContent = ({
  siteData,
  roadData,
  setShowInfoCard,
  setSearchItem,
  queryItem,
  searchItem,
  isEditing,
  geometry,
  onGeometryChange,
  siteMarkersRef
}) => {

  console.log("🧭 MapContent received roadData:", roadData);
  console.log("📐 Geometry prop for editing:", geometry);
  const map = useMap();

  const selectedRoadId =
    searchItem?.type === "road" ? searchItem.id :
      queryItem?.type === "road" ? queryItem.id :
        null;

  // Highlight site marker via ref after selection
  useEffect(() => {
    if (!map) return;

    Object.entries(siteMarkersRef.current).forEach(([id, marker]) => {
      if (searchItem?.type === "site" && String(searchItem.id) === String(id)) {
        marker.setIcon(highlightedSiteIcon);
      } else {
        const icon = marker.feature?.properties?.siteType
          ? getSiteIcon(marker.feature.properties.siteType)
          : siteIcon;
        marker.setIcon(icon);
      }
    });
  }, [searchItem, map]);

  useEffect(() => {
    if (!map || !roadData || !queryItem || queryItem.type !== "road") return;

    console.log("📍 useEffect triggered for roadData update");
    console.log("🔍 roadData inside useEffect:", roadData);

    const targetId = String(queryItem.id);

    const geojsonLayer = new L.GeoJSON(roadData);
    geojsonLayer.eachLayer((layer) => {
      const featureId = String(layer.feature?.properties?.id);
      if (featureId === targetId) {
        clickZoomRoad(layer);
      }
    });
  }, [map, roadData, queryItem]);

  const getSiteIcon = (type) => {
    const iconMap = {
      'castellum': castellumIcon,
      'pos_castellum': possibleCastellumIcon,
      'legfort': legionaryFortIcon,
      'watchtower': watchtowerIcon,
      'city': cityIcon,
      'cem': cemeteryIcon,
      'ptum': tumulusIcon,
      'tum': tumulusIcon,
      'villa': villaIcon,
      'pvilla': possibleVillaIcon,
      'sett': settlementIcon,
      'settS': settlementStoneIcon,
      'sanctuary': sanctuaryIcon,
      'ship': shipIcon,
      'pship': possibleShipIcon,
      'site': siteIcon,
      'milestone': mileStoneIcon,
    };
    return iconMap[type] || siteIcon;
  };

  const roadStyleDifferentiator = (props) => {
    switch (props.type) {
      case 'possible road': return possibleRoad;
      case 'hypothetical route': return hypotheticalRoute;
      case 'road': return road;
      case 'hist_rec': return histRec;
      default: return notShowRoad;
    }
  };

  const clickZoomSite = (e) => {
    const { lat, lng } = e.target.getLatLng();
    const x = map.getPixelBounds().getSize().x;
    const offset = x > 800 ? 0.01 : x > 600 ? 0.005 : x > 400 ? 0.00025 : 0;
    map.setView([lat, lng + offset], 14);
  };

  const clickZoomRoad = (layer) => {
    const bounds = layer.getBounds();
    const x = map.getPixelBounds().getSize().x;
    const pad = x > 800
      ? { bottomRight: [400, 10], topLeft: [0, 10] }
      : x > 600
        ? { bottomRight: [150, 5], topLeft: [0, 5] }
        : x > 400
          ? { bottomRight: [100, 3], topLeft: [0, 3] }
          : { bottomRight: [10, 20], topLeft: [10, 10] };
    map.fitBounds(bounds, { paddingBottomRight: pad.bottomRight, paddingTopLeft: pad.topLeft });
  };

  const clickSite = (e) => {
    const id = e.sourceTarget.feature.properties.id;
    setSearchItem({ type: "site", id });
    clickZoomSite(e);
    setTimeout(() => setShowInfoCard(true), 100);
  };

  const clickRoad = (e) => {
    const id = e.target.feature.properties.id;
    setSearchItem({ type: "road", id });
    clickZoomRoad(e.target);
    setShowInfoCard(true);
  };

  return (
    <>
      <LayersControl position="topleft" collapsed={true}>
        <LayersControl.BaseLayer checked name="Positron Modern Topographical">
          <TileLayer
            attribution="© OpenStreetMap contributors, © CartoDB"
            url="http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Open Street Map Topographical">
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution="Tiles © Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="1801–1828: Kartenaufnahme der Rheinlande">
          <WMSTileLayer
            url="http://www.wms.nrw.de/geobasis/wms_nw_tranchot?"
            layers="nw_tranchot"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="1836–1850: Preußische Kartenaufnahme">
          <WMSTileLayer
            url="http://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?"
            layers="nw_uraufnahme_rw"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="1891–1912: Preußische Kartenaufnahme">
          <WMSTileLayer
            url="http://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?"
            layers="nw_neuaufnahme"
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Archaeological Sites">
          <GeoJSON
            data={siteData}
            pointToLayer={(feature, latlng) => {
              const id = feature.properties.id;
              const icon = getSiteIcon(feature.properties.siteType);
              const marker = new L.Marker(latlng, { icon, alt: feature.properties.name });
              marker.feature = feature; // attach feature for later
              siteMarkersRef.current[id] = marker;
              return marker;
            }}
            onEachFeature={(feature, layer) => {
              layer.on({ click: clickSite });
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Roads and Routes">
          <GeoJSON
            key={JSON.stringify(roadData)}
            data={roadData}
            style={(feature) => {
              console.log("🖌 Rendering road feature with ID:", feature.properties.id);
              const isSelected = String(feature.properties.id) === String(selectedRoadId);
              return isSelected
                ? { weight: 3, color: "yellow", zIndex: 20 }
                : roadStyleDifferentiator(feature.properties);
            }}
            onEachFeature={(feature, layer) => {
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