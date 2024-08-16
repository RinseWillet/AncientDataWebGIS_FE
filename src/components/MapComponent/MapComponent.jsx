// MapComponent.js
import React, { useState, useEffect } from 'react';
import MapBuilder from './MapBuilder';
import MapInfoCard from './MapInfoCard';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';

const position = [51.8, 5.8]

const MapComponent = () => {
    
    const [map, setMap] = useState(null);
    const [showInfoCard, setShowInfoCard] = useState(false);
    const [searchItem, setSearchItem] = useState({
        type: "",
        id: ""
    });

    useEffect(() => {       
        if (!map) return;

        const ref = infoRef.current.offsetWidth;

        const visibleMarkers = [];
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                visibleMarkers.push(layer);
            }
        });

        const featureGroup = L.featureGroup(visibleMarkers).getBounds();        

        function handleResize() {
            map.fitBounds(featureGroup, {
                paddingTopLeft: [ref + 10, 10],
            });
        }

        handleResize();

        window.addEventListener("resize", handleResize);

        return (_) => {
            window.removeEventListener("resize", handleResize);
        };
        
    }, [map, showInfoCard]);

    // map.onPopupClose(console.log("sluiten hiero"));

    return (
        <>
            <div className="wrapper">
                {showInfoCard ? 
                <MapInfoCard searchItem={searchItem}/> : null }
                <MapContainer id="map" className='infoMap'
                    whenCreated={setMap}
                    center={position}
                    zoom={9}
                    zoomControl={false}                    
                >
                    <MapBuilder setShowInfoCard={setShowInfoCard} setSearchItem={setSearchItem}/>
                </MapContainer>
            </div>
        </>
    );
}

export default MapComponent;