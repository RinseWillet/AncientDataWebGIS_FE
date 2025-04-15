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
            data={roadData}
            style={(feature) => {
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

// import { useMap, GeoJSON, TileLayer, useMapEvent, LayersControl, ScaleControl, WMSTileLayer } from 'react-leaflet';
// import {
//   notShowRoad, possibleRoad, road, histRec, hypotheticalRoute,
//   castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon,
//   watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon,
//   settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon,
//   sanctuaryIcon, mileStoneIcon, highlightedSiteIcon
// } from './Styles/MarkerStyles';
// import './MapContent.css';
// import 'leaflet-draw';
// import 'leaflet-draw/dist/leaflet.draw.css';
// import GeometryEditor from '../GeometryEditor/GeometryEditor';
// import { useRef, useEffect } from 'react';

// const MapContent = ({ siteData, roadData, setShowInfoCard, setSearchItem, queryItem, searchItem, isEditing, geometry, onGeometryChange, siteMarkersRef }) => {
//   const map = useMap();
//   const selectedId = searchItem?.type === "road" ? searchItem.id : queryItem?.type === "road" ? queryItem.id : null;
//   const { type, id } = queryItem || {};

//   useEffect(() => {
//     if (!map) return;
  
//     map.eachLayer(layer => {
//       if (layer.feature?.properties?.id && layer instanceof L.Marker) {
//         const id = layer.feature.properties.id;
  
//         if (searchItem?.type === "site" && searchItem?.id == id) {
//           layer.setIcon(highlightedSiteIcon);
//         } else if (layer.feature.geometry?.type === "Point") {
//           const latlng = layer.getLatLng();
//           const icon = siteStyleDifferentiator(layer.feature.properties, latlng)?.options?.icon || siteIcon;
//           layer.setIcon(icon);
//         }
//       }
//     });
//   }, [searchItem, map]);

//   const siteStyleDifferentiator = (siteProperties, latlng) => {
//     const iconMap = {
//       'castellum': castellumIcon,
//       'pos_castellum': possibleCastellumIcon,
//       'legfort': legionaryFortIcon,
//       'watchtower': watchtowerIcon,
//       'city': cityIcon,
//       'cem': cemeteryIcon,
//       'ptum': tumulusIcon,
//       'tum': tumulusIcon,
//       'villa': villaIcon,
//       'pvilla': possibleVillaIcon,
//       'sett': settlementIcon,
//       'settS': settlementStoneIcon,
//       'sanctuary': sanctuaryIcon,
//       'ship': shipIcon,
//       'pship': possibleShipIcon,
//       'site': siteIcon,
//       'milestone': mileStoneIcon,
//     };

//     const icon = iconMap[siteProperties.siteType];
//     return icon ? new L.Marker(latlng, { icon, alt: siteProperties.name }) : null;
//   };

//   const roadStyleDifferentiator = (roadProperties) => {
//     switch (roadProperties.type) {
//       case 'possible road': return possibleRoad;
//       case 'hypothetical route': return hypotheticalRoute;
//       case 'road': return road;
//       case 'hist_rec': return histRec;
//       default: return notShowRoad;
//     }
//   };

//   const clickZoomSite = (e) => {
//     const { lat, lng } = e.target.getLatLng();
//     const xScreen = map.getPixelBounds().getSize().x;
//     const lngOffset = xScreen > 800 ? 0.01 : xScreen > 600 ? 0.005 : xScreen > 400 ? 0.00025 : 0;
//     map.setView([lat, lng + lngOffset], 14);
//   };

//   const clickZoomRoad = (road) => {
//     const bounds = road.getBounds();
//     const xScreen = map.getPixelBounds().getSize().x;
//     const padding = xScreen > 800
//       ? { bottomRight: [400, 10], topLeft: [0, 10] }
//       : xScreen > 600
//         ? { bottomRight: [150, 5], topLeft: [0, 5] }
//         : xScreen > 400
//           ? { bottomRight: [100, 3], topLeft: [0, 3] }
//           : { bottomRight: [10, 20], topLeft: [10, 10] };
//     map.fitBounds(bounds, { paddingBottomRight: padding.bottomRight, paddingTopLeft: padding.topLeft });
//   };

//   const clickSite = (e) => {
//     const id = e.sourceTarget.feature.properties.id;
//     setSearchItem({ type: "site", id });
//     clickZoomSite(e);

//     // Set icon highlight manually
//     if (siteMarkersRef.current[id]) {
//       siteMarkersRef.current[id].setIcon(highlightedSiteIcon);
//     }

//     setTimeout(() => setShowInfoCard(true), 100);
//   };

//   const clickRoad = (e) => {
//     const id = e.target.feature.properties.id;
//     setSearchItem({ type: "road", id });
//     clickZoomRoad(e.target);
//     setShowInfoCard(true);
//   };

//   return (
//     <>
//       <LayersControl position="topleft" collapsed={true}>
//         <LayersControl.BaseLayer checked name="Positron Modern Topographical">
//           <TileLayer attribution="© OpenStreetMap contributors, © CartoDB" url="http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="Open Street Map Topographical">
//           <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="Satellite">
//           <TileLayer attribution="Tiles © Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="1801–1828: Kartenaufnahme der Rheinlande">
//           <WMSTileLayer url="http://www.wms.nrw.de/geobasis/wms_nw_tranchot?" layers="nw_tranchot" />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="1836–1850: Preußische Kartenaufnahme">
//           <WMSTileLayer url="http://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?" layers="nw_uraufnahme_rw" />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="1891–1912: Preußische Kartenaufnahme">
//           <WMSTileLayer url="http://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?" layers="nw_neuaufnahme" />
//         </LayersControl.BaseLayer>

//         <LayersControl.Overlay checked name="Archaeological Sites">
//           <GeoJSON
//             data={siteData}
//             pointToLayer={(feature, latlng) => {
//               const marker = siteStyleDifferentiator(feature.properties, latlng);
//               return marker || new L.Marker(latlng, { icon: siteIcon });
//             }}
//             onEachFeature={(feature, layer) => {
//               const id = feature.properties.id;
            
//               // Set icon initially
//               const latlng = layer.getLatLng();
//               const markerIcon = searchItem?.type === "site" && searchItem?.id == id
//                 ? highlightedSiteIcon
//                 : siteStyleDifferentiator(feature.properties, latlng)?.options?.icon || siteIcon;
//               layer.setIcon(markerIcon);
            
//               // Handle click
//               layer.on({
//                 click: (e) => {
//                   setSearchItem({ type: "site", id });
//                   clickZoomSite(e);                  
//                   setShowInfoCard(true);                  
//                 },
//               });
//             }}
//           />
//         </LayersControl.Overlay>

//         <LayersControl.Overlay checked name="Roads and Routes">
//           <GeoJSON           
//             data={roadData}
//             style={(feature) => {
//               const isSelected = String(feature.properties.id) === String(selectedId);
//               return isSelected ? { weight: 3, color: "yellow", zIndex: 20 } : roadStyleDifferentiator(feature.properties);
//             }}
//             onEachFeature={(feature, layer) => {
//               if (type === "road" && id == feature.properties.id) {
//                 map.fitBounds(layer.getBounds());
//               }
//               layer.on({ click: clickRoad });
//             }}
//           />
//         </LayersControl.Overlay>
//       </LayersControl>

//       {isEditing && (
//         <GeometryEditor
//           geometry={geometry}
//           onGeometryChange={onGeometryChange}
//           isEditing={isEditing}
//         />
//       )}
//       <ScaleControl position="bottomleft" />
//     </>
//   );
// };

// export default MapContent;
// import { useMap, GeoJSON, TileLayer, useMapEvent, LayersControl, ScaleControl, WMSTileLayer } from 'react-leaflet';
// import {
//   notShowRoad, possibleRoad, road, histRec, hypotheticalRoute,
//   castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon,
//   watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon,
//   settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon,
//   sanctuaryIcon, mileStoneIcon, highlightedSiteIcon
// } from './Styles/MarkerStyles';
// import './MapContent.css';
// import 'leaflet-draw';
// import 'leaflet-draw/dist/leaflet.draw.css';
// import GeometryEditor from '../GeometryEditor/GeometryEditor'
// import { useRef } from 'react';


// const MapContent = ({ siteData, roadData, setShowInfoCard, setSearchItem, queryItem, searchItem, isEditing, geometry, onGeometryChange }) => {
//   const map = useMap();

//   const selectedId =
//     searchItem?.type === "road" ? searchItem.id :
//       queryItem?.type === "road" ? queryItem.id :
//         null;
//   const { type, id } = queryItem || {};

//   useMapEvent('popupclose', () => {
//     if (!isPopupOpening.current) {
//       setShowInfoCard(false);
//     }
//   });

//   const queryIcon = L.divIcon({
//     className: 'custom-div-icon',
//     html: "<div class='marker-pin'></div><i class='material-icons'></i><div class='pulse'></div>",
//     iconSize: [30, 42],
//     iconAnchor: [15, 42]
//   });

//   const siteStyleDifferentiator = (siteProperties, latlng) => {
//     const iconMap = {
//       'castellum': castellumIcon,
//       'pos_castellum': possibleCastellumIcon,
//       'legfort': legionaryFortIcon,
//       'watchtower': watchtowerIcon,
//       'city': cityIcon,
//       'cem': cemeteryIcon,
//       'ptum': tumulusIcon,
//       'tum': tumulusIcon,
//       'villa': villaIcon,
//       'pvilla': possibleVillaIcon,
//       'sett': settlementIcon,
//       'settS': settlementStoneIcon,
//       'sanctuary': sanctuaryIcon,
//       'ship': shipIcon,
//       'pship': possibleShipIcon,
//       'site': siteIcon,
//       'milestone': mileStoneIcon,
//     };

//     const icon = iconMap[siteProperties.siteType];
//     return icon ? new L.Marker(latlng, { icon, alt: siteProperties.name }) : null;
//   };

//   const roadStyleDifferentiator = (roadProperties) => {
//     switch (roadProperties.type) {
//       case 'possible road': return possibleRoad;
//       case 'hypothetical route': return hypotheticalRoute;
//       case 'road': return road;
//       case 'hist_rec': return histRec;
//       default: return notShowRoad;
//     }
//   };

//   const clickZoomSite = (e) => {
//     const { lat, lng } = e.target.getLatLng();
//     const xScreen = map.getPixelBounds().getSize().x;
//     const lngOffset = xScreen > 800 ? 0.01 : xScreen > 600 ? 0.005 : xScreen > 400 ? 0.00025 : 0;
//     map.setView([lat, lng + lngOffset], 14);
//   };

//   const clickZoomRoad = (road) => {
//     const bounds = road.getBounds();
//     const xScreen = map.getPixelBounds().getSize().x;

//     const padding = xScreen > 800
//       ? { bottomRight: [400, 10], topLeft: [0, 10] }
//       : xScreen > 600
//         ? { bottomRight: [150, 5], topLeft: [0, 5] }
//         : xScreen > 400
//           ? { bottomRight: [100, 3], topLeft: [0, 3] }
//           : { bottomRight: [10, 20], topLeft: [10, 10] };

//     map.fitBounds(bounds, {
//       paddingBottomRight: padding.bottomRight,
//       paddingTopLeft: padding.topLeft,
//     });
//   };

//   const clickSite = (e) => {
//     setSearchItem({ type: "site", id: e.sourceTarget.feature.properties.id });
//     clickZoomSite(e);

//     setTimeout(() => {
//       setShowInfoCard(true);
//     }, 100);
//   };

//   const clickRoad = (e) => {
//     const layer = e.target;

//     setSearchItem({ type: "road", id: layer.feature.properties.id });
//     clickZoomRoad(layer);

//     setTimeout(() => {
//       setShowInfoCard(true);
//     }, 100);
//   };

//   const resetHighlightRoad = (e) => {
//     const style = roadStyleDifferentiator(e.target.feature.properties);
//     e.target.setStyle(style);
//   };

//   return (
//     <>
//       <LayersControl position="topleft" collapsed={true}>
//         <LayersControl.BaseLayer checked name="Positron Modern Topographical">
//           <TileLayer
//             attribution="© OpenStreetMap contributors, © CartoDB"
//             url="http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
//           />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="Open Street Map Topographical">
//           <TileLayer
//             attribution="© OpenStreetMap"
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="Satellite">
//           <TileLayer
//             attribution="Tiles © Esri"
//             url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
//           />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="1801–1828: Kartenaufnahme der Rheinlande">
//           <WMSTileLayer
//             url="http://www.wms.nrw.de/geobasis/wms_nw_tranchot?"
//             layers="nw_tranchot"
//           />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="1836–1850: Preußische Kartenaufnahme">
//           <WMSTileLayer
//             url="http://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?"
//             layers="nw_uraufnahme_rw"
//           />
//         </LayersControl.BaseLayer>

//         <LayersControl.BaseLayer name="1891–1912: Preußische Kartenaufnahme">
//           <WMSTileLayer
//             url="http://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?"
//             layers="nw_neuaufnahme"
//           />
//         </LayersControl.BaseLayer>

//         <LayersControl.Overlay checked name="Archaeological Sites">
//           <GeoJSON
//             key={`site-layer-${searchItem?.type === "site" ? searchItem.id : "none"}`}
//             data={siteData}
//             pointToLayer={(feature, latlng) => {
//               const isSelected =
//                 (type === "site" && id == feature.properties.id) ||
//                 (searchItem?.type === "site" && searchItem?.id == feature.properties.id);
            
//               const defaultMarker = siteStyleDifferentiator(feature.properties, latlng);
//               const icon = isSelected
//                 ? highlightedSiteIcon
//                 : defaultMarker?.options?.icon || siteIcon;
            
//               return new L.Marker(latlng, { icon, alt: feature.properties.name });
//             }}
//             onEachFeature={(feature, layer) => {
//               if (type === "site" && id == feature.properties.id) {
//                 map.setView(layer.getLatLng(), 14);
//               }
//               layer.on({
//                 click: clickSite,
//               });
//             }}
//           />
//         </LayersControl.Overlay>

//         <LayersControl.Overlay checked name="Roads and Routes">
//           <GeoJSON
//             key={`road-layer-${selectedId}`}
//             data={roadData}
//             style={(feature) => {
//               const isSelected = String(feature.properties.id) === String(selectedId);
//               return isSelected
//                 ? { weight: 3, color: "yellow", zIndex: 20 }
//                 : roadStyleDifferentiator(feature.properties);
//             }}
//             onEachFeature={(feature, layer) => {

//               if (type === "road" && id == feature.properties.id) {
//                 map.fitBounds(layer.getBounds());
//               }

//               layer.on({
//                 click: clickRoad,
//               });
//             }}
//           />
//         </LayersControl.Overlay>
//       </LayersControl>
//       {isEditing && (
//         <GeometryEditor
//           geometry={geometry}
//           onGeometryChange={onGeometryChange}
//           isEditing={isEditing}
//         />
//       )}
//       <ScaleControl position="bottomleft" />
//     </>
//   );
// };

// export default MapContent;