import { DivIcon, Icon } from 'leaflet';
import { makeSvgIcon, svgToDataUri } from '../components/MapComponent/Styles/markerStyles';
import {
  CONFIRMED_FILL,
  POSSIBLE_FILL,
  POSSIBLE_STROKE,
  svgBollard,
  svgCircle,
  svgConcentricCircles,
  svgCross,
  svgDiamond,
  svgDome,
  svgHull,
  svgNestedSquare,
  svgPlus,
  svgPortal,
  svgSquare,
  svgTemple,
  svgTower,
  svgTriangle,
} from '../components/MapComponent/Styles/svgIconShapes';

/**
 * To add, rename, or restyle a site type: edit `siteTypeEntries` below only.
 * - New type: pick (or add) a shape generator from `svgIconShapes.ts`, add a
 *   row with a unique `type` (the backend's `siteType` code), a `label`, and
 *   build its entry via `svgEntry`.
 * - Rename: change `label`.
 * - Restyle (size/color): change the shape generator's arguments
 *   (`fillColor`/`strokeColor`/`sizePercent`) - no image file involved (E16).
 * Every consumer (map markers, MapInfoCard, SiteInfo, MapLegend, Dashboard)
 * reads from this array, so nothing else needs to change.
 */
export interface SiteTypeEntry {
  type: string;
  label: string;
  icon: Icon | DivIcon;
  iconUrl: string;
}

/** Builds one registry row from a type code, label, and SVG markup - the
 * `icon` (live marker) and `iconUrl` (legend `<img>`, via `svgToDataUri`) both
 * derive from the same `svgMarkup`, so they can't disagree with each other. */
const svgEntry = (type: string, label: string, svgMarkup: string): SiteTypeEntry => ({
  type,
  label,
  icon: makeSvgIcon(svgMarkup),
  iconUrl: svgToDataUri(svgMarkup),
});

/**
 * Canonical `siteType` -> label/icon/iconUrl registry. This is the single
 * place to touch when adding, renaming, or restyling a site type: add/edit a
 * row here and every consumer (map markers, MapInfoCard, SiteInfo, MapLegend,
 * Dashboard) picks it up automatically.
 *
 * (E16) Icons are inline SVG `DivIcon`s built from `svgIconShapes.ts`'s
 * generators, not PNG image files - size and color are config values here
 * (the `sizePercent`/`fillColor`/`strokeColor` arguments below), not baked
 * into a redrawn asset.
 */
export const siteTypeEntries: SiteTypeEntry[] = [
  svgEntry('castellum', 'castellum', svgTriangle({ fillColor: CONFIRMED_FILL, sizePercent: 31 })),
  svgEntry(
    'pos_castellum',
    'possible castellum',
    svgTriangle({ fillColor: POSSIBLE_FILL, strokeColor: POSSIBLE_STROKE, sizePercent: 31 })
  ),
  svgEntry(
    'legfort',
    'legionary fortress / castra',
    svgNestedSquare({ fillColor: CONFIRMED_FILL, sizePercent: 44 })
  ),
  svgEntry('watchtower', 'watchtower', svgTower()),
  svgEntry('city', 'autonomous city', svgConcentricCircles()),
  svgEntry('cem', '(Roman) cemetery', svgPlus()),
  svgEntry(
    'ptum',
    'possible barrow',
    svgDome({ fillColor: POSSIBLE_FILL, strokeColor: POSSIBLE_STROKE, sizePercent: 31 })
  ),
  svgEntry('tum', '(Prehistoric?) barrow', svgDome({ fillColor: CONFIRMED_FILL, sizePercent: 31 })),
  svgEntry('villa', 'villa', svgDiamond({ fillColor: CONFIRMED_FILL, sizePercent: 31 })),
  svgEntry(
    'pvilla',
    'possible villa',
    svgDiamond({ fillColor: POSSIBLE_FILL, strokeColor: POSSIBLE_STROKE, sizePercent: 31 })
  ),
  // Relative sizes tuned this session: settS is the baseline (31% canvas
  // fill), sett is 75% of that (23%), psett is 50% of that (16%).
  svgEntry(
    'sett',
    'settlement',
    svgSquare({ fillColor: '#ffffff', strokeColor: CONFIRMED_FILL, sizePercent: 23 })
  ),
  svgEntry(
    'psett',
    'possible settlement',
    svgSquare({ fillColor: POSSIBLE_FILL, strokeColor: POSSIBLE_STROKE, sizePercent: 16 })
  ),
  svgEntry('bridge', 'bridge', svgPortal({ fillColor: CONFIRMED_FILL, sizePercent: 23 })),
  svgEntry(
    'histSett',
    'settlement attested only by historical sources',
    svgCircle({ fillColor: CONFIRMED_FILL, sizePercent: 24 })
  ),
  // Solid black fill (vs. sett's white-fill/black-outline above) so the two
  // are distinguishable by more than size alone - stone buildings read as
  // "more substantial", matching the PNG-era intent before both types
  // happened to converge on the same outline style. Per user feedback.
  svgEntry('settS', 'settlement with stone buildings', svgSquare({ fillColor: CONFIRMED_FILL, sizePercent: 31 })),
  svgEntry('sanctuary', 'sanctuary', svgTemple()),
  svgEntry('ship', 'shipwreck', svgHull(CONFIRMED_FILL)),
  svgEntry('pship', 'possible shipwreck', svgHull(POSSIBLE_FILL)),
  svgEntry('site', 'generic site', svgCross({ fillColor: CONFIRMED_FILL, sizePercent: 31 })),
  svgEntry('milestone', 'milestone', svgBollard()),
];

const siteIcon: DivIcon = siteTypeEntries.find((entry) => entry.type === 'site')!.icon as DivIcon;

/** Resolve the marker icon for a given site type, defaulting to the generic site icon. */
export const getSiteIcon = (type?: string): Icon | DivIcon =>
  siteTypeEntries.find((entry) => entry.type === type)?.icon ?? siteIcon;

/** Resolve a `siteType` code to its label, defaulting to 'unknown'. */
export const siteTypeConverter = (siteType?: string): string =>
  siteTypeEntries.find((entry) => entry.type === siteType)?.label ?? 'unknown';
