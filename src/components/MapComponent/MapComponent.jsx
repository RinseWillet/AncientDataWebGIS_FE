import React, { useState, useEffect, useRef } from 'react';
import MapBuilder from './MapBuilder';
import MapInfoCard from './MapInfoCard';
import { MapContainer } from 'react-leaflet';
import { siteIcon } from './Styles/MarkerStyles';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './MapComponent.css';

const position = [51.8, 5.8];

const MapComponent = ({
  queryItem,
  adjustMapHeight,
  isEditing = false,
  geometry = null,
  onGeometryChange = () => {}
}) => {
  const [map, setMap] = useState(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [searchItem, setSearchItem] = useState({ type: "", id: "" });

  const siteMarkersRef = useRef({});

  const clearSelection = () => {
    if (searchItem.type === "site") {
      const marker = siteMarkersRef.current[searchItem.id];
      if (marker) {
        marker.setIcon(siteIcon); // Reset to default icon
      }
    }

    setSearchItem({ type: "", id: "" });
    setShowInfoCard(false);
  };

  useEffect(() => {
    if (!map) return;

    const visibleMarkers = [];

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        visibleMarkers.push(layer);
      }
    });

    if (visibleMarkers.length === 0) return;

    const featureGroup = L.featureGroup(visibleMarkers).getBounds();

    const handleResize = () => {
      map.fitBounds(featureGroup, {
        paddingTopLeft: [300, 10],
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return (
    <div>
      <MapContainer
        id="map"
        className={adjustMapHeight ? "infoMap_adjusted" : "infoMap"}
        whenCreated={setMap}
        center={position}
        zoom={9}
        zoomControl={false}
        tapTolerance={30}
      >
        {showInfoCard && (
          <MapInfoCard
            searchItem={searchItem}
            clearSelection={clearSelection}
          />
        )}

        <MapBuilder
          setShowInfoCard={setShowInfoCard}
          setSearchItem={setSearchItem}
          queryItem={queryItem}
          searchItem={searchItem}
          isEditing={isEditing}
          geometry={geometry}
          onGeometryChange={onGeometryChange}
          siteMarkersRef={siteMarkersRef}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;