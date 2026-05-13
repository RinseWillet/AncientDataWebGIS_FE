/**
 * Shared GeoJSON DTO types used across Redux slices, pages, and map components.
 * These mirror the GeoJSON structures returned by the backend API.
 */

export interface FeatureProperties {
  id?: string | number;
  name?: string;
  [key: string]: unknown;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoJsonFeature {
  type: 'Feature';
  properties?: FeatureProperties;
  geometry?: GeoJsonGeometry;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

/** Properties specific to road features */
export interface RoadProperties extends FeatureProperties {
  type?: string;
  typeDescription?: string;
  location?: string;
  description?: string;
  date?: string;
  references?: string;
  historicalReferences?: string;
  cat_nr?: string;
}

/** Properties specific to site features */
export interface SiteProperties extends FeatureProperties {
  siteType?: string;
  status?: string;
  description?: string;
  references?: string;
  province?: string;
  pleiadesId?: string;
}

/** A modern bibliographic reference linked to a road or site */
export interface ModernReference {
  id: number;
  shortRef: string;
  fullRef: string;
  url: string | null;
}

