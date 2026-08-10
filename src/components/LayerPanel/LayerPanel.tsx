import { useState } from 'react';
import { layersConfig, LayerGroupName } from '../MapComponent/layersConfig';
import type {
  LayerPanelControl,
  LayerPanelState,
  OverlayKey,
} from '../MapComponent/useMapInteractions';
import './LayerPanel.css';

interface LayerPanelProps {
  control: LayerPanelControl;
  hasPhotos: boolean;
}

/** Canonical section order; a section is skipped entirely if it has no entries. */
const LAYER_GROUP_ORDER: LayerGroupName[] = ['Topographical', 'Historical Maps', 'Aerial Imagery'];

const isExclusiveGroup = (
  group: LayerGroupName
): group is 'Historical Maps' | 'Aerial Imagery' =>
  group === 'Historical Maps' || group === 'Aerial Imagery';

/** Whether a given layersConfig entry is the currently active one for its group. */
const isLayerChecked = (
  group: LayerGroupName,
  entryName: string,
  state: LayerPanelState
): boolean => {
  if (group === 'Topographical') return state.activeBaseLayer === entryName;
  if (group === 'Historical Maps') return state.activeHistoricalLayer === entryName;
  return state.activeAerialLayer === entryName;
};

const overlayRows: { key: OverlayKey; label: string }[] = [
  { key: 'sites', label: 'Archaeological Sites' },
  { key: 'roads', label: 'Roads and Routes' },
  { key: 'photos', label: 'Photos' },
];

/**
 * Custom, collapsible left sidebar for selecting the active base map,
 * historical/aerial overlay, and sites/roads/photos visibility on the
 * Atlas map. Replaces the Leaflet grouped-layer control there; RoadInfo/
 * SiteInfo keep using `BaseLayers` (the plugin-based control) unchanged.
 */
const LayerPanel = ({ control, hasPhotos }: LayerPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { state, selectBaseLayer, toggleExclusiveLayer, toggleOverlay } = control;

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <button
        type="button"
        className="layer-panel layer-panel--collapsed"
        onClick={() => setCollapsed(false)}
        aria-label="Expand layer panel"
      >
        Layers
      </button>
    );
  }

  return (
    <div className="layer-panel">
      <div className="layer-panel__header">
        <span className="layer-panel__title">Layers</span>
        <button
          type="button"
          className="layer-panel__collapse-btn"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse layer panel"
        >
          &laquo;
        </button>
      </div>

      {LAYER_GROUP_ORDER.map((group) => {
        const entries = layersConfig.filter((config) => config.group === group);
        if (entries.length === 0) return null;
        const isSectionCollapsed = collapsedSections.has(group);

        return (
          <section className="layer-panel__section" key={group}>
            <button
              type="button"
              className="layer-panel__section-header"
              onClick={() => toggleSection(group)}
              aria-expanded={!isSectionCollapsed}
            >
              <span className="layer-panel__section-title">{group}</span>
              <span className="layer-panel__section-caret">{isSectionCollapsed ? '▸' : '▾'}</span>
            </button>

            {!isSectionCollapsed && (
              <ul className="layer-panel__section-body">
                {entries.map((entry) => {
                  const inputId = `layer-panel-${group}-${entry.name}`;
                  const checked = isLayerChecked(group, entry.name, state);

                  return (
                    <li className="layer-panel__row" key={entry.name}>
                      <input
                        id={inputId}
                        className="layer-panel__row-input"
                        type={group === 'Topographical' ? 'radio' : 'checkbox'}
                        name={group === 'Topographical' ? 'layer-panel-base' : undefined}
                        checked={checked}
                        onChange={() => {
                          if (group === 'Topographical') {
                            selectBaseLayer(entry.name);
                          } else if (isExclusiveGroup(group)) {
                            toggleExclusiveLayer(group, entry.name);
                          }
                        }}
                      />
                      <label className="layer-panel__row-label" htmlFor={inputId}>
                        {entry.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <section className="layer-panel__section">
        <button
          type="button"
          className="layer-panel__section-header"
          onClick={() => toggleSection('Overlays')}
          aria-expanded={!collapsedSections.has('Overlays')}
        >
          <span className="layer-panel__section-title">Sites, Roads &amp; Photos</span>
          <span className="layer-panel__section-caret">
            {collapsedSections.has('Overlays') ? '▸' : '▾'}
          </span>
        </button>

        {!collapsedSections.has('Overlays') && (
          <ul className="layer-panel__section-body">
            {overlayRows
              .filter((row) => row.key !== 'photos' || hasPhotos)
              .map((row) => {
                const inputId = `layer-panel-overlay-${row.key}`;
                return (
                  <li className="layer-panel__row" key={row.key}>
                    <input
                      id={inputId}
                      className="layer-panel__row-input"
                      type="checkbox"
                      checked={state.overlayVisibility[row.key]}
                      onChange={() => toggleOverlay(row.key)}
                    />
                    <label className="layer-panel__row-label" htmlFor={inputId}>
                      {row.label}
                    </label>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default LayerPanel;
