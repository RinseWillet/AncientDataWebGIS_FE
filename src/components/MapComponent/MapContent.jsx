import { useMap, GeoJSON, LayerGroup, TileLayer } from 'react-leaflet';

//style
import 'leaflet/dist/leaflet.css';
import { popUpStyle, possibleRoad, hypotheticalRoute, road, histRec, castellumIcon, possibleCastellumIcon, cemeteryIcon, legionaryFortIcon, watchtowerIcon, cityIcon, tumulusIcon, villaIcon, possibleVillaIcon, siteIcon, settlementStoneIcon, shipIcon, possibleShipIcon, settlementIcon, sanctuaryIcon } from './Styles/markerStyles';

const MapContent = ({data}) => {

    const map = useMap();

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

    //binding popups to points
    // to do: standardize layer-fields
    const createPopupText = (properties) => {
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
    function clickZoom(e) { 
        let latlngClicked = e.target.getLatLng();
        let latClicked = latlngClicked.lat;
        let lngClicked = latlngClicked.lng;
        map.setView([latClicked, (lngClicked + 0.06)], 12)        
        return null;
    }

    return (
        <>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LayerGroup>
                <GeoJSON data={data} pointToLayer={
                    function (feature, latlng) {
                        let marker = siteStyleDifferentiator(feature.properties, latlng);
                        return marker;
                    }
                } onEachFeature={
                    function (feature, layer) {
                        let popUpText = createPopupText(feature.properties);
                        layer.bindPopup(popUpText, popUpStyle);
                        layer.on('click', clickZoom)
                    }
                }
                />
            </LayerGroup>
        </>
    );
}

export default MapContent;