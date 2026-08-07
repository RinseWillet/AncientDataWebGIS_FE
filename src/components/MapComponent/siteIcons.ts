import { DivIcon, Icon } from 'leaflet';
import {
  castellumIcon,
  cemeteryIcon,
  cityIcon,
  legionaryFortIcon,
  mileStoneIcon,
  possibleCastellumIcon,
  possibleShipIcon,
  possibleVillaIcon,
  sanctuaryIcon,
  settlementIcon,
  settlementStoneIcon,
  shipIcon,
  siteIcon,
  tumulusIcon,
  villaIcon,
  watchtowerIcon,
} from './Styles/markerStyles';

const siteIconMap: Record<string, Icon | DivIcon> = {
  castellum: castellumIcon,
  pos_castellum: possibleCastellumIcon,
  legfort: legionaryFortIcon,
  watchtower: watchtowerIcon,
  city: cityIcon,
  cem: cemeteryIcon,
  ptum: tumulusIcon,
  tum: tumulusIcon,
  villa: villaIcon,
  pvilla: possibleVillaIcon,
  sett: settlementIcon,
  settS: settlementStoneIcon,
  sanctuary: sanctuaryIcon,
  ship: shipIcon,
  pship: possibleShipIcon,
  site: siteIcon,
  milestone: mileStoneIcon,
};

/** Resolve the marker icon for a given site type, defaulting to the generic site icon. */
export const getSiteIcon = (type?: string): Icon | DivIcon =>
  (type ? siteIconMap[type] : undefined) ?? siteIcon;

