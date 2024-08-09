import { useEffect } from "react";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import OSM from 'ol/source/OSM';
import { fromLonLat } from "ol/proj";
import 'ol/ol.css';

const MapBuilder = ({sites, roads}) => {

    


    if (Array.isArray(sites) && Array.isArray(roads)) {
        console.log("data nog niet daar");
        return ( <p> Your data is loading </p>);       
    } else {
        console.log("data is daar");
        console.log(sites);
        useEffect(() => {

            const vectorSourceSites = new VectorSource({
                url: geojsonObject,
                format: new GeoJSON()
            });
              
            const vectorLayerSites = new VectorLayer({
                source: vectorSourceSites,
            });

            const osmLayer = new TileLayer({
                preload: Infinity,
                source: new OSM(),
            })
            console.log(vectorLayerSites);
    
            const map = new Map({
                target: "map",
                layers: [osmLayer],
                view: new View({
                    center: fromLonLat([5.8, 51.8]),
                    zoom: 9,
                  }),
              });
          return () => map.setTarget(null)
        }, []);
    
        return (
            <div style={{position: 'relative', height:'400px',width:'100%'}} id="map" className="map-container" />
        );       
    }  
}

export default MapBuilder;

const geojsonObject = 
    {
        'type': 'Feature',
        'geometry': {
          'type': 'MultiLineString',
          'coordinates': [
            [
              [-1e6, -7.5e5],
              [-1e6, 7.5e5],
            ],
            [
              [1e6, -7.5e5],
              [1e6, 7.5e5],
            ],
            [
              [-7.5e5, -1e6],
              [7.5e5, -1e6],
            ],
            [
              [-7.5e5, 1e6],
              [7.5e5, 1e6],
            ],
          ],
        }
}