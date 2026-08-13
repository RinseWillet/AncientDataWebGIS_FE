/**
 * Surfaces the active DEM/Physical-layer signal for MapLegend's DEM
 * color-ramp section. `MapContent` computes the topmost visible Physical
 * layer whose catalog `category` is `DEM` (see `useLayerPanelControl`'s
 * `physicalLayers` state) and passes its name in; any other visible
 * Physical layer (e.g. a historical map raster) must not trigger this, so
 * the Elevation section doesn't appear for non-elevation data. Returns
 * `null` until a real DEM layer exists in the catalog and is toggled
 * visible (no DEM layer exists yet - see E3-4). E3-5 is expected to use
 * this signal to feed the section's actual color-ramp content.
 */
export const useActiveDemLayer = (activeDemLayerName: string | null): string | null =>
  activeDemLayerName;
