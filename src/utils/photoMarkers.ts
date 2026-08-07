import type { MediaAsset } from '../types/media';
import type { PhotoMarker } from '../components/MapComponent/MapContent';

/**
 * Map a list of media assets to the geolocated PhotoMarkers the map expects,
 * dropping any asset without coordinates. Shared by the SiteInfo and RoadInfo
 * detail pages.
 */
export const assetsToPhotoMarkers = (assets: MediaAsset[]): PhotoMarker[] =>
  assets
    .filter((asset) => asset.latitude != null && asset.longitude != null)
    .map((asset) => ({
      id: asset.id,
      latitude: asset.latitude as number,
      longitude: asset.longitude as number,
      fullUrl: asset.fullUrl,
      caption: asset.caption,
    }));

