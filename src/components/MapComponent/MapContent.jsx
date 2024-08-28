import { useMap, GeoJSON, TileLayer, useMapEvent, LayersControl, ScaleControl } from 'react-leaflet';

//style
import 'leaflet/dist/leaflet.css';
import { possibleRoad, road, histRec, hypotheticalRoute, castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon, watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon, settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon, sanctuaryIcon } from './Styles/MarkerStyles';

import './MapContent.css';
import { useState } from 'react';


const MapContent = ({ siteData, roadData, setShowInfoCard, setSearchItem }) => {


    const map = useMap();

    const [selectedItem, setSelectedItem] = useState(false);

    const mapEventListener = useMapEvent(
        'popupclose', () => {
            setShowInfoCard(false);
            setSelectedItem(false);
        }
    );

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

    const clickSite = (e) => {
        setShowInfoCard(true);
        setSearchItem((searchItem) => ({ ...searchItem, type: "site", id: e.sourceTarget.feature.properties.id }))
        clickZoomSite(e);
        return null;
    }

    //asynchronous function to make sure all states are set before altering the style
    //of the selected road (highlightRoad() to prevent nullifyng stylechange due to rerendering)
    async function clickRoad(e) {
        var road = e.target;
        await setShowInfoCard(true);
        await setSelectedItem(true);
        await setSearchItem((searchItem) => ({ ...searchItem, type: "road", id: road.feature.properties.id }));
        clickZoomRoad(road);
        highlightRoad(road);
        return null;
    }

    const clickZoomRoad = (road) => {
        let roadBounds = road.getBounds();
        let xScreen = map.getPixelBounds().getSize().x;

        let bottomRightPadding;
        let topLeftPadding;
        if (xScreen > 800) {
            bottomRightPadding = [400, 10];
            topLeftPadding = [0, 10];
        } else if (xScreen > 600 && xScreen < 800) {
            bottomRightPadding = [150, 5];
            topLeftPadding = [0, 5];
        } else if (xScreen > 400 && xScreen < 600) {
            bottomRightPadding = [100, 3];
            topLeftPadding = [0, 3];
        } else {
            bottomRightPadding = [10, 20];
            topLeftPadding = [10, 10];
        }
        map.fitBounds(roadBounds, {
            paddingBottomRight: bottomRightPadding,
            paddingTopLeft: topLeftPadding
        });
        return null;
    }

    // function to highlight a road when hovering over it with the cursor
    const highlightRoad = (road) => {
        road.setStyle({
            weight: 3,
            color: "yellow",
            zIndex: 20
        });
    }

    //function to reset the style of a road when the cursor is no longer hovering over it (see highlightRoad)
    const resetHighlightroad = (e) => {
        let style = roadStyleDifferentiator(e.target.feature.properties);
        e.target.setStyle(style);
    }

    return (
        <>
            <LayersControl position="topleft" collapsed="false">                
                    <LayersControl.BaseLayer checked name="Modern Topographical">
                        <TileLayer
                            attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}"
                            minZoom={0}
                            maxZoom={20}
                            ext="png"
                        />                        
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            minZoom={0}
                            maxZoom={20}
                            ext="png"
                        />                        
                    </LayersControl.BaseLayer>
           
                <LayersControl.Overlay checked name="Archaeological Sites">
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
                </LayersControl.Overlay>                
                <LayersControl.Overlay checked name="Roads and routes">
                    <GeoJSON data={roadData} style={function (feature) {
                        let style = roadStyleDifferentiator(feature.properties);
                        return style;
                    }} onEachFeature={
                        function (feature, layer) {
                            let popUpContent = createPopupTextSite(feature.properties);
                            layer.bindPopup(popUpContent, { className: 'popup' });
                            layer.on({
                                'click': clickRoad,
                                'popupclose': resetHighlightroad
                            });
                        }
                    }
                    />
                </LayersControl.Overlay>
            </LayersControl>
            <ScaleControl position="bottomleft" />
        </>
    );
}

export default MapContent;