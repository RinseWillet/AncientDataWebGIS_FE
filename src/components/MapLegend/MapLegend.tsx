import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { siteTypeEntries } from '../../utils/siteTypesConfig';
import { roadStyleEntries } from '../../utils/roadTypes';
import { useActiveDemLayer } from './useActiveDemLayer';
import { demColorRamp } from './demColorRamp';
import './MapLegend.css';

interface MapLegendProps {
  /** True while a site/road is selected (MapInfoCard/BottomSheetCard is showing) - the legend hides entirely to stay out of its way. */
  hasSelection?: boolean;
  /** Name of the topmost visible Physical layer whose category is DEM, or null if none is visible (see `useActiveDemLayer`). */
  activeDemLayerName?: string | null;
  /** Attribution of that same layer, shown alongside its name under the ramp; null if none is visible. */
  activeDemLayerAttribution?: string | null;
  /** Whether the Site Types section renders, mirroring `LayerPanel`'s sites overlay toggle. Defaults to visible so existing callers are unaffected. */
  showSites?: boolean;
  /** Whether the Roads section renders, mirroring `LayerPanel`'s roads overlay toggle. Defaults to visible so existing callers are unaffected. */
  showRoads?: boolean;
}

/**
 * Collapsible key for the Atlas map: every site type icon/label and road
 * style sample, sourced from the same data MapContent uses to render them
 * (so the legend can never drift out of sync). The DEM color-ramp section
 * stays hidden until a real DEM/Physical layer exists (see
 * `useActiveDemLayer`). Docked on the right edge, mirroring `LayerPanel`'s
 * left dock. `MapInfoCard` also lives on the right edge and spans nearly the
 * full height when a site/road is selected, so there's no free spot to
 * relocate a tab to - instead MapLegend renders nothing at all while
 * `hasSelection` is true, reappearing (still collapsed) once it clears.
 */
const MapLegend = ({
  hasSelection = false,
  activeDemLayerName = null,
  activeDemLayerAttribution = null,
  showSites = true,
  showRoads = true,
}: MapLegendProps) => {
  // Starts collapsed on mobile viewports so it doesn't cover most of the screen on open;
  // only seeds the initial value, so a user's own toggle survives later resizes/rotation.
  const isMobile = useMediaQuery({ maxWidth: '600px' });
  const [collapsed, setCollapsed] = useState(isMobile);
  const [prevHasSelection, setPrevHasSelection] = useState(hasSelection);
  const activeDemLayer = useActiveDemLayer(activeDemLayerName);

  if (hasSelection !== prevHasSelection) {
    setPrevHasSelection(hasSelection);
    if (hasSelection) setCollapsed(true);
  }

  if (hasSelection) {
    return null;
  }

  if (collapsed) {
    return (
      <button
        type="button"
        className="map-legend map-legend--collapsed"
        onClick={() => setCollapsed(false)}
        aria-label="Expand legend"
      >
        Legend
      </button>
    );
  }

  return (
    <div className="map-legend">
      <div className="map-legend__header">
        <button
          type="button"
          className="map-legend__collapse-btn"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse legend"
        >
          &raquo;
        </button>
        <span className="map-legend__title">Legend</span>
      </div>

      {showSites && (
        <section className="map-legend__section">
          <h4 className="map-legend__section-title">Site Types</h4>
          <ul className="map-legend__list">
            {siteTypeEntries.map((entry) => (
              <li className="map-legend__row" key={entry.type}>
                <img className="map-legend__icon" src={entry.iconUrl} alt="" />
                <span className="map-legend__label">{entry.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showRoads && (
        <section className="map-legend__section">
          <h4 className="map-legend__section-title">Roads</h4>
          <ul className="map-legend__list">
            {roadStyleEntries.map((entry) => (
              <li className="map-legend__row" key={entry.type}>
                <span
                  className={`map-legend__swatch${entry.style.dashArray ? ' map-legend__swatch--dashed' : ''}`}
                  style={{
                    borderTopColor: entry.style.color as string,
                    opacity: entry.style.opacity,
                  }}
                />
                <span className="map-legend__label">{entry.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeDemLayer && (
        <section className="map-legend__section">
          <h4 className="map-legend__section-title">Elevation</h4>
          <ul className="map-legend__list">
            {demColorRamp.map((stop) => (
              <li className="map-legend__row" key={stop.quantity}>
                <span className="map-legend__color-swatch" style={{ backgroundColor: stop.color }} />
                <span className="map-legend__label">{stop.label}</span>
              </li>
            ))}
          </ul>
          <p className="map-legend__meta">
            {activeDemLayerName}
            {activeDemLayerAttribution ? ` — ${activeDemLayerAttribution}` : ''}
          </p>
        </section>
      )}
    </div>
  );
};

export default MapLegend;
