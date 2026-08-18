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
  /** Shared name grouping multiple sheets of the same published atlas/series
   * (e.g. "1818 De Man - Nijmegen"), or undefined for a standalone entry. */
  collection?: string;
  /** True for a multidirectional-hillshade derivative of a DEM layer - rendered
   * with a multiply blend over whatever's beneath it rather than as an
   * independent tile, and excluded from "active DEM for the Elevation legend"
   * (a hillshade has no colour ramp of its own to explain). */
  hillshade: boolean;
}
