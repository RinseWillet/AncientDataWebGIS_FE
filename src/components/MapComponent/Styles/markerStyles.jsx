import { Icon } from 'leaflet';
import fort from '../../../assets/fort.png';
import pfort from '../../../assets/pfort.png';
import watchtower from '../../../assets/watchtower.png';
import city from '../../../assets/city.png';
import villa from '../../../assets/villa.png';
import pvilla from '../../../assets/pvilla.png';
import legfort from '../../../assets/legfort.png';
import settS from '../../../assets/settS.png';
import sett from '../../../assets/sett.png';
import tumulus from '../../../assets/tumulus.png';
import ptumulus from '../../../assets/ptumulus.png';
import cemetery from '../../../assets/cemetery.png';
import sanctuary from '../../../assets/sanctuary.png';
import ship from '../../../assets/ship.png';
import pship from '../../../assets/pship.png';
import site from '../../../assets/site.png';

export const castellumIcon = new Icon({
    iconUrl: fort,
    iconSize: [30, 30]
});

export const possibleCastellumIcon = new Icon({
    iconUrl: pfort,
    iconSize: [30, 30]
});

export const legionaryFortIcon = new Icon({
    iconUrl: legfort,
    iconSize: [30, 30]
});

export const watchtowerIcon = new Icon({
    iconUrl: watchtower,
    iconSize: [30, 30]
});

export const cityIcon = new Icon({
    iconUrl: city,
    iconSize: [30, 30]
});

export const villaIcon = new Icon({
    iconUrl: villa,
    iconSize: [30, 30]
});

export const possibleVillaIcon = new Icon({
    iconUrl: pvilla,
    iconSize: [30, 30]
});

export const settlementStoneIcon = new Icon({
    iconUrl: settS,
    iconSize: [30, 30]
});

export const settlementIcon = new Icon({
    iconUrl: sett,
    iconSize: [30, 30]
});

export const siteIcon = new Icon({
    iconUrl: site,
    iconSize: [30, 30]
});

export const shipIcon = new Icon({
    iconUrl: ship,
    iconSize: [30, 30]
});

export const possibleShipIcon = new Icon({
    iconUrl: pship,
    iconSize: [30, 30]
});

export const cemeteryIcon = new Icon({
    iconUrl: cemetery,
    iconSize: [30, 30]
});

export const sanctuaryIcon = new Icon({
    iconUrl: sanctuary,
    iconSize: [30, 30]
});

export const tumulusIcon = new Icon({
    iconUrl: tumulus,
    iconSize: [30, 30]
});

export const possibleTumulusIcon = new Icon({
    iconUrl: ptumulus,
    iconSize: [30, 30]
});

export const possibleRoad = {
    color:  '#000000',
    weight: 2.5,
    opacity: 0.65,
    dashArray: [2,3]    
};

export const hypotheticalRoute = {
    color: '#878787',
    weight: 2,
    opacity: 1,
    dashArray: [2,3],
};

export const road = {
    color: '#ff0000',
    weight: 3,
    opacity: 1.0
};

export const histRec = {
    color: '#006400',
    weight: 2,
    opacity: 0.65,
    dashArray: [2,3],
};

export const notShowRoad = {   
    opacity: 0
};