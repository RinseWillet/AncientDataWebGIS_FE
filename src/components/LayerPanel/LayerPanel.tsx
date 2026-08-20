import { useEffect, useRef, useState } from 'react';
import { layersConfig, LayerGroupName } from '../MapComponent/layersConfig';
import type {
  LayerPanelControl,
  LayerPanelState,
  OverlayKey,
  PhysicalLayerState,
} from '../MapComponent/useMapInteractions';
import './LayerPanel.css';

interface LayerPanelProps {
  control: LayerPanelControl;
  hasPhotos: boolean;
}

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

interface ToggleableLayerRowsProps {
  layers: PhysicalLayerState[];
  onToggle: (source: string) => void;
  onSetOpacity: (source: string, opacity: number) => void;
  onMove: (source: string, direction: 'up' | 'down') => void;
}

/**
 * Checkbox + opacity slider + reorder rows shared by the "Physical" (DEM)
 * section and "Historical Maps"'s catalog-driven sheet list - both are
 * raster catalog entries (E3-2) the user can independently toggle/layer,
 * unlike the exclusive `layersConfig` radio groups below.
 */
const ToggleableLayerRows = ({ layers, onToggle, onSetOpacity, onMove }: ToggleableLayerRowsProps) => (
  <ul className="layer-panel__section-body">
    {layers.map((layer, index) => {
      const inputId = `layer-panel-toggleable-${layer.source}`;
      return (
        <li className="layer-panel__row layer-panel__row--physical" key={layer.source}>
          <input
            id={inputId}
            className="layer-panel__row-input"
            type="checkbox"
            checked={layer.visible}
            onChange={() => onToggle(layer.source)}
          />
          <label className="layer-panel__row-label" htmlFor={inputId}>
            {layer.name}
          </label>
          <input
            className="layer-panel__opacity-slider"
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={layer.opacity}
            disabled={!layer.visible}
            aria-label={`${layer.name} opacity`}
            onChange={(e) => onSetOpacity(layer.source, Number(e.target.value))}
          />
          <button
            type="button"
            className="layer-panel__order-btn"
            disabled={index === 0}
            aria-label={`Move ${layer.name} up`}
            onClick={() => onMove(layer.source, 'up')}
          >
            &#9650;
          </button>
          <button
            type="button"
            className="layer-panel__order-btn"
            disabled={index === layers.length - 1}
            aria-label={`Move ${layer.name} down`}
            onClick={() => onMove(layer.source, 'down')}
          >
            &#9660;
          </button>
        </li>
      );
    })}
  </ul>
);

interface CollectionToggleCheckboxProps {
  collection: string;
  layers: PhysicalLayerState[];
  onToggleCollection: (collection: string) => void;
}

/** Tri-state "select all" checkbox for one atlas group: checked if every sheet in the
 * collection is visible, indeterminate if only some are, unchecked if none are. Clicking
 * it turns every sheet in the collection on (from off/indeterminate) or off (from all-on) -
 * individual per-sheet checkboxes below remain independently toggleable either way. */
const CollectionToggleCheckbox = ({ collection, layers, onToggleCollection }: CollectionToggleCheckboxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleCount = layers.filter((layer) => layer.visible).length;
  const allVisible = layers.length > 0 && visibleCount === layers.length;
  const someVisible = visibleCount > 0 && !allVisible;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = someVisible;
    }
  }, [someVisible]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      className="layer-panel__row-input"
      checked={allVisible}
      aria-label={`Toggle all ${collection} sheets`}
      onChange={() => onToggleCollection(collection)}
    />
  );
};

interface HistoricalMapCollectionGroup {
  collection: string;
  layers: PhysicalLayerState[];
}

/** Splits catalog-driven historical map sheets into named atlas groups (e.g. "1818 De
 * Man - Nijmegen") plus a flat "ungrouped" bucket for any standalone entry with no
 * `collection` - preserves catalog order both across groups and within each group. */
const groupHistoricalMapSheets = (
  sheets: PhysicalLayerState[]
): { ungrouped: PhysicalLayerState[]; collections: HistoricalMapCollectionGroup[] } => {
  const ungrouped: PhysicalLayerState[] = [];
  const collections: HistoricalMapCollectionGroup[] = [];
  const collectionIndex = new Map<string, number>();

  sheets.forEach((layer) => {
    if (!layer.collection) {
      ungrouped.push(layer);
      return;
    }
    let index = collectionIndex.get(layer.collection);
    if (index === undefined) {
      index = collections.length;
      collectionIndex.set(layer.collection, index);
      collections.push({ collection: layer.collection, layers: [] });
    }
    collections[index].layers.push(layer);
  });

  return { ungrouped, collections };
};

/**
 * Custom, collapsible left sidebar for selecting the active base map,
 * historical/aerial overlay, and sites/roads/photos visibility on the
 * Atlas map. Replaces the Leaflet grouped-layer control there; RoadInfo/
 * SiteInfo keep using `BaseLayers` (the plugin-based control) unchanged.
 */
