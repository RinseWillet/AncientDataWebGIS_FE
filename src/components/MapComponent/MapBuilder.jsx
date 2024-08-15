//React
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

//Services
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';

//Leaflet mapping library
import { MapContainer, TileLayer, LayerGroup, GeoJSON, useMapEvent,useMap } from 'react-leaflet';
import L from 'leaflet';

//style
import 'leaflet/dist/leaflet.css';
import { popUpStyle, possibleRoad, hypotheticalRoute, road, histRec, castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon, watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon, settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon, sanctuaryIcon } from './Styles/markerStyles';
import MapContent from "./MapContent";

const MapBuilder = () => {

  const mapRef=useMap();

  const [siteData, setSiteData] = useState([]);
  const [roadData, setRoadData] = useState([]);


  //loading site and road data from API
  useEffect(() => {
    async function LoadAllData() {

      SiteService
        .findAllGeoJson()
        .then((response) => {
          setSiteData(response.data);
        })
        .catch((error) => {
          console.error(error);
        })

      RoadService
        .findAllGeoJson()
        .then((response) => {
          setRoadData(response.data)
        })
        .catch((error) => {
          console.error(error)
        })
    }
    LoadAllData();
  }, []); 

  //renders map only if the data is filled after apicall
  if (roadData.length < 1) {
    return (
      <p>Loading</p>
    )
  } else {
    return (
      <>      
            <MapContent siteData={siteData} roadData={roadData}/>           
      </>
    )
  }
}

export default MapBuilder;

