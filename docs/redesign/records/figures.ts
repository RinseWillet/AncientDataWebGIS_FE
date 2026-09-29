import type { MediaAsset } from '../types/media';

/** "Show on map" only for figures that actually have a location. */
export const isGeotagged = (m: MediaAsset): m is MediaAsset & { latitude: number; longitude: number } =>
  m.latitude != null && m.longitude != null;

/** Maps & figures apart from photographs, as in the figure viewer strip.
 *  There is no media "kind" field yet: until there is, treat geotagged items as photographs.
 *  Better: add a `kind: 'MAP' | 'PHOTO' | 'DRAWING'` column when convenient. */
export const groupFigures = (media: MediaAsset[]) => ({
  maps: media.filter((m) => !isGeotagged(m)),
  photos: media.filter(isGeotagged),
});

/* In the viewer:
   {isGeotagged(m) && <button onClick={() => { close(); map.flyTo([m.latitude, m.longitude], 16); }}>Show on map</button>}
   and in the strip: a small pin badge on geotagged thumbnails. */