const LayerPanel = ({ control, hasPhotos }: LayerPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const {
    state,
    selectBaseLayer,
    toggleExclusiveLayer,
    toggleOverlay,
    togglePhysicalLayer,
    setPhysicalLayerOpacity,
    movePhysicalLayer,
    toggleHistoricalMapSheet,
    setHistoricalMapSheetOpacity,
    moveHistoricalMapSheet,
    toggleHistoricalMapCollection,
  } = control;

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

  /** Renders a plain exclusive-select (radio-like) section from `layersConfig`; skipped entirely if empty. */
  const renderExclusiveSection = (group: 'Topographical' | 'Aerial Imagery') => {
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
  };

  const historicalMapEntries = layersConfig.filter((config) => config.group === 'Historical Maps');
  const hasHistoricalMapsContent = historicalMapEntries.length > 0 || state.historicalMapSheets.length > 0;
  const isHistoricalMapsCollapsed = collapsedSections.has('Historical Maps');

  // Only list currently-selectable Historical Maps sheets (E3-8, extending E3-7's viewport-
  // gating with each entry's own zoom.min): out-of-view/below-its-own-floor sheets are hidden
  // entirely rather than shown disabled, matching the Physical group's E3-7 follow-up. Since
  // `groupHistoricalMapSheets` only creates a collection entry for sheets actually present in
  // its input, filtering here first also means an atlas with zero currently-selectable sheets
  // is hidden entirely rather than rendered as an empty subsection, with no extra logic needed.
  const selectableHistoricalMapSheets = state.historicalMapSheets.filter((layer) => !layer.disabled);
  const { ungrouped: ungroupedSheets, collections: sheetCollections } = groupHistoricalMapSheets(
    selectableHistoricalMapSheets
  );

  // Only list currently-selectable Physical rows (E3-7 follow-up, confirmed with the
  // project owner): showing every catalog entry disabled+hinted made the list too
  // cluttered in practice, so out-of-view/below-floor layers are hidden entirely instead,
  // with a single fallback message explaining why the list is empty/shorter than expected.
  const selectablePhysicalLayers = state.physicalLayers.filter((layer) => !layer.disabled);
  const physicalEmptyHint =
    state.physicalLayers.find((layer) => layer.disabled)?.disabledReason ??
    'No Physical layers available here.';

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

      {renderExclusiveSection('Topographical')}

      {/* "Historical Maps": both the exclusive-select third-party NRW WMS basemaps
          (layersConfig) and the checkbox/opacity/reorder catalog-driven scanned map
          sheets (e.g. the De Man 1818 sheets, E3-2) live under one shared header -
          from the user's point of view they're both just "historical maps". */}
      {hasHistoricalMapsContent && (
        <section className="layer-panel__section">
          <button
            type="button"
            className="layer-panel__section-header"
            onClick={() => toggleSection('Historical Maps')}
            aria-expanded={!isHistoricalMapsCollapsed}
          >
            <span className="layer-panel__section-title">Historical Maps</span>
            <span className="layer-panel__section-caret">{isHistoricalMapsCollapsed ? '▸' : '▾'}</span>
          </button>

          {!isHistoricalMapsCollapsed && (
            <>
              {historicalMapEntries.length > 0 && (
                <ul className="layer-panel__section-body">
                  {historicalMapEntries.map((entry) => {
                    const inputId = `layer-panel-Historical Maps-${entry.name}`;
                    const checked = isLayerChecked('Historical Maps', entry.name, state);

                    return (
                      <li className="layer-panel__row" key={entry.name}>
                        <input
                          id={inputId}
                          className="layer-panel__row-input"
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExclusiveLayer('Historical Maps', entry.name)}
                        />
                        <label className="layer-panel__row-label" htmlFor={inputId}>
                          {entry.name}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              {selectableHistoricalMapSheets.length === 0 && state.historicalMapSheets.length > 0 && (
                <p className="layer-panel__section-empty-hint">
                  {state.historicalMapSheets.find((layer) => layer.disabled)?.disabledReason ??
                    'No historical maps match this area/zoom — pan or zoom in to reveal sheets.'}
                </p>
              )}
              {ungroupedSheets.length > 0 && (
                <ToggleableLayerRows
                  layers={ungroupedSheets}
                  onToggle={toggleHistoricalMapSheet}
                  onSetOpacity={setHistoricalMapSheetOpacity}
                  onMove={moveHistoricalMapSheet}
                />
              )}
              {sheetCollections.map(({ collection, layers }) => {
                const sectionKey = `atlas:${collection}`;
                const isCollapsed = collapsedSections.has(sectionKey);

                return (
                  <div className="layer-panel__subsection" key={collection}>
                    <div className="layer-panel__section-header layer-panel__section-header--group">
                      <CollectionToggleCheckbox
                        collection={collection}
                        layers={layers}
                        onToggleCollection={toggleHistoricalMapCollection}
                      />
                      <button
                        type="button"
                        className="layer-panel__section-header-toggle"
                        onClick={() => toggleSection(sectionKey)}
                        aria-expanded={!isCollapsed}
                      >
                        <span className="layer-panel__section-title">{collection}</span>
                        <span className="layer-panel__section-caret">{isCollapsed ? '▸' : '▾'}</span>
                      </button>
                    </div>

                    {!isCollapsed && (
                      <ToggleableLayerRows
                        layers={layers}
                        onToggle={toggleHistoricalMapSheet}
                        onSetOpacity={setHistoricalMapSheetOpacity}
                        onMove={moveHistoricalMapSheet}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </section>
      )}

      {renderExclusiveSection('Aerial Imagery')}

      {state.physicalLayers.length > 0 && (
        <section className="layer-panel__section">
          <button
            type="button"
            className="layer-panel__section-header"
            onClick={() => toggleSection('Physical')}
            aria-expanded={!collapsedSections.has('Physical')}
          >
            <span className="layer-panel__section-title">Physical</span>
            <span className="layer-panel__section-caret">
              {collapsedSections.has('Physical') ? '▸' : '▾'}
            </span>
          </button>

          {!collapsedSections.has('Physical') &&
            (selectablePhysicalLayers.length > 0 ? (
              <ToggleableLayerRows
                layers={selectablePhysicalLayers}
                onToggle={togglePhysicalLayer}
                onSetOpacity={setPhysicalLayerOpacity}
                onMove={movePhysicalLayer}
              />
            ) : (
              <p className="layer-panel__section-empty-hint">{physicalEmptyHint}</p>
            ))}
        </section>
      )}

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
