import { useMap, GeoJSON, LayerGroup, TileLayer } from 'react-leaflet';
import { useState } from "react";

//style
import 'leaflet/dist/leaflet.css';
import { popUpStyle, possibleRoad, hypotheticalRoute, road, histRec, castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon, watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon, settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon, sanctuaryIcon } from './Styles/markerStyles';

const MapContent = ({ siteData, roadData }) => {

    const map = useMap();
    const [onselect, setOnselect] = useState({});

    //filters style of sites based on attributes
    const siteStyleDifferentiator = (siteProperties, latlng) => {
        if (siteProperties.siteType === 'castellum') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(castellumIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'pos_castellum') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(possibleCastellumIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'legfort') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(legionaryFortIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'watchtower') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(watchtowerIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'city') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(cityIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'cem') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(cemeteryIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'ptum') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(tumulusIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'tum') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(tumulusIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'villa') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(villaIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'pvilla') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(possibleVillaIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'sett') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(settlementIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'settS') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(settlementStoneIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'sanctuary') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(sanctuaryIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'ship') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(shipIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'pship') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(possibleShipIcon);
            return siteMarker;
        } else if (siteProperties.siteType === 'site') {
            let siteMarker = new L.Marker(latlng)
            siteMarker.setIcon(siteIcon);
            return siteMarker;
        } else {
            let siteMarker = new L.circleMarker(latlng)
            return siteMarker;
        }
    }

    //filters style of roads based on attributes
    const roadStyleDifferentiator = (roadProperties) => {
        if (roadProperties.type === 'possible road') {            
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
    const createPopupTextSite = (properties) => {
        let name = properties.name;
        let status = properties.siteType;
        let status_ref = "test";
        let province = "test";
        let conventus = "test";
        let pleiades = "test";
        if (pleiades === null) {
            var popup_text = "<b>Name : " + name + "</b><br/>Status : " + status + "<br/>Reference : " + status_ref + "<br/>Assize : " + conventus + "<br/>Province : " + province
        } else {
            var popup_text = "<b>Name : " + name + "</b><br/>Status : " + status + "<br/>Reference : " + status_ref + "<br/>Assize : " + conventus + "<br/>Province : " + province +
                "<br/><a href='https://pleiades.stoa.org/places/" + pleiades + "'>Pleiades : " + pleiades + "</a>"
        }
        return popup_text
    }

    //function to zoom slightly to to left of marker (0.06 degrees) when clicked to allow popup on the right 
    const clickZoomSite = (e) => {
        let latlngClicked = e.target.getLatLng();
        let latClicked = latlngClicked.lat;
        let lngClicked = latlngClicked.lng;

        let xScreen = map.getPixelBounds().getSize().x;
  
        if (xScreen > 800) {
            map.setView([latClicked, (lngClicked + 0.08)], 12)
        } else if (xScreen > 600 && xScreen < 800) {
            map.setView([latClicked, (lngClicked + 0.06)], 12)
        } else if (xScreen > 400 && xScreen < 600) {
            map.setView([latClicked, (lngClicked + 0.03)], 12)
        } else {
            map.setView(latlngClicked, 12)
        }
        return null;
    }

    const clickZoomRoad = (e) => {
        console.log(e.target);
        let roadBounds = e.target.getBounds();
        map.fitBounds(roadBounds);
        return null;
    }


    // function to highlight a road when hovering over it with the cursor
    const highlightRoad = (e) => {
        var road = e.target;
        road.setStyle({
            weight: 3,
            color: "yellow"
        });
    }

    //function to reset the style of a road when the cursor is no longer hovering over it (see highlightRoad)
    const resetHighlightroad = (e) => {     
        let style = roadStyleDifferentiator(e.target.feature.properties)        
        e.target.setStyle(style)
    }

    return (
        <>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LayerGroup>
                <GeoJSON data={siteData} pointToLayer={
                    function (feature, latlng) {
                        let marker = siteStyleDifferentiator(feature.properties, latlng);
                        return marker;
                    }
                } onEachFeature={
                    function (feature, layer) {
                        let popUpText = createPopupTextSite(feature.properties);
                        layer.bindPopup(popUpText, popUpStyle);
                        layer.on({'click': clickZoomSite})
                    }
                }
                />
                <GeoJSON data={roadData} style={function (feature) {
                    let style = roadStyleDifferentiator(feature.properties);
                    return style;
                }} onEachFeature={
                    function (feature, layer) {
                        let popUpText = createPopupTextSite(feature.properties);
                        layer.bindPopup(popUpText, popUpStyle);
                        layer.on({
                            'click': clickZoomRoad,
                            'mouseover': highlightRoad,
                            'mouseout': resetHighlightroad
                        })

                    }
                }
                />


            </LayerGroup>
        </>
    );
}

export default MapContent;