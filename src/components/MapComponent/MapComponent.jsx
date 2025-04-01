import React, { useState, useEffect } from 'react';
import MapBuilder from './MapBuilder';
import MapInfoCard from './MapInfoCard';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';

const position = [51.8, 5.8];

const MapComponent = ({ queryItem, adjustMapHeight }) => {
  const [map, setMap] = useState(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [searchItem, setSearchItem] = useState({ type: "", id: "" });

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
        paddingTopLeft: [300, 10], // Adjust as needed
      });
    };

    handleResize(); // Initial adjustment
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
        {showInfoCard && <MapInfoCard searchItem={searchItem} />}
        <MapBuilder
          setShowInfoCard={setShowInfoCard}
          setSearchItem={setSearchItem}
          queryItem={queryItem}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;