import { PathOptions } from 'leaflet';
import {
  histRec,
  hypotheticalRoute,
  notShowRoad,
  possibleRoad,
  road,
} from '../components/MapComponent/Styles/markerStyles';

export interface RoadStyleEntry {
  type: string;
  label: string;
  style: PathOptions;
}

/**
 * Canonical road `type` -> style/label mapping. Shared by MapContent's
 * on-map road styling and MapLegend's road style key so they never drift.
 * `notShowRoad` (fully transparent, for unrecognized types) is deliberately
 * excluded here - there is nothing meaningful to show for it in a legend.
 */
export const roadStyleEntries: RoadStyleEntry[] = [
  { type: 'road', label: 'Road', style: road },
  { type: 'possible road', label: 'Possible Road', style: possibleRoad },
  { type: 'hypothetical route', label: 'Hypothetical Route', style: hypotheticalRoute },
  { type: 'hist_rec', label: 'Historical Record', style: histRec },
];

/** Resolve a road `type` to its display style, hiding (fully transparent) unrecognized types. */
export const roadStyleDifferentiator = (roadProps: { type?: string }): PathOptions =>
  roadStyleEntries.find((entry) => entry.type === roadProps.type)?.style ?? notShowRoad;
