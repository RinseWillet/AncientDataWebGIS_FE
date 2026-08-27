import L, { Icon, PathOptions } from 'leaflet';
import site from '../../../assets/site.png';

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

export const makeIcon = (iconUrl: string): Icon =>
  new Icon({ iconUrl, iconSize: [30, 30] });

/** Generic fallback marker: used for the 'site' type and any unrecognized `siteType`. */
export const siteIcon = makeIcon(site);

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

