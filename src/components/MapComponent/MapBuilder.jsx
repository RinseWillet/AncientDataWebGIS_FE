//React
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

//Services
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';

//Leaflet mapping library
import { MapContainer, TileLayer, LayerGroup, GeoJSON, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';

//style
import 'leaflet/dist/leaflet.css';
import { popUpStyle, secondaryAgglomerationMarkerStyle, possibleCityMarkerStyle, cityMarkerStyle, possibleRoad, hypotheticalRoute, road, histRec } from './Styles/markerStyles';

const MapBuilder = () => {

  const [siteData, setSiteData] = useState([]);
  const [roadData, setRoadData] = useState([]);

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

  //filters style of sites based on attributes
  const siteStyleDifferentiator = (siteProperties) => {
    if (siteProperties.siteType === 'castellum') {
      return secondaryAgglomerationMarkerStyle;
    } else if (siteProperties.siteType === 'villa') {
      return possibleCityMarkerStyle;
    } else if (siteProperties.siteType === 'pvilla') {
      return cityMarkerStyle;
    }
  }

  //filters style of roads based on attributes
  const roadStyleDifferentiator = (roadProperties) => {
    if (roadProperties.type === 'possible road') {
      console.log("best mogelijk");
      return possibleRoad;
    } else if (roadProperties.type === 'hypothetical route') {
      return hypotheticalRoute;
    } else if (roadProperties.type === 'road') {
      return road;
    } else if (roadProperties.type === 'hist_rec') {
      return histRec;
    }
  }


  //binding popups to points
  // to do: standardize layer-fields
  const createPopupText = (siteData) => {
    let name = siteData.name;
    let status = siteData.status;
    let status_ref = siteData.statusref;
    let province = siteData.province;
    let conventus = siteData.conventus;
    let pleiades = siteData.plid;
    if (pleiades === null) {
      var popup_text = "<b>Name : " + name + "</b><br/>Status : " + status + "<br/>Reference : " + status_ref + "<br/>Assize : " + conventus + "<br/>Province : " + province
    } else {
      var popup_text = "<b>Name : " + name + "</b><br/>Status : " + status + "<br/>Reference : " + status_ref + "<br/>Assize : " + conventus + "<br/>Province : " + province +
        "<br/><a href='https://pleiades.stoa.org/places/" + pleiades + "'>Pleiades : " + pleiades + "</a>"
    }
    return popup_text
  }

  //renders map only if the data is filled after apicall
  if (roadData.length < 1) {
    return (
      <p>Loading</p>
    )
  } else {
    const position = [51.505, -0.09]

    return (
      <>        
        <div className="atlas">
          <MapContainer center={position} zoom={5} style={{
            height: '70vh',
            width: '100wh'
          }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LayerGroup>
              <GeoJSON data={siteData} pointToLayer={
                function (feature, latlng) {  
                  let style = siteStyleDifferentiator(feature.properties);                           
                  let siteMarker = new L.circleMarker(latlng)
                  siteMarker.setStyle(style);             
                  return siteMarker;
                }
              } onEachFeature={
                function (feature, layer) {
                  let popUpText = createPopupText(feature.properties);
                  layer.bindPopup(popUpText, popUpStyle);
                }
              }
              />
              <GeoJSON data={roadData} style={function (feature) {               
                let style = roadStyleDifferentiator(feature.properties);
                return style;
              }}
               />
            </LayerGroup>
          </MapContainer>
          <nav>
            <Link to="/">Home</Link>
          </nav>
        </div>
      </>
    )
  }
}

export default MapBuilder;

