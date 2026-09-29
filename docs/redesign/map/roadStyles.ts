import type { PathOptions } from 'leaflet';
import type { Theme } from '../theme/useTheme';

/**
 * Roads by evidence — the one rule shared by Day, Night and Hercules:
 *   road               → solid      (excavated / observed)
 *   possible road      → dashed     (traced, course reconstructed)
 *   hypothetical route → dotted     (hypothetical)
 *   hist_rec           → thin dash-dot, muted (historical record only)
 *
 * Day/Night draw each road twice: a dark casing underneath and a cream line on top.
 * In Leaflet that means two L.geoJSON layers from the same data (casing first), or one
 * FeatureGroup with both. Hercules drops the casing and adds a glow via CSS
 * (see .leaflet-overlay-pane path rule at the bottom of this file).
 *
 * Replaces the per-type colours in MapComponent/Styles/markerStyles.ts; keep
 * roadStyleEntries in utils/roadTypes.ts and just point it at these.
 */
type Evidence = 'road' | 'possible road' | 'hypothetical route' | 'hist_rec';

const dash: Record<Evidence, string | undefined> = {
  road: undefined,
  'possible road': '10 6',
  'hypothetical route': '0.1 9', // with lineCap 'round' this draws dots
  hist_rec: '6 4 1 4',
};

const palette = {
  day: { line: '#F2E6C9', casing: '#0A0E13', muted: '#5A5E55' },
  night: { line: '#F2E6C9', casing: '#0B1016', muted: '#9EA9BE' },
  hercules: { line: '#8CFFA6', casing: 'transparent', muted: '#2C9A4C' },
} as const;

/** Style for the top (visible) line. */
export const roadLineStyle = (type: string, theme: Theme): PathOptions => {
  const p = palette[theme];
  const t = (type as Evidence) in dash ? (type as Evidence) : undefined;
  if (!t) return { opacity: 0 }; // unknown type: hidden, as before
  const isHist = t === 'hist_rec';
  return {
    color: isHist ? p.muted : p.line,
    weight: isHist ? 1.6 : theme === 'hercules' ? 2.4 : 3.2,
    opacity: 1,
    dashArray: dash[t],
    lineCap: 'round',
    lineJoin: 'round',
    className: `road road--${t.replace(' ', '-')}`,
  };
};

/** Style for the casing drawn underneath (Day/Night only). */
export const roadCasingStyle = (type: string, theme: Theme): PathOptions => {
  const p = palette[theme];
  if (theme === 'hercules' || type === 'hist_rec' || !((type as Evidence) in dash)) return { opacity: 0 };
  return {
    color: p.casing,
    weight: 5.6,
    opacity: 1,
    dashArray: dash[type as Evidence],
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false,
  };
};

/** Selected road: a soft red halo under the casing. */
export const roadHaloStyle = (theme: Theme): PathOptions => ({
  color: theme === 'hercules' ? '#8CFFA6' : '#D7261E',
  weight: 16,
  opacity: theme === 'hercules' ? 0.25 : 0.3,
  lineCap: 'round',
  interactive: false,
});

/* Add to your CSS for the Hercules glow:
[data-theme='hercules'] .leaflet-overlay-pane path.road { filter: drop-shadow(0 0 3px rgba(140,255,166,.7)); }
*/
