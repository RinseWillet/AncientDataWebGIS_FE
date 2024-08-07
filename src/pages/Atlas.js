//React
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";

//Services
import settlementService from "../services/settlementService";

//Leaflet mapping library
import { MapContainer, TileLayer, LayerGroup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';

//style
import 'leaflet/dist/leaflet.css';
import { popUpStyle, secondaryAgglomerationMarkerStyle, possibleCityMarkerStyle, cityMarkerStyle } from '../markerStyles';

const Atlas = () => {

    //to set the state of the data from apicall to backend
    const [data, setData] = useState([]);

    //load all settlement data and pass to child Map component
    useEffect(() => {
        function findAll() {
            settlementService
                .findAllGeoJson()
                .then((response) => {
                    setData(response.data);
                })
                .catch((error) => {
                    console.log(error);
                });
        }
        findAll();
    }, []);

    //filters style based on settlement status
    const styleDifferentiator = (settlementProperties) => {
        if (settlementProperties.status === 'SECONDARY_AGGLOMERATION') {
            return secondaryAgglomerationMarkerStyle;
        } else if (settlementProperties.status === 'POSSIBLE') {
            return possibleCityMarkerStyle;
        } else if (settlementProperties.status === 'SELF_GOVERNING') {
            return cityMarkerStyle;
        }
    }

    //binding popups to points
    // to do: standardize layer-fields
    const createPopupText = (data) => {
        let name = data.name;
        let status = data.status;
        let status_ref = data.statusref;
        let province = data.province;
        let conventus = data.conventus;
        let pleiades = data.plid;
        if (pleiades === null) {
            var popup_text = "<b>Name : " + name + "</b><br/>Status : " + status + "<br/>Reference : " + status_ref + "<br/>Assize : " + conventus + "<br/>Province : " + province
        } else {
            var popup_text = "<b>Name : " + name + "</b><br/>Status : " + status + "<br/>Reference : " + status_ref + "<br/>Assize : " + conventus + "<br/>Province : " + province +
                "<br/><a href='https://pleiades.stoa.org/places/" + pleiades + "'>Pleiades : " + pleiades + "</a>"
        }
        return popup_text
    }


    //renders map only if the data is filled after apicall
    if (data.length < 1) {
        return (
            <p>Loading</p>
        )
    } else {

        const position = [51.505, -0.09]

        return (
            <>
                <main>
                    <h2>Atlas page</h2>
                </main>
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
                            <GeoJSON data={data} pointToLayer={
                                function (geoJsonPoint, latlng) {
                                    let style = styleDifferentiator(geoJsonPoint.properties);
                                    var marker = new L.circleMarker(latlng)
                                    marker.setStyle(style);
                                    return marker;
                                }
                            } onEachFeature={
                                function (feature, layer) {                                 
                                    let popUpText = createPopupText(feature.properties);
                                    layer.bindPopup(popUpText, popUpStyle);
                                }
                            }
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

export default Atlas;