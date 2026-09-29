/**
 * DEM elevation ramps for the legend — hand-kept mirror of the three SLDs in this folder.
 * Same 8 stops as before (-25 m … 155 m); lightness now rises steadily with height,
 * so "higher" always reads as "lighter" (also in greyscale and for colour-blind visitors).
 * Replaces src/components/MapLegend/demColorRamp.ts (keeps the DemColorRampStop shape).
 */
import type { Theme } from '../theme/useTheme';

export interface DemColorRampStop {
  color: string;
  quantity: number;
  label: string;
}

const labels: [number, string][] = [
  [-25, '-25m (mining district low)'],
  [0, '0m'],
  [25, '25m'],
  [50, '50m'],
  [75, '75m'],
  [100, '100m'],
  [125, '125m'],
  [155, '155m+ (moraine crests)'],
];

const build = (colors: string[]): DemColorRampStop[] =>
  labels.map(([quantity, label], i) => ({ color: colors[i], quantity, label }));

/** Day: night blue → river → sage → ochre → road cream. L* 18 → 93 */
export const demColorRampDay = build([
  '#1F2E3A', '#3F5E68', '#6F8C7E', '#97A67E', '#B3B07A', '#D4B872', '#E4D29E', '#F4EBD2',
]);

/** Night: same order, one step darker so the map stays calm. L* 5 → 81 */
export const demColorRampNight = build([
  '#0B1016', '#1C2A38', '#2E4250', '#465A55', '#66704F', '#8C7D4E', '#B39B66', '#D8C79C',
]);

/** Hercules: phosphor green, black → bright. Use when a DEM is switched on in Hercules. */
export const demColorRampHercules = build([
  '#040904', '#08180C', '#0F3319', '#1A5A2C', '#2C9A4C', '#3DD068', '#8CFFA6', '#D2FFDC',
]);

export const demColorRampFor = (theme: Theme): DemColorRampStop[] =>
  theme === 'night' ? demColorRampNight : theme === 'hercules' ? demColorRampHercules : demColorRampDay;

/** GeoServer style name per theme — pass as the WMS `styles` param. */
export const demStyleFor = (theme: Theme): string =>
  theme === 'night'
    ? 'dem-elevation-ramp-night'
    : theme === 'hercules'
      ? 'dem-elevation-ramp-hercules'
      : 'dem-elevation-ramp';
