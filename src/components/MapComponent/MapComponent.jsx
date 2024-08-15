// MapComponent.js
import React, { useState, useEffect, useRef } from 'react';
import MapBuilder from './MapBuilder';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const position = [51.8, 5.8]

const MapComponent = () => {             
    
    return (
        <>
            <div className="atlas">
                <MapContainer id="map" center={position} zoom={9} style={{
                    height: '75vh',
                    width: '100%'
                }}>
                    <MapBuilder />
                </MapContainer>
            </div>
        </>
    );
}

export default MapComponent;