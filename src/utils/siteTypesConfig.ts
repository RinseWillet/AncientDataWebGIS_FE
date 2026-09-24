import { DivIcon, Icon } from 'leaflet';
import { makeIcon, siteIcon } from '../components/MapComponent/Styles/markerStyles';
import fort from '../assets/fort.png';
import pfort from '../assets/pfort.png';
import watchtower from '../assets/watchtower.png';
import city from '../assets/city.png';
import villa from '../assets/villa.png';
import pvilla from '../assets/pvilla.png';
import legfort from '../assets/legfort.png';
import settS from '../assets/settS.png';
import sett from '../assets/sett.png';
import psett from '../assets/psett.png';
import bridge from '../assets/bridge.png';
import histSett from '../assets/histSett.png';
import tumulus from '../assets/tumulus.png';
import ptumulus from '../assets/ptumulus.png';
import cemetery from '../assets/cemetery.png';
import sanctuary from '../assets/sanctuary.png';
import ship from '../assets/ship.png';
import pship from '../assets/pship.png';
import site from '../assets/site.png';
import milestone from '../assets/milestone.png';

/**
 * To add, rename, or restyle a site type: edit `siteTypeEntries` below only.
 * - New type: import its marker PNG above, add a row with a unique `type`
 *   (the backend's `siteType` code), a `label`, and an icon built via `makeIcon`.
 * - Rename: change `label`.
 * - Restyle: swap the PNG import used by `icon`/`iconUrl`.
 * Every consumer (map markers, MapInfoCard, SiteInfo, MapLegend, Dashboard)
 * reads from this array, so nothing else needs to change.
 */
export interface SiteTypeEntry {
  type: string;
  label: string;
  icon: Icon | DivIcon;
  iconUrl: string;
}

/**
 * Canonical `siteType` -> label/icon/iconUrl registry. This is the single
 * place to touch when adding, renaming, or restyling a site type: add/edit a
 * row here and every consumer (map markers, MapInfoCard, SiteInfo, MapLegend,
 * Dashboard) picks it up automatically.
 */
export const siteTypeEntries: SiteTypeEntry[] = [
  { type: 'castellum', label: 'castellum', icon: makeIcon(fort), iconUrl: fort },
  { type: 'pos_castellum', label: 'possible castellum', icon: makeIcon(pfort), iconUrl: pfort },
  {
    type: 'legfort',
    label: 'legionary fortress / castra',
    icon: makeIcon(legfort),
    iconUrl: legfort,
  },
  { type: 'watchtower', label: 'watchtower', icon: makeIcon(watchtower), iconUrl: watchtower },
  { type: 'city', label: 'autonomous city', icon: makeIcon(city), iconUrl: city },
  { type: 'cem', label: '(Roman) cemetery', icon: makeIcon(cemetery), iconUrl: cemetery },
  { type: 'ptum', label: 'possible barrow', icon: makeIcon(ptumulus), iconUrl: ptumulus },
  { type: 'tum', label: '(Prehistoric?) barrow', icon: makeIcon(tumulus), iconUrl: tumulus },
  { type: 'villa', label: 'villa', icon: makeIcon(villa), iconUrl: villa },
  { type: 'pvilla', label: 'possible villa', icon: makeIcon(pvilla), iconUrl: pvilla },
  // iconSize is kept at the shared default (30px) for every type, matching
  // every other marker -- a global a11y rule (`[role="button"] { min-width/
  // min-height: 44px }`) clamps the *click target* up to 44px regardless of
  // iconSize anyway, so varying iconSize can't actually shrink a marker on
  // screen (confirmed: it silently clamped straight back up). The relative
  // sizing the visual differences (sett at 75%, psett at 50% of settS) is
  // done inside the PNG artwork instead -- how much of the fixed-size canvas
  // the glyph itself fills -- which isn't subject to that clamp.
  { type: 'sett', label: 'settlement', icon: makeIcon(sett), iconUrl: sett },
  { type: 'psett', label: 'possible settlement', icon: makeIcon(psett), iconUrl: psett },
  { type: 'bridge', label: 'bridge', icon: makeIcon(bridge), iconUrl: bridge },
  {
    type: 'histSett',
    label: 'settlement attested only by historical sources',
    icon: makeIcon(histSett),
    iconUrl: histSett,
  },
  {
    type: 'settS',
    label: 'settlement with stone buildings',
    icon: makeIcon(settS),
    iconUrl: settS,
  },
  { type: 'sanctuary', label: 'sanctuary', icon: makeIcon(sanctuary), iconUrl: sanctuary },
  { type: 'ship', label: 'shipwreck', icon: makeIcon(ship), iconUrl: ship },
  { type: 'pship', label: 'possible shipwreck', icon: makeIcon(pship), iconUrl: pship },
  { type: 'site', label: 'generic site', icon: siteIcon, iconUrl: site },
  { type: 'milestone', label: 'milestone', icon: makeIcon(milestone), iconUrl: milestone },
];

/** Resolve the marker icon for a given site type, defaulting to the generic site icon. */
export const getSiteIcon = (type?: string): Icon | DivIcon =>
  siteTypeEntries.find((entry) => entry.type === type)?.icon ?? siteIcon;

/** Resolve a `siteType` code to its label, defaulting to 'unknown'. */
export const siteTypeConverter = (siteType?: string): string =>
  siteTypeEntries.find((entry) => entry.type === siteType)?.label ?? 'unknown';
