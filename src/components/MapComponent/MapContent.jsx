import { useMap, GeoJSON, LayerGroup, TileLayer, useMapEvent } from 'react-leaflet';
//Services
import SiteService from '../../services/SiteService';
//style
import 'leaflet/dist/leaflet.css';
import { possibleRoad, hypotheticalRoute, road, histRec, castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon, watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon, settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon, sanctuaryIcon } from './Styles/markerStyles';

import './MapContent.css';
import { useState, useEffect } from 'react';

const MapContent = ({ siteData, roadData, setShowInfoCard, setSearchItem }) => {

    const map = useMap();    

    const mapEventListener = useMapEvent('popupclose', () => {
        setShowInfoCard(false);
    });

    //filters style of sites based on attributes
    const siteStyleDifferentiator = (siteProperties, latlng) => {
        let siteMarker = new L.Marker(latlng, { alt: siteProperties.name });

        if (siteProperties.siteType === 'castellum') {
            siteMarker.setIcon(castellumIcon);
        } else if (siteProperties.siteType === 'pos_castellum') {
            siteMarker.setIcon(possibleCastellumIcon);
        } else if (siteProperties.siteType === 'legfort') {
            siteMarker.setIcon(legionaryFortIcon);
        } else if (siteProperties.siteType === 'watchtower') {
            siteMarker.setIcon(watchtowerIcon);
        } else if (siteProperties.siteType === 'city') {
            siteMarker.setIcon(cityIcon);
        } else if (siteProperties.siteType === 'cem') {
            siteMarker.setIcon(cemeteryIcon);
        } else if (siteProperties.siteType === 'ptum') {
            siteMarker.setIcon(tumulusIcon);
        } else if (siteProperties.siteType === 'tum') {
            siteMarker.setIcon(tumulusIcon);
        } else if (siteProperties.siteType === 'villa') {
            siteMarker.setIcon(villaIcon);
        } else if (siteProperties.siteType === 'pvilla') {
            siteMarker.setIcon(possibleVillaIcon);
        } else if (siteProperties.siteType === 'sett') {
            siteMarker.setIcon(settlementIcon);
        } else if (siteProperties.siteType === 'settS') {
            siteMarker.setIcon(settlementStoneIcon);
        } else if (siteProperties.siteType === 'sanctuary') {
            siteMarker.setIcon(sanctuaryIcon);
        } else if (siteProperties.siteType === 'ship') {
            siteMarker.setIcon(shipIcon);
        } else if (siteProperties.siteType === 'pship') {
            siteMarker.setIcon(possibleShipIcon);
        } else if (siteProperties.siteType === 'site') {
            siteMarker.setIcon(siteIcon);
        } else {
            siteMarker = new L.circleMarker(latlng)
        }
        return siteMarker;
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
        let type = properties.siteType;
        return "<b>Name : " + name + "</b>";
    }

    //function to zoom slightly to to left of marker (0.06 degrees) when clicked to allow popup on the right 
    const clickZoomSite = (e) => {
        let latlngClicked = e.target.getLatLng();
        let latClicked = latlngClicked.lat;
        let lngClicked = latlngClicked.lng;

        let xScreen = map.getPixelBounds().getSize().x;

        if (xScreen > 800) {
            map.setView([latClicked, (lngClicked + 0.01)], 14)
        } else if (xScreen > 600 && xScreen < 800) {
            map.setView([latClicked, (lngClicked + 0.005)], 14)
        } else if (xScreen > 400 && xScreen < 600) {
            map.setView([latClicked, (lngClicked + 0.00025)], 14)
        } else {
            map.setView(latlngClicked, 14)
        }
        return null;
    }

    // //calculates where the popup must go (right side of clicked marker, bigger screens - under marker on smallest screens)
    // const sizeCalculator = (e) => {
    //     let xScreen = map.getPixelBounds().getSize().x;

    //     if (xScreen > 800) {
    //         return [400, 0];
    //     } else if (xScreen > 600 && xScreen < 800) {
    //         return [300, 0];
    //     } else if (xScreen > 400 && xScreen < 600) {
    //         return [200, 0];
    //     } else {
    //         return [0, 50]
    //     }
    // }

    const clickSite = (e) => {       
        setShowInfoCard(true);
        setSearchItem((searchItem) => ({...searchItem, type: "site", id: e.sourceTarget.feature.properties.id}))
        clickZoomSite(e);
        return null;
    }

    const clickRoad = (e) => {
        setShowInfoCard(true);    
        setSearchItem((searchItem) => ({...searchItem, type: "road", id: e.sourceTarget.feature.properties.id}))
        clickZoomRoad(e);
        return null;
    }

    const clickZoomRoad = (e) => {
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
                        let popUpContent = createPopupTextSite(feature.properties);
                        layer.bindPopup(popUpContent, { className: 'popup' });
                        layer.on({
                            'click': clickSite
                        })
                    }
                }
                />
                <GeoJSON data={roadData} style={function (feature) {
                    let style = roadStyleDifferentiator(feature.properties);
                    return style;
                }} onEachFeature={
                    function (feature, layer) {
                        let popUpContent = createPopupTextSite(feature.properties);
                        layer.bindPopup(popUpContent, { className : 'popup' });
                        layer.on({
                            'click': clickRoad,
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