import L, { DivIcon, Icon, PathOptions } from 'leaflet';

export const highlightedSiteIcon = L.divIcon({
  className: 'highlighted-site-icon',
  html: "<div class='marker-pin highlight'></div><div class='pulse highlight'></div>",
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

export const photoPinIcon = L.divIcon({
  className: 'photo-pin-icon',
  html: "<div class='photo-pin'>📷</div>",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// className lets MapComponent.css target just these icons (not the highlighted
// pulse marker, the photo pin, or any leaflet-draw edit handle) to relax the
// global `[role="button"] { min-width/min-height: 44px }` a11y rule down to
// something more reasonable for a dense point map -- see the click-precision
// fix in MapContent.tsx's clickSite, which this pairs with. Deliberately just
// `.site-type-icon` (no `img`/`div` tag qualifier) in MapContent.css, so it
// matches both legacy image-based `Icon`s (makeIcon, `<img>`) and E16's
// inline-SVG `DivIcon`s (makeSvgIcon, `<div>`) the same way.
export const makeIcon = (iconUrl: string, size = 30): Icon =>
  new Icon({ iconUrl, iconSize: [size, size], className: 'site-type-icon' });

/** DivIcon equivalent of `makeIcon`, for E16's inline-SVG site-type icons.
 * `svgMarkup` should come from one of `svgIconShapes.ts`'s generators. */
export const makeSvgIcon = (svgMarkup: string, canvasPx = 30): DivIcon =>
  L.divIcon({
    html: svgMarkup,
    className: 'site-type-icon',
    iconSize: [canvasPx, canvasPx],
    iconAnchor: [canvasPx / 2, canvasPx / 2],
  });

/** Encodes SVG markup as a data URI usable as a plain `<img src>` - lets
 * `MapLegend.tsx` keep rendering `SiteTypeEntry.iconUrl` via `<img>` unchanged
 * for E16-converted types, without needing to know their icon is now inline
 * SVG rather than a PNG file. */
export const svgToDataUri = (svgMarkup: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;

export const possibleRoad: PathOptions = {
  color: '#000000',
  weight: 2.5,
  opacity: 0.65,
  dashArray: '2 3',
};

export const hypotheticalRoute: PathOptions = {
  color: '#878787',
  weight: 2,
  opacity: 1,
  dashArray: '2 3',
};

export const road: PathOptions = {
  color: '#ff0000',
  weight: 3,
  opacity: 1.0,
};

export const histRec: PathOptions = {
  color: '#006400',
  weight: 2,
  opacity: 0.65,
  dashArray: '2 3',
};

export const notShowRoad: PathOptions = {
  opacity: 0,
};

