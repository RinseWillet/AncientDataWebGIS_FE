/**
 * Surfaces the active DEM/Physical-layer signal for MapLegend's DEM
 * color-ramp section. There is no "Physical" layer group yet (see
 * `layersConfig.ts`) and `LayerPanel` does not track one, so this
 * intentionally always returns `null` today - the DEM section must stay
 * hidden until a real DEM layer exists (see E9-4 lock-in notes). E3-3 (adds
 * Physical group entries + LayerPanel wiring) and E3-5 (wires real DEM
 * color-ramp data) are expected to give this hook real logic.
 */
export const useActiveDemLayer = (): null => null;
