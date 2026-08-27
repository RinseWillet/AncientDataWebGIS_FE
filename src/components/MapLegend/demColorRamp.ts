export interface DemColorRampStop {
  color: string;
  quantity: number;
  label: string;
}

/**
 * Hand-kept TS mirror of the 8 <ColorMapEntry> stops in
 * `docs/features/dem-elevation-ramp.sld` (the shared GeoServer style applied to every
 * DEM-category raster layer, -25m to 155m). Static/curated like `roadStyleEntries`
 * (utils/roadTypes.ts) and `siteTypeEntries` (utils/siteTypesConfig.ts) - keep in sync
 * by hand if the .sld ramp ever changes.
 */
export const demColorRamp: DemColorRampStop[] = [
  { color: '#2c1a4d', quantity: -25, label: '-25m (mining district low)' },
  { color: '#3a6ea5', quantity: 0, label: '0m' },
  { color: '#7fb069', quantity: 25, label: '25m' },
  { color: '#c9d16b', quantity: 50, label: '50m' },
  { color: '#e8b84b', quantity: 75, label: '75m' },
  { color: '#c9772e', quantity: 100, label: '100m' },
  { color: '#8b4a2b', quantity: 125, label: '125m' },
  { color: '#f2f2f2', quantity: 155, label: '155m+ (moraine crests)' },
];
