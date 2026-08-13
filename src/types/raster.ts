export type RasterLayerCategory = 'HISTORICAL_MAP' | 'DEM';

export interface RasterBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface RasterZoom {
  min: number;
  max: number;
}

export interface RasterLayer {
  name: string;
  source: string;
  bounds: RasterBounds;
  zoom: RasterZoom;
  attribution: string;
  category: RasterLayerCategory;
}
