import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { layersConfig, LayerGroupName } from '../MapComponent/layersConfig';
import {
  HISTORICAL_MAP_SHEET_GATE_HINT,
  type LayerPanelControl,
  type LayerPanelState,
  type OverlayKey,
  type PhysicalLayerState,
} from '../MapComponent/useMapInteractions';
import './LayerPanel.css';

interface LayerPanelProps {
  control: LayerPanelControl;
  hasPhotos: boolean;
  /** Called with this panel's own rendered width (CSS px) on mount and whenever it resizes
   * (including collapsing/expanding, which swaps to/from a much narrower vertical tab). Feeds
   * `useLayerPanelControl`'s viewport-occlusion gating input (see `effectiveViewportBounds` in
   * `mapUtils.ts`) so gating accounts for the map area this panel visually covers. Optional,
   * no-op default so callers/tests that don't care about width don't need to pass it. */
  onWidthChange?: (widthPx: number) => void;
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
  return state.activeAerialLayerNames.includes(entryName);
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

interface LayerCollectionGroup {
  collection: string;
  layers: PhysicalLayerState[];
}

/** Splits a catalog-driven layer list (Historical Maps sheets or Physical/DEM layers) into
 * named groups by `collection` (e.g. "1818 De Man - Nijmegen", or a DEM area like "Swalmen"
 * grouping its DEM + hillshade sibling) plus a flat "ungrouped" bucket for any standalone
 * entry with no `collection` - preserves catalog order both across groups and within each
 * group. */
const groupLayersByCollection = (
  layers: PhysicalLayerState[]
): { ungrouped: PhysicalLayerState[]; collections: LayerCollectionGroup[] } => {
  const ungrouped: PhysicalLayerState[] = [];
  const collections: LayerCollectionGroup[] = [];
  const collectionIndex = new Map<string, number>();

  layers.forEach((layer) => {
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

interface CollectionSubsectionProps {
  collection: string;
  layers: PhysicalLayerState[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggle: (source: string) => void;
  onSetOpacity: (source: string, opacity: number) => void;
  onMove: (source: string, direction: 'up' | 'down') => void;
  onToggleCollection: (collection: string) => void;
}

/** One named, collapsible `collection` group (an atlas or a DEM area) nested inside
 * "Historical Maps"/"Physical" - shared by both since they're both catalog-driven,
 * multi-select, opacity/reorderable layer lists grouped the same way. */
const CollectionSubsection = ({
  collection,
  layers,
  isCollapsed,
  onToggleCollapse,
  onToggle,
  onSetOpacity,
  onMove,
  onToggleCollection,
}: CollectionSubsectionProps) => (
  <div className="layer-panel__subsection">
    <div className="layer-panel__section-header layer-panel__section-header--group">
      <CollectionToggleCheckbox collection={collection} layers={layers} onToggleCollection={onToggleCollection} />
      <button
        type="button"
        className="layer-panel__section-header-toggle"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
      >
        <span className="layer-panel__section-title">{collection}</span>
        <span className="layer-panel__section-caret">{isCollapsed ? '▸' : '▾'}</span>
      </button>
    </div>

    {!isCollapsed && (
      <ToggleableLayerRows layers={layers} onToggle={onToggle} onSetOpacity={onSetOpacity} onMove={onMove} />
    )}
  </div>
);

/**
 * Custom, collapsible left sidebar for selecting the active base map,
 * historical/aerial overlay, and sites/roads/photos visibility on the
 * Atlas map. Replaces the Leaflet grouped-layer control there; RoadInfo/
 * SiteInfo keep using `BaseLayers` (the plugin-based control) unchanged.
 */
const LayerPanel = ({ control, hasPhotos, onWidthChange = () => {} }: LayerPanelProps) => {
  // Starts collapsed on mobile viewports so it doesn't cover most of the screen on open;
  // only seeds the initial value, so a user's own toggle survives later resizes/rotation.
  const isMobile = useMediaQuery({ maxWidth: '600px' });
  const [collapsed, setCollapsed] = useState(isMobile);
  // Top-level sections (Topographical, Historical Maps, Aerial Imagery, Physical, ...):
  // default expanded, so membership here means "explicitly collapsed".
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  // Named subgroups nested inside a section (an aerial-imagery region, a historical atlas, a
  // DEM area): default *collapsed*, so membership here means "explicitly expanded". Otherwise
  // a subgroup that only just became selectable (e.g. panning into its coverage area) would
  // pop open showing every layer inside it, rather than staying tucked away until the user
  // asks to see it - confirmed with the project owner as the preferred, less-cluttered default.
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Measures this panel's own rendered width so the gating hook can exclude the map area it
  // visually covers (see `onWidthChange` doc comment above). A callback ref, not `useRef` +
  // effect, is required: `collapsed` swaps the mounted root element type (`<button>` below vs
  // `<div>` further down), so React unmounts/remounts at this position on every toggle, and a
  // callback ref picks that transition up automatically (called with `null`, then the new
  // node) - attach it to both roots below.
  const panelRootRef = useCallback(
    (node: HTMLElement | null) => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (!node) return;
      onWidthChange(node.getBoundingClientRect().width);
      if (typeof ResizeObserver === 'undefined') return; // not available in the jsdom test env
      const observer = new ResizeObserver(([entry]) => {
        if (entry) onWidthChange(entry.contentRect.width);
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    },
    [onWidthChange]
  );

  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

  const {
    state,
    selectBaseLayer,
    toggleExclusiveLayer,
    toggleOverlay,
    togglePhysicalLayer,
    setPhysicalLayerOpacity,
    movePhysicalLayer,
    togglePhysicalCollection,
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

  const isSubsectionCollapsed = (key: string) => !expandedSubsections.has(key);

  const toggleSubsection = (key: string) => {
    setExpandedSubsections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <button
        ref={panelRootRef}
        type="button"
        className="layer-panel layer-panel--collapsed"
        onClick={() => setCollapsed(false)}
        aria-label="Expand layer panel"
      >
        Layers
      </button>
    );
  }

  /**
   * Renders a plain exclusive-select (radio-like) section from `layersConfig`; skipped
   * entirely if empty. Entries are further split by `groupLabel` into named, collapsible
   * subsections (e.g. "Aerial Imagery"'s Ruhr vs. NRW WMS sources) whenever more than one
   * label is present among the section's entries - each subgroup is selected independently
   * of its siblings (see `toggleExclusiveLayer`'s per-subgroup handling). A single label
   * (as for "Topographical", or an "Aerial Imagery" region on its own) renders flat with no
   * subheader, matching the section's original plain-list appearance.
   */
  const renderExclusiveSection = (group: 'Topographical' | 'Aerial Imagery') => {
    const allEntries = layersConfig.filter((config) => config.group === group);
    if (allEntries.length === 0) return null;
    // Hide (not disable) any entry currently gated off by viewport/zoom (E3-9) - only
    // populated for "Aerial Imagery" today, so this is a no-op for "Topographical".
    const entries = allEntries.filter((entry) => !state.gatedAerialLayerNames.includes(entry.name));
    const isSectionCollapsed = collapsedSections.has(group);

    const subgroupOrder: string[] = [];
    const entriesBySubgroup = new Map<string, typeof entries>();
    entries.forEach((entry) => {
      const label = entry.groupLabel ?? entry.group;
      if (!entriesBySubgroup.has(label)) {
        subgroupOrder.push(label);
        entriesBySubgroup.set(label, []);
      }
      entriesBySubgroup.get(label)?.push(entry);
    });

    const renderEntryRows = (list: typeof entries) => (
      <ul className="layer-panel__section-body">
        {list.map((entry) => {
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
    );

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

        {!isSectionCollapsed && subgroupOrder.length > 1 &&
          subgroupOrder.map((label) => {
            const subsectionKey = `${group}:${label}`;
            const isCollapsed = isSubsectionCollapsed(subsectionKey);

            return (
              <div className="layer-panel__subsection" key={label}>
                <button
                  type="button"
                  className="layer-panel__section-header"
                  onClick={() => toggleSubsection(subsectionKey)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="layer-panel__section-title">{label}</span>
                  <span className="layer-panel__section-caret">{isCollapsed ? '▸' : '▾'}</span>
                </button>
                {!isCollapsed && renderEntryRows(entriesBySubgroup.get(label) ?? [])}
              </div>
            );
          })}
        {!isSectionCollapsed && subgroupOrder.length <= 1 && renderEntryRows(entries)}
        {!isSectionCollapsed && entries.length === 0 && allEntries.length > 0 && (
          <p className="layer-panel__section-empty-hint">
            Pan or zoom in to this layer&apos;s coverage area to enable it.
          </p>
        )}
      </section>
    );
  };

  const historicalMapEntries = layersConfig.filter((config) => config.group === 'Historical Maps');
  const hasHistoricalMapsContent = historicalMapEntries.length > 0 || state.historicalMapSheets.length > 0;
  const isHistoricalMapsCollapsed = collapsedSections.has('Historical Maps');

  // Only list currently-selectable Historical Maps sheets: sheets that don't cover enough of
  // the current viewport (see `HISTORICAL_MAP_SHEET_COVERAGE_THRESHOLD_PERCENT`) are hidden
  // entirely rather than shown disabled, matching the Physical group's E3-7 follow-up. Since
  // `groupLayersByCollection` only creates a collection entry for sheets actually present in
  // its input, filtering here first also means an atlas with zero currently-selectable sheets
  // is hidden entirely rather than rendered as an empty subsection, with no extra logic needed.
  const selectableHistoricalMapSheets = state.historicalMapSheets.filter((layer) => !layer.disabled);
  const { ungrouped: ungroupedSheets, collections: sheetCollections } = groupLayersByCollection(
    selectableHistoricalMapSheets
  );

  // Only list currently-selectable Physical rows (E3-7 follow-up, confirmed with the
  // project owner): showing every catalog entry disabled+hinted made the list too
  // cluttered in practice, so out-of-view/below-floor layers are hidden entirely instead,
  // with a single fallback message explaining why the list is empty/shorter than expected.
  // Grouped by area (e.g. "Swalmen", pairing a DEM with its hillshade sibling) the same way
  // Historical Maps sheets are grouped into atlases.
  const selectablePhysicalLayers = state.physicalLayers.filter((layer) => !layer.disabled);
  const { ungrouped: ungroupedPhysicalLayers, collections: physicalCollections } =
    groupLayersByCollection(selectablePhysicalLayers);
  const physicalEmptyHint =
    state.physicalLayers.find((layer) => layer.disabled)?.disabledReason ??
    'No Physical layers available here.';

  return (
    <div ref={panelRootRef} className="layer-panel">
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
                    HISTORICAL_MAP_SHEET_GATE_HINT}
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
                const subsectionKey = `atlas:${collection}`;
                return (
                  <CollectionSubsection
                    key={collection}
                    collection={collection}
                    layers={layers}
                    isCollapsed={isSubsectionCollapsed(subsectionKey)}
                    onToggleCollapse={() => toggleSubsection(subsectionKey)}
                    onToggle={toggleHistoricalMapSheet}
                    onSetOpacity={setHistoricalMapSheetOpacity}
                    onMove={moveHistoricalMapSheet}
                    onToggleCollection={toggleHistoricalMapCollection}
                  />
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
              <>
                {ungroupedPhysicalLayers.length > 0 && (
                  <ToggleableLayerRows
                    layers={ungroupedPhysicalLayers}
                    onToggle={togglePhysicalLayer}
                    onSetOpacity={setPhysicalLayerOpacity}
                    onMove={movePhysicalLayer}
                  />
                )}
                {physicalCollections.map(({ collection, layers }) => {
                  const subsectionKey = `physical:${collection}`;
                  return (
                    <CollectionSubsection
                      key={collection}
                      collection={collection}
                      layers={layers}
                      isCollapsed={isSubsectionCollapsed(subsectionKey)}
                      onToggleCollapse={() => toggleSubsection(subsectionKey)}
                      onToggle={togglePhysicalLayer}
                      onSetOpacity={setPhysicalLayerOpacity}
                      onMove={movePhysicalLayer}
                      onToggleCollection={togglePhysicalCollection}
                    />
                  );
                })}
              </>
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
