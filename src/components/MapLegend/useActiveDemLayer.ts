/**
 * Surfaces the active DEM/Physical-layer signal for MapLegend's DEM
 * color-ramp section. `MapContent` computes the topmost visible Physical
 * layer whose catalog `category` is `DEM` (see `useLayerPanelControl`'s
 * `physicalLayers` state) and passes its name in; any other visible
 * Physical layer (e.g. a historical map raster) must not trigger this, so
 * the Elevation section doesn't appear for non-elevation data. Returns
 * `null` until a real DEM layer is toggled visible. `MapLegend` uses this
 * signal to feed the section's `demColorRamp.ts` content (E3-5).
 */
export const useActiveDemLayer = (activeDemLayerName: string | null): string | null =>
  activeDemLayerName;
