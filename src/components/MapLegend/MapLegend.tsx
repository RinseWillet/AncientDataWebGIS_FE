import { useState } from 'react';
import { siteTypeIconUrls } from '../MapComponent/Styles/markerStyles';
import { siteTypeLabels } from '../../utils/siteTypes';
import { roadStyleEntries } from '../../utils/roadTypes';
import { useActiveDemLayer } from './useActiveDemLayer';
import './MapLegend.css';

interface MapLegendProps {
  /** True while a site/road is selected (MapInfoCard/BottomSheetCard is showing) - the legend hides entirely to stay out of its way. */
  hasSelection?: boolean;
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
const MapLegend = ({ hasSelection = false }: MapLegendProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [prevHasSelection, setPrevHasSelection] = useState(hasSelection);
  const activeDemLayer = useActiveDemLayer();

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
        <span className="map-legend__title">Legend</span>
        <button
          type="button"
          className="map-legend__collapse-btn"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse legend"
        >
          &times;
        </button>
      </div>

      <section className="map-legend__section">
        <h4 className="map-legend__section-title">Site Types</h4>
        <ul className="map-legend__list">
          {Object.entries(siteTypeIconUrls).map(([type, iconUrl]) => (
            <li className="map-legend__row" key={type}>
              <img className="map-legend__icon" src={iconUrl} alt="" />
              <span className="map-legend__label">{siteTypeLabels[type] ?? type}</span>
            </li>
          ))}
        </ul>
      </section>

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

      {activeDemLayer && (
        <section className="map-legend__section">
          <h4 className="map-legend__section-title">Elevation</h4>
        </section>
      )}
    </div>
  );
};

export default MapLegend;
