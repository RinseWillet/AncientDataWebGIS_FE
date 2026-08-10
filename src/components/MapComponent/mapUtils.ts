import L from 'leaflet';
import { LayerConfig } from './layersConfig';

/** Builds a Leaflet tile/WMS layer instance from a `layersConfig` entry. */
export const buildLayer = (config: LayerConfig): L.Layer =>
  config.kind === 'tile'
    ? L.tileLayer(config.url, { attribution: config.attribution })
    : L.tileLayer.wms(config.url, {
        layers: config.layers,
        format: 'image/png',
        transparent: true,
      });

export interface ZoomPadding {
  bottomRight: [number, number];
  topLeft: [number, number];
}

/**
 * Compute responsive fitBounds padding so the selected feature is not hidden
 * behind the info card. The layout differs by viewport width:
 *  - wide (> 800px):   info card on the right, reserve 400px there.
 *  - medium (> 600px): info card on the right, reserve 150px there.
 *  - mobile:           info card as a bottom sheet (~50vh), reserve bottom space.
 */
export const computeZoomPadding = (mapWidth: number): ZoomPadding => {
  if (mapWidth > 800) return { bottomRight: [400, 10], topLeft: [0, 10] };
  if (mapWidth > 600) return { bottomRight: [150, 5], topLeft: [0, 5] };
  return { bottomRight: [10, 250], topLeft: [10, 10] };
};

/** fitBounds a map to the given bounds using responsive padding. */
export const fitBoundsWithPadding = (
  map: L.Map,
  bounds: L.LatLngBounds,
  extraOptions: L.FitBoundsOptions = {}
): void => {
  const padding = computeZoomPadding(map.getPixelBounds().getSize().x);
  map.fitBounds(bounds, {
    paddingBottomRight: padding.bottomRight,
    paddingTopLeft: padding.topLeft,
    ...extraOptions,
  });
};

