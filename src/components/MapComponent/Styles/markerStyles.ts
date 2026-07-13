import L, { Icon, PathOptions } from 'leaflet';
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
import milestone from '../../../assets/milestone.png';

export const highlightedSiteIcon = L.divIcon({
  className: 'highlighted-site-icon',
  html: "<div class='marker-pin highlight'></div><div class='pulse highlight'></div>",
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

export const photoPinIcon = L.divIcon({
  className: 'photo-pin-icon',
  html: "<div class='photo-pin'>📷</div>",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const makeIcon = (iconUrl: string): Icon =>
  new Icon({ iconUrl, iconSize: [30, 30] });

export const castellumIcon = makeIcon(fort);
export const possibleCastellumIcon = makeIcon(pfort);
export const legionaryFortIcon = makeIcon(legfort);
export const watchtowerIcon = makeIcon(watchtower);
export const cityIcon = makeIcon(city);
export const villaIcon = makeIcon(villa);
export const possibleVillaIcon = makeIcon(pvilla);
export const settlementStoneIcon = makeIcon(settS);
export const settlementIcon = makeIcon(sett);
export const siteIcon = makeIcon(site);
export const shipIcon = makeIcon(ship);
export const possibleShipIcon = makeIcon(pship);
export const cemeteryIcon = makeIcon(cemetery);
export const sanctuaryIcon = makeIcon(sanctuary);
export const tumulusIcon = makeIcon(tumulus);
export const possibleTumulusIcon = makeIcon(ptumulus);
export const mileStoneIcon = makeIcon(milestone);

export const possibleRoad: PathOptions = {
  color: '#000000',
  weight: 2.5,
  opacity: 0.65,
  dashArray: '2 3',
};

export const hypotheticalRoute: PathOptions = {
  color: '#878787',
  weight: 2,
  opacity: 1,
  dashArray: '2 3',
};

export const road: PathOptions = {
  color: '#ff0000',
  weight: 3,
  opacity: 1.0,
};

export const histRec: PathOptions = {
  color: '#006400',
  weight: 2,
  opacity: 0.65,
  dashArray: '2 3',
};

export const notShowRoad: PathOptions = {
  opacity: 0,
};

