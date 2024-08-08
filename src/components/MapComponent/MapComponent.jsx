// MapComponent.js
import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import {OGCMapTile} from 'ol/source.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import 'ol/ol.css';
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';

const MapComponent = () => {

      //to set the state of the data from apicall to backend
    const [data, setData] = useState([]);
    const [data1, setData1] = useState([]);


    useEffect(() => {
        function LoadAllData() {
            SiteService
            .findAllGeoJson()
            .then((response) => {
                setData(response.data)
            })
            .catch((error) => {
                console.log(error);
            })

            RoadService
            .findAllGeoJson()
            .then((response) => {
                setData1(response.data)
            })
            .catch((error) => {
                console.log(error)
            })
        }
        LoadAllData();

        const rasterLayer = new TileLayer({          
            source: new OGCMapTile({
                url:'https://maps.gnosis.earth/ogcapi/collections/NaturalEarth:raster:HYP_HR_SR_OB_DR/map/tiles/WebMercatorQuad',
                crossOrigin: '',
            }),
        })

        const map = new Map({
            target: "map",
            layers: [rasterLayer],
            view: new View({
                center: [0, 0],
                zoom: 0,
              }),
        });


    return () => map.setTarget(null)
    }, []);

    return (
        <>
            <div style={{height:'35rem',width:'100%'}} id="map" className="map-container" />
        </>      
    );
}

export default MapComponent;