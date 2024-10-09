// MapComponent.js
import React, { useState, useEffect } from 'react';
import MapBuilder from './MapBuilder';
import MapInfoCard from './MapInfoCard';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';

const position = [51.8, 5.8]

const MapComponent = (queryItem, adjustMapHeight) => {

    //standard hook state fpr the Leaflet Map
    const [map, setMap] = useState(null);

    //boolean hook state that switched the height of the map in css, when a Back Button
    //is rendered
    // const [adjustMapHeight, setAdjustMapHeight] = useState(true);

    //boolean hook state to render (or not) the MapInfoCard component
    const [showInfoCard, setShowInfoCard] = useState(false);

    //hook to pass a searchItem from MapContent towards MapInfoCard
    const [searchItem, setSearchItem] = useState({
        type: "",
        id: ""
    });

    useEffect(() => {  

        console.log(adjustMapHeight);

        if (!map) return;

        //code dealing with handling resizing of the map

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

    }, [map]);

    // {`infoMap ${adjustMapHeight.adjustMapHeight ? "": "adjusted"}`}
    return (  
        <div>          
            <MapContainer id="map" className="infoMap"
                whenCreated={setMap}
                center={position}
                zoom={9}
                zoomControl={false}
                adjustMapHeight={adjustMapHeight}
                tapTolerance={30}
            >
                {showInfoCard ? <MapInfoCard searchItem={searchItem} /> : null}
                <MapBuilder setShowInfoCard={setShowInfoCard} setSearchItem={setSearchItem} queryItem={queryItem} />
            </MapContainer>
        </div>                   
    );
}

export default MapComponent;