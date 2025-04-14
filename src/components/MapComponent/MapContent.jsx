import { useMap, GeoJSON, TileLayer, useMapEvent, LayersControl, ScaleControl, WMSTileLayer } from 'react-leaflet';
import { useState } from 'react';
import {
  notShowRoad, possibleRoad, road, histRec, hypotheticalRoute,
  castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon,
  watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon,
  settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon,
  sanctuaryIcon, mileStoneIcon
} from './Styles/MarkerStyles';
import './MapContent.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import GeometryEditor from '../GeometryEditor/GeometryEditor'

const MapContent = ({ siteData, roadData, setShowInfoCard, setSearchItem, queryItem, isEditing, geometry, onGeometryChange }) => {
  const map = useMap();
  const [selectedRoadId, setSelectedRoadId] = useState(null);
  const { type, id } = queryItem || {};

  useMapEvent('popupclose', () => {
    setShowInfoCard(false);
  });

  const queryIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div class='marker-pin'></div><i class='material-icons'></i><div class='pulse'></div>",
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });

  const siteStyleDifferentiator = (siteProperties, latlng) => {
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

    const icon = iconMap[siteProperties.siteType];
    return icon ? new L.Marker(latlng, { icon, alt: siteProperties.name }) : null;
  };

  const roadStyleDifferentiator = (roadProperties) => {
    switch (roadProperties.type) {
      case 'possible road': return possibleRoad;
      case 'hypothetical route': return hypotheticalRoute;
      case 'road': return road;
      case 'hist_rec': return histRec;
      default: return notShowRoad;
    }
  };

  const createPopupTextSite = (properties) => `<b>Name : ${properties.name}</b>`;

  const clickZoomSite = (e) => {
    const { lat, lng } = e.target.getLatLng();
    const xScreen = map.getPixelBounds().getSize().x;
    const lngOffset = xScreen > 800 ? 0.01 : xScreen > 600 ? 0.005 : xScreen > 400 ? 0.00025 : 0;
    map.setView([lat, lng + lngOffset], 14);
  };

  const clickZoomRoad = (road) => {
    const bounds = road.getBounds();
    const xScreen = map.getPixelBounds().getSize().x;

    const padding = xScreen > 800
      ? { bottomRight: [400, 10], topLeft: [0, 10] }
      : xScreen > 600
        ? { bottomRight: [150, 5], topLeft: [0, 5] }
        : xScreen > 400
          ? { bottomRight: [100, 3], topLeft: [0, 3] }
          : { bottomRight: [10, 20], topLeft: [10, 10] };

    map.fitBounds(bounds, {
      paddingBottomRight: padding.bottomRight,
      paddingTopLeft: padding.topLeft,
    });
  };

  const clickSite = (e) => {
    setShowInfoCard(true);
    setSearchItem({ type: "site", id: e.sourceTarget.feature.properties.id });
    clickZoomSite(e);
  };

  const clickRoad = (e) => {
    const road = e.target;
    setShowInfoCard(true);
    setSearchItem({ type: "road", id: road.feature.properties.id });
    setSelectedRoadId(road.feature.properties.id);
    clickZoomRoad(road);
  };

  const resetHighlightRoad = (e) => {
    const style = roadStyleDifferentiator(e.target.feature.properties);
    e.target.setStyle(style);
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
              const isQuery = type === "site" && id == feature.properties.id;
              return isQuery
                ? new L.Marker(latlng, { icon: queryIcon, alt: feature.properties.name })
                : siteStyleDifferentiator(feature.properties, latlng);
            }}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(createPopupTextSite(feature.properties), { className: 'popup' });
              if (type === "site" && id == feature.properties.id) {
                map.setView(layer.getLatLng(), 14);
              }
              layer.on({ click: clickSite });
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Roads and Routes">
          <GeoJSON
            data={roadData}
            style={(feature) => {
              const isSelected =
                feature.properties.id === selectedRoadId ||
                (type === "road" && id == feature.properties.id);

              return isSelected
                ? { weight: 3, color: "yellow", zIndex: 20 }
                : roadStyleDifferentiator(feature.properties);
            }}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(createPopupTextSite(feature.properties), { className: 'popup' });

              if (type === "road" && id == feature.properties.id) {
                map.fitBounds(layer.getBounds());
              }

              layer.on({
                click: clickRoad,
                popupclose: resetHighlightRoad,
              });
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