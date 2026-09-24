/**
 * Parameterized inline-SVG shape generators for site-type marker icons
 * (E16). Each returns raw SVG markup on a `viewBox="0 0 32 32"` canvas -
 * the same 32x32 convention the PNG icons they replace used, so a type's
 * previously-tuned glyph-fill percentage (e.g. settS 31%, sett 23%, psett
 * 16%) carries over directly as `sizePercent` here.
 *
 * The 7 parameterized "family" shapes (square/triangle/diamond/dome/circle/
 * cross/portal) cover every geometric site type. The 7 bespoke pictogram
 * shapes below them are non-parameterized, one-off recreations of their
 * PNG predecessor's silhouette (city/cem/watchtower/sanctuary/ship/milestone;
 * legfort reuses `svgSquare`, not a bespoke shape).
 */

export const CONFIRMED_FILL = '#050505';
export const POSSIBLE_FILL = '#FF0000';
export const POSSIBLE_STROKE = '#FF0000';

const CANVAS = 32;
const CENTER = CANVAS / 2;

interface ShapeOptions {
  fillColor: string;
  strokeColor?: string;
  /** How much of the 32x32 canvas the shape's bounding box fills, e.g. 31 for the baseline. */
  sizePercent: number;
}

const svgWrap = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}">${inner}</svg>`;

const strokeAttr = (strokeColor?: string): string =>
  strokeColor ? ` stroke="${strokeColor}" stroke-width="1"` : '';

/** A square, centered, matching sett/settS/psett's shape family. */
export const svgSquare = ({ fillColor, strokeColor, sizePercent }: ShapeOptions): string => {
  const half = (CANVAS * sizePercent) / 100 / 2;
  return svgWrap(
    `<rect x="${CENTER - half}" y="${CENTER - half}" width="${half * 2}" height="${half * 2}" fill="${fillColor}"${strokeAttr(strokeColor)} />`
  );
};

/** An upward triangle, matching castellum/pos_castellum's shape family. */
export const svgTriangle = ({ fillColor, strokeColor, sizePercent }: ShapeOptions): string => {
  const half = (CANVAS * sizePercent) / 100 / 2;
  const top = CENTER - half;
  const bottom = CENTER + half;
  return svgWrap(
    `<polygon points="${CENTER},${top} ${CENTER + half},${bottom} ${CENTER - half},${bottom}" fill="${fillColor}"${strokeAttr(strokeColor)} />`
  );
};

/** A diamond (rotated square), matching villa/pvilla's shape family. */
export const svgDiamond = ({ fillColor, strokeColor, sizePercent }: ShapeOptions): string => {
  const half = (CANVAS * sizePercent) / 100 / 2;
  return svgWrap(
    `<polygon points="${CENTER},${CENTER - half} ${CENTER + half},${CENTER} ${CENTER},${CENTER + half} ${CENTER - half},${CENTER}" fill="${fillColor}"${strokeAttr(strokeColor)} />`
  );
};

/** A nested square (outer outline frame, gap, solid inner square), matching
 * legfort.png's actual "walled fortress" double-frame silhouette - confirmed
 * by pixel inspection, not the plain single square first assumed. */
export const svgNestedSquare = ({ fillColor, strokeColor, sizePercent }: ShapeOptions): string => {
  const half = (CANVAS * sizePercent) / 100 / 2;
  const outer = half;
  const inner = half * 0.45;
  return svgWrap(
    `<rect x="${CENTER - outer}" y="${CENTER - outer}" width="${outer * 2}" height="${outer * 2}" fill="none" stroke="${strokeColor ?? fillColor}" stroke-width="2" />` +
      `<rect x="${CENTER - inner}" y="${CENTER - inner}" width="${inner * 2}" height="${inner * 2}" fill="${fillColor}" />`
  );
};

/** A rounded dome/mound arc, matching tum/ptum's shape family (a barrow silhouette). */
export const svgDome = ({ fillColor, strokeColor, sizePercent }: ShapeOptions): string => {
  const half = (CANVAS * sizePercent) / 100 / 2;
  const baseY = CENTER + half * 0.6;
  return svgWrap(
    `<path d="M ${CENTER - half} ${baseY} A ${half} ${half * 0.9} 0 0 1 ${CENTER + half} ${baseY} Z" fill="${fillColor}"${strokeAttr(strokeColor)} />`
  );
};

/** A filled circle/dot, used for histSett. */
export const svgCircle = ({ fillColor, strokeColor, sizePercent }: ShapeOptions): string => {
  const r = (CANVAS * sizePercent) / 100 / 2;
  return svgWrap(
    `<circle cx="${CENTER}" cy="${CENTER}" r="${r}" fill="${fillColor}"${strokeAttr(strokeColor)} />`
  );
};

/** An X/cross mark, used for the generic `site` fallback. */
export const svgCross = ({ fillColor, sizePercent }: ShapeOptions): string => {
  const half = (CANVAS * sizePercent) / 100 / 2;
  const w = Math.max(1.5, half * 0.3);
  return svgWrap(
    `<g stroke="${fillColor}" stroke-width="${w}" stroke-linecap="round">` +
      `<line x1="${CENTER - half}" y1="${CENTER - half}" x2="${CENTER + half}" y2="${CENTER + half}" />` +
      `<line x1="${CENTER + half}" y1="${CENTER - half}" x2="${CENTER - half}" y2="${CENTER + half}" />` +
      `</g>`
  );
};

/** A deck-on-two-piers bridge silhouette, matching this session's bridge.png redesign. */
export const svgPortal = ({ fillColor, sizePercent }: ShapeOptions): string => {
  const half = (CANVAS * sizePercent) / 100 / 2;
  const x0 = CENTER - 1.15 * half;
  const x1 = CENTER + 1.15 * half;
  const y0 = CENTER - 0.75 * half;
  const y1 = CENTER + 0.75 * half;
  const deckH = (y1 - y0) * 0.28;
  const pierW = (x1 - x0) * 0.22;
  return svgWrap(
    `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${deckH}" fill="${fillColor}" />` +
      `<rect x="${x0}" y="${y0 + deckH}" width="${pierW}" height="${y1 - (y0 + deckH)}" fill="${fillColor}" />` +
      `<rect x="${x1 - pierW}" y="${y0 + deckH}" width="${pierW}" height="${y1 - (y0 + deckH)}" fill="${fillColor}" />`
  );
};

// ---- Bespoke pictogram shapes (non-parameterized, one per type) ----

/** Two concentric circles (outer ring + filled inner dot), matching city.png's "autonomous city" bullseye. */
export const svgConcentricCircles = (): string =>
  svgWrap(
    `<circle cx="${CENTER}" cy="${CENTER}" r="7" fill="none" stroke="${CONFIRMED_FILL}" stroke-width="1.5" />` +
      `<circle cx="${CENTER}" cy="${CENTER}" r="2" fill="${CONFIRMED_FILL}" />`
  );

/** A plus/cross sign, matching cemetery.png. */
export const svgPlus = (): string => {
  const half = 6;
  const w = 2;
  return svgWrap(
    `<rect x="${CENTER - w / 2}" y="${CENTER - half}" width="${w}" height="${half * 2}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${CENTER - half}" y="${CENTER - w / 2}" width="${half * 2}" height="${w}" fill="${CONFIRMED_FILL}" />`
  );
};

/** A crenellated tower box (3 merlons over a base), matching watchtower.png. */
export const svgTower = (): string => {
  const bodyX0 = CENTER - 5;
  const bodyX1 = CENTER + 5;
  const bodyY0 = CENTER - 2;
  const bodyY1 = CENTER + 7;
  const merlonW = 2.4;
  const merlonH = 3;
  const merlonY = bodyY0 - merlonH;
  const gap = (bodyX1 - bodyX0 - merlonW * 3) / 2;
  return svgWrap(
    `<rect x="${bodyX0}" y="${bodyY0}" width="${bodyX1 - bodyX0}" height="${bodyY1 - bodyY0}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${bodyX0}" y="${merlonY}" width="${merlonW}" height="${merlonH}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${bodyX0 + merlonW + gap}" y="${merlonY}" width="${merlonW}" height="${merlonH}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${bodyX1 - merlonW}" y="${merlonY}" width="${merlonW}" height="${merlonH}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${CENTER - 0.75}" y="${CENTER}" width="1.5" height="${bodyY1 - CENTER}" fill="#fff" />`
  );
};

/** A triangular pediment over columns, matching sanctuary.png's temple silhouette. */
export const svgTemple = (): string => {
  const roofY0 = CENTER - 8;
  const roofY1 = CENTER - 2;
  const baseY = CENTER + 7;
  return svgWrap(
    `<polygon points="${CENTER},${roofY0} ${CENTER + 8},${roofY1} ${CENTER - 8},${roofY1}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${CENTER - 7}" y="${roofY1}" width="14" height="1.5" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${CENTER - 6}" y="${roofY1 + 1.5}" width="1.5" height="${baseY - (roofY1 + 1.5)}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${CENTER - 0.75}" y="${roofY1 + 1.5}" width="1.5" height="${baseY - (roofY1 + 1.5)}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${CENTER + 4.5}" y="${roofY1 + 1.5}" width="1.5" height="${baseY - (roofY1 + 1.5)}" fill="${CONFIRMED_FILL}" />`
  );
};

/** A simplified boat-hull trapezoid, matching ship.png/pship.png. `fillColor` lets the
 * possible-variant (pship) reuse this with the same darkred convention as everything else. */
export const svgHull = (fillColor: string = CONFIRMED_FILL): string =>
  svgWrap(
    `<polygon points="${CENTER - 7},${CENTER - 2} ${CENTER + 7},${CENTER - 2} ${CENTER + 4},${CENTER + 4} ${CENTER - 4},${CENTER + 4}" fill="${fillColor}" />`
  );

/** A rounded-top post on a small base, matching milestone.png's bollard silhouette. */
export const svgBollard = (): string => {
  // A slender post with a flat bottom, rounded top only, flush against the
  // base with zero gap. A plain `<rect rx>` rounds all four corners (giving
  // a floating-capsule look with a rounded, disconnected-looking bottom) -
  // this uses a path instead so only the top two corners round.
  const postHalfWidth = 2;
  const postTop = CENTER - 6;
  const postBottom = CENTER + 5;
  const r = postHalfWidth;
  const postPath =
    `M ${CENTER - postHalfWidth} ${postBottom} ` +
    `L ${CENTER - postHalfWidth} ${postTop + r} ` +
    `A ${r} ${r} 0 0 1 ${CENTER + postHalfWidth} ${postTop + r} ` +
    `L ${CENTER + postHalfWidth} ${postBottom} Z`;
  return svgWrap(
    `<path d="${postPath}" fill="${CONFIRMED_FILL}" />` +
      `<rect x="${CENTER - 5}" y="${postBottom}" width="10" height="2" fill="${CONFIRMED_FILL}" />`
  );
};
