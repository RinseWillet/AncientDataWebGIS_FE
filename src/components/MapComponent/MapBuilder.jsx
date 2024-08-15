//React
import { useEffect, useState } from "react";

//Services
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';
import MapContent from "./MapContent";

//style
import 'leaflet/dist/leaflet.css';


const MapBuilder = () => {

  const [siteData, setSiteData] = useState([]);
  const [roadData, setRoadData] = useState([]);

  //loading site and road data from
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

