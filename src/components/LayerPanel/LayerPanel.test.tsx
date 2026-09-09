import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import LayerPanel from './LayerPanel';
import {
  HISTORICAL_MAP_SHEET_GATE_HINT,
  type LayerPanelControl,
  type OverlayVisibility,
  type PhysicalLayerState,
} from '../MapComponent/useMapInteractions';

const buildControl = (overrides: Partial<LayerPanelControl['state']> = {}): {
  control: LayerPanelControl;
  selectBaseLayer: ReturnType<typeof vi.fn>;
  toggleExclusiveLayer: ReturnType<typeof vi.fn>;
  toggleOverlay: ReturnType<typeof vi.fn>;
  togglePhysicalLayer: ReturnType<typeof vi.fn>;
  setPhysicalLayerOpacity: ReturnType<typeof vi.fn>;
  movePhysicalLayer: ReturnType<typeof vi.fn>;
  togglePhysicalCollection: ReturnType<typeof vi.fn>;
  toggleHistoricalMapSheet: ReturnType<typeof vi.fn>;
  setHistoricalMapSheetOpacity: ReturnType<typeof vi.fn>;
  moveHistoricalMapSheet: ReturnType<typeof vi.fn>;
  toggleHistoricalMapCollection: ReturnType<typeof vi.fn>;
} => {
  const selectBaseLayer = vi.fn();
  const toggleExclusiveLayer = vi.fn();
  const toggleOverlay = vi.fn();
  const togglePhysicalLayer = vi.fn();
  const setPhysicalLayerOpacity = vi.fn();
  const movePhysicalLayer = vi.fn();
  const togglePhysicalCollection = vi.fn();
  const toggleHistoricalMapSheet = vi.fn();
  const setHistoricalMapSheetOpacity = vi.fn();
  const moveHistoricalMapSheet = vi.fn();
  const toggleHistoricalMapCollection = vi.fn();
  const overlayVisibility: OverlayVisibility = {
    sites: true,
    roads: true,
    photos: true,
    ...overrides.overlayVisibility,
  };

  return {
    control: {
      state: {
        activeBaseLayer: 'Positron Modern Topographical',
        activeHistoricalLayer: null,
        activeAerialLayerNames: [],
        overlayVisibility,
        physicalLayers: [],
        historicalMapSheets: [],
        gatedAerialLayerNames: [],
        ...overrides,
      },
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
    },
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
  };
};

const defaultBounds = { south: 51.14, west: 5.97, north: 51.35, east: 6.41 };

const defaultZoom = { min: 8, max: 18 };

const buildPhysicalLayer = (overrides: Partial<PhysicalLayerState> = {}): PhysicalLayerState => ({
  source: 'ancientdata:merge-swalmen-cog',
  name: 'Swalmen DEM',
  attribution: 'AHN/NRW merged LiDAR DEM',
  category: 'DEM',
  hillshade: false,
  bounds: defaultBounds,
  zoom: defaultZoom,
  visible: false,
  opacity: 1,
  disabled: false,
  disabledReason: null,
  ...overrides,
});

const buildHistoricalMapSheet = (overrides: Partial<PhysicalLayerState> = {}): PhysicalLayerState => ({
  source: 'ancientdata:1818-de-man-a2',
  name: 'Sheet A2',
  attribution: '1818 De Man - Nijmegen',
  category: 'HISTORICAL_MAP',
  collection: '1818 De Man - Nijmegen',
  hillshade: false,
  bounds: defaultBounds,
  zoom: { min: 12, max: 19 },
  visible: false,
  opacity: 1,
  disabled: false,
  disabledReason: null,
  ...overrides,
});

describe('LayerPanel', () => {
  afterEach(() => {
    cleanup();
  });

  // Named subgroups (an aerial-imagery region, a historical atlas, a DEM area) render
  // collapsed by default, so a row inside one is hidden until its own header is clicked.
  const expandSubsection = (label: string) => fireEvent.click(screen.getByText(label));

  it('renders a section per non-empty layersConfig group, plus the overlay group', () => {
    const { control } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Topographical')).toBeInTheDocument();
    expect(screen.getByText('Historical Maps')).toBeInTheDocument();
    expect(screen.getByText('Aerial Imagery')).toBeInTheDocument();
    expect(screen.getByText('Sites, Roads & Photos')).toBeInTheDocument();

    expect(screen.getByLabelText('Positron Modern Topographical')).toBeInTheDocument();
    expandSubsection('Aerial Photos (Ruhr, Germany)');
    expect(screen.getByLabelText('1926')).toBeInTheDocument();
    expect(screen.getByLabelText('Archaeological Sites')).toBeInTheDocument();
  });

  it('hides the Photos row when there are no photo markers', () => {
    const { control } = buildControl();
    render(<LayerPanel control={control} hasPhotos={false} />);

    expect(screen.getByLabelText('Archaeological Sites')).toBeInTheDocument();
    expect(screen.queryByLabelText('Photos')).not.toBeInTheDocument();
  });

  it('calls selectBaseLayer when a different base map radio is chosen', () => {
    const { control, selectBaseLayer } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.click(screen.getByLabelText('Open Street Map Topographical'));

    expect(selectBaseLayer).toHaveBeenCalledWith('Open Street Map Topographical');
  });

  it('calls toggleExclusiveLayer with the group and name for historical/aerial rows', () => {
    const { control, toggleExclusiveLayer } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    expandSubsection('Aerial Photos (Ruhr, Germany)');
    fireEvent.click(screen.getByLabelText('1926'));
    expect(toggleExclusiveLayer).toHaveBeenCalledWith('Aerial Imagery', '1926');
  });

  it('hides a gated-off Aerial Imagery row entirely and shows a fallback message (E3-9)', () => {
    const { control } = buildControl({ gatedAerialLayerNames: ['1926'] });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Aerial Imagery')).toBeInTheDocument();
    expandSubsection('Aerial Photos (Ruhr, Germany)');
    expect(screen.queryByLabelText('1926')).not.toBeInTheDocument();
    expect(screen.getByLabelText('1934')).toBeInTheDocument();
    expect(screen.getByLabelText('1952')).toBeInTheDocument();
  });

  it('shows the empty-state hint when every Aerial Imagery entry is gated off (E3-9)', () => {
    const { control } = buildControl({
      gatedAerialLayerNames: [
        '1926',
        '1934',
        '1952',
        '1952 NRW',
        '1956 NRW',
        '1957 NRW',
        '1958 NRW',
        '1959 NRW',
        '1961 NRW',
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.queryByLabelText('1926')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1934')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1952')).not.toBeInTheDocument();
    expect(
      screen.getByText("Pan or zoom in to this layer's coverage area to enable it.")
    ).toBeInTheDocument();
  });

  it('splits Aerial Imagery entries into named Ruhr/NRW subsections, collapsed until opened, each selected independently', () => {
    const { control, toggleExclusiveLayer } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Aerial Photos (Ruhr, Germany)')).toBeInTheDocument();
    expect(screen.getByText('Aerial Photos (NRW, Germany)')).toBeInTheDocument();
    // Collapsed by default: neither subgroup's rows are in the DOM yet.
    expect(screen.queryByLabelText('1926')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('1952 NRW')).not.toBeInTheDocument();

    expandSubsection('Aerial Photos (NRW, Germany)');
    fireEvent.click(screen.getByLabelText('1952 NRW'));
    expect(toggleExclusiveLayer).toHaveBeenCalledWith('Aerial Imagery', '1952 NRW');
  });

  it('checks an Aerial Imagery row whenever its name is in activeAerialLayerNames, across subgroups', () => {
    const { control } = buildControl({ activeAerialLayerNames: ['1926', '1952 NRW'] });
    render(<LayerPanel control={control} hasPhotos />);

    expandSubsection('Aerial Photos (Ruhr, Germany)');
    expandSubsection('Aerial Photos (NRW, Germany)');
    expect(screen.getByLabelText('1926')).toBeChecked();
    expect(screen.getByLabelText('1952 NRW')).toBeChecked();
    expect(screen.getByLabelText('1934')).not.toBeChecked();
  });

  it('never gates the Topographical section, which has no bounds/zoom on its entries (E3-9)', () => {
    const { control } = buildControl({ gatedAerialLayerNames: ['1926', '1934', '1952'] });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByLabelText('Positron Modern Topographical')).toBeInTheDocument();
    expect(screen.getByLabelText('Open Street Map Topographical')).toBeInTheDocument();
    expect(screen.getByLabelText('Satellite')).toBeInTheDocument();
  });

  it('calls toggleOverlay for sites/roads/photos rows', () => {
    const { control, toggleOverlay } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.click(screen.getByLabelText('Roads and Routes'));
    expect(toggleOverlay).toHaveBeenCalledWith('roads');
  });

  it('collapses the whole panel to a toggle button, and expands it again', () => {
    const { control } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse layer panel' }));
    expect(screen.queryByText('Topographical')).not.toBeInTheDocument();
    const expandBtn = screen.getByRole('button', { name: 'Expand layer panel' });
    expect(expandBtn).toBeInTheDocument();

    fireEvent.click(expandBtn);
    expect(screen.getByText('Topographical')).toBeInTheDocument();
  });

  it('collapses a single section without hiding the others', () => {
    const { control } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.click(screen.getByRole('button', { name: /Topographical/ }));

    expect(screen.queryByLabelText('Positron Modern Topographical')).not.toBeInTheDocument();
    expandSubsection('Aerial Photos (Ruhr, Germany)');
    expect(screen.getByLabelText('1926')).toBeInTheDocument();
  });

  it('does not render a Physical section when the DEM catalog entries are empty', () => {
    const { control } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.queryByText('Physical')).not.toBeInTheDocument();
  });

  it('renders a Physical section row per DEM catalog entry, with an opacity slider and reorder buttons', () => {
    const { control } = buildControl({
      physicalLayers: [
        buildPhysicalLayer({ source: 'ancientdata:swalmen', name: 'Swalmen DEM' }),
        buildPhysicalLayer({ source: 'ancientdata:kleve', name: 'Kleve DEM' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Physical')).toBeInTheDocument();
    expect(screen.getByLabelText('Swalmen DEM')).toBeInTheDocument();
    expect(screen.getByLabelText('Kleve DEM')).toBeInTheDocument();
    expect(screen.getByLabelText('Swalmen DEM opacity')).toBeInTheDocument();
  });

  it('calls togglePhysicalLayer when a Physical row checkbox is clicked', () => {
    const { control, togglePhysicalLayer } = buildControl({
      physicalLayers: [buildPhysicalLayer({ name: 'Swalmen DEM' })],
    });
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.click(screen.getByLabelText('Swalmen DEM'));
    expect(togglePhysicalLayer).toHaveBeenCalledWith('ancientdata:merge-swalmen-cog');
  });

  it('calls setPhysicalLayerOpacity when the opacity slider changes', () => {
    const { control, setPhysicalLayerOpacity } = buildControl({
      physicalLayers: [buildPhysicalLayer({ name: 'Swalmen DEM', visible: true })],
    });
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.change(screen.getByLabelText('Swalmen DEM opacity'), { target: { value: '0.5' } });
    expect(setPhysicalLayerOpacity).toHaveBeenCalledWith('ancientdata:merge-swalmen-cog', 0.5);
  });

  it('calls movePhysicalLayer and disables the boundary reorder buttons', () => {
    const { control, movePhysicalLayer } = buildControl({
      physicalLayers: [
        buildPhysicalLayer({ source: 'ancientdata:swalmen', name: 'Swalmen DEM' }),
        buildPhysicalLayer({ source: 'ancientdata:kleve', name: 'Kleve DEM' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByLabelText('Move Swalmen DEM up')).toBeDisabled();
    expect(screen.getByLabelText('Move Kleve DEM down')).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Move Swalmen DEM down'));
    expect(movePhysicalLayer).toHaveBeenCalledWith('ancientdata:swalmen', 'down');
  });

  it('groups DEM layers sharing a collection into one named, collapsed-by-default area subsection', () => {
    const { control, togglePhysicalCollection } = buildControl({
      physicalLayers: [
        buildPhysicalLayer({
          source: 'ancientdata:swalmen-dem',
          name: 'Swalmen DEM',
          collection: 'Swalmen',
        }),
        buildPhysicalLayer({
          source: 'ancientdata:swalmen-hillshade',
          name: 'Swalmen Hillshade',
          collection: 'Swalmen',
          hillshade: true,
        }),
        buildPhysicalLayer({ source: 'ancientdata:standalone', name: 'Standalone DEM' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Swalmen')).toBeInTheDocument();
    // Collapsed by default; the standalone (ungrouped) DEM renders flat, unaffected.
    expect(screen.queryByLabelText('Swalmen DEM')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Standalone DEM')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Toggle all Swalmen sheets'));
    expect(togglePhysicalCollection).toHaveBeenCalledWith('Swalmen');

    expandSubsection('Swalmen');
    expect(screen.getByLabelText('Swalmen DEM')).toBeInTheDocument();
    expect(screen.getByLabelText('Swalmen Hillshade')).toBeInTheDocument();
  });

  it('hides a gated-off Physical row entirely and shows its reason as a fallback message (E3-7)', () => {
    const { control } = buildControl({
      physicalLayers: [
        buildPhysicalLayer({
          name: 'Swalmen DEM',
          disabled: true,
          disabledReason: 'Zoom in further to enable Physical layers.',
        }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Physical')).toBeInTheDocument();
    expect(screen.queryByLabelText('Swalmen DEM')).not.toBeInTheDocument();
    expect(screen.getByText('Zoom in further to enable Physical layers.')).toBeInTheDocument();
  });

  it('only lists the currently-selectable Physical rows when some are gated and some are not', () => {
    const { control } = buildControl({
      physicalLayers: [
        buildPhysicalLayer({
          source: 'ancientdata:swalmen',
          name: 'Swalmen DEM',
          disabled: true,
          disabledReason: "Pan the map to this layer's area to enable it.",
        }),
        buildPhysicalLayer({ source: 'ancientdata:kleve', name: 'Kleve DEM' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.queryByLabelText('Swalmen DEM')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Kleve DEM')).toBeInTheDocument();
    expect(screen.queryByText("Pan the map to this layer's area to enable it.")).not.toBeInTheDocument();
  });

  it('renders catalog-driven map sheets under the same "Historical Maps" header as the NRW WMS basemap picker', () => {
    const { control } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2' }),
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getAllByText('Historical Maps')).toHaveLength(1);
    // Existing exclusive NRW basemap picker still renders in the same section.
    expect(screen.getByLabelText('1801–1828: Kartenaufnahme der Rheinlande')).toBeInTheDocument();
    // New catalog-driven sheets render alongside it (inside their own collapsed-by-default
    // atlas subsection), with opacity/reorder controls.
    expandSubsection('1818 De Man - Nijmegen');
    expect(screen.getByLabelText('Sheet A2')).toBeInTheDocument();
    expect(screen.getByLabelText('Sheet A2 opacity')).toBeInTheDocument();
  });

  it('calls toggleHistoricalMapSheet when a map sheet row checkbox is clicked', () => {
    const { control, toggleHistoricalMapSheet } = buildControl({
      historicalMapSheets: [buildHistoricalMapSheet({ name: 'Sheet A2' })],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expandSubsection('1818 De Man - Nijmegen');
    fireEvent.click(screen.getByLabelText('Sheet A2'));
    expect(toggleHistoricalMapSheet).toHaveBeenCalledWith('ancientdata:1818-de-man-a2');
  });

  it('calls setHistoricalMapSheetOpacity when a map sheet opacity slider changes', () => {
    const { control, setHistoricalMapSheetOpacity } = buildControl({
      historicalMapSheets: [buildHistoricalMapSheet({ name: 'Sheet A2', visible: true })],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expandSubsection('1818 De Man - Nijmegen');
    fireEvent.change(screen.getByLabelText('Sheet A2 opacity'), { target: { value: '0.5' } });
    expect(setHistoricalMapSheetOpacity).toHaveBeenCalledWith('ancientdata:1818-de-man-a2', 0.5);
  });

  it('calls moveHistoricalMapSheet and disables the boundary reorder buttons', () => {
    const { control, moveHistoricalMapSheet } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2' }),
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expandSubsection('1818 De Man - Nijmegen');
    expect(screen.getByLabelText('Move Sheet A2 up')).toBeDisabled();
    expect(screen.getByLabelText('Move Sheet A3 down')).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Move Sheet A2 down'));
    expect(moveHistoricalMapSheet).toHaveBeenCalledWith('ancientdata:1818-de-man-a2', 'down');
  });

  it('groups sheets sharing a collection under one named atlas subsection', () => {
    const { control } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2' }),
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3' }),
        buildHistoricalMapSheet({
          source: 'ancientdata:kleve-01',
          name: 'Sheet 1',
          collection: '1740 Duchy of Kleve',
        }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('1818 De Man - Nijmegen')).toBeInTheDocument();
    expect(screen.getByText('1740 Duchy of Kleve')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle all 1818 De Man - Nijmegen sheets')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle all 1740 Duchy of Kleve sheets')).toBeInTheDocument();
  });

  it('renders a sheet with no collection flat, without an atlas subsection wrapper', () => {
    const { control } = buildControl({
      historicalMapSheets: [buildHistoricalMapSheet({ name: 'Standalone Sheet', collection: undefined })],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByLabelText('Standalone Sheet')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Toggle all /)).not.toBeInTheDocument();
  });

  it('calls toggleHistoricalMapCollection when an atlas group\'s bulk-toggle checkbox is clicked', () => {
    const { control, toggleHistoricalMapCollection } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2' }),
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.click(screen.getByLabelText('Toggle all 1818 De Man - Nijmegen sheets'));
    expect(toggleHistoricalMapCollection).toHaveBeenCalledWith('1818 De Man - Nijmegen');
  });

  it('shows the atlas bulk-toggle checkbox as indeterminate when only some sheets are visible', () => {
    const { control } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2', visible: true }),
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3', visible: false }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    const bulkToggle = screen.getByLabelText(
      'Toggle all 1818 De Man - Nijmegen sheets'
    ) as HTMLInputElement;
    expect(bulkToggle.indeterminate).toBe(true);
    expect(bulkToggle.checked).toBe(false);
  });

  it('hides a gated-off Historical Maps sheet entirely and shows a fallback message (E3-8)', () => {
    const { control } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({
          collection: undefined,
          disabled: true,
          disabledReason: HISTORICAL_MAP_SHEET_GATE_HINT,
        }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Historical Maps')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sheet A2')).not.toBeInTheDocument();
    expect(screen.getByText(HISTORICAL_MAP_SHEET_GATE_HINT)).toBeInTheDocument();
  });

  it('only lists the currently-selectable Historical Maps sheets when some are gated and some are not', () => {
    const { control } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({
          source: 'ancientdata:1818-de-man-a2',
          name: 'Sheet A2',
          collection: undefined,
          disabled: true,
        }),
        buildHistoricalMapSheet({
          source: 'ancientdata:1818-de-man-a3',
          name: 'Sheet A3',
          collection: undefined,
        }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.queryByLabelText('Sheet A2')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sheet A3')).toBeInTheDocument();
  });

  it('hides an atlas collection entirely when none of its sheets are currently selectable (E3-8)', () => {
    const { control } = buildControl({
      historicalMapSheets: [
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2', disabled: true }),
        buildHistoricalMapSheet({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3', disabled: true }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.queryByText('1818 De Man - Nijmegen')).not.toBeInTheDocument();
    expect(screen.getByText(HISTORICAL_MAP_SHEET_GATE_HINT)).toBeInTheDocument();
  });

  describe('panel width measurement', () => {
    class FakeResizeObserver {
      static instances: FakeResizeObserver[] = [];
      callback: ResizeObserverCallback;
      observedNode: Element | null = null;
      disconnect = vi.fn();

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        FakeResizeObserver.instances.push(this);
      }

      observe(node: Element) {
        this.observedNode = node;
      }

      unobserve() {}
    }

    afterEach(() => {
      FakeResizeObserver.instances = [];
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("calls onWidthChange with the panel's rendered width on mount", () => {
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 260,
      } as DOMRect);
      const { control } = buildControl();
      const onWidthChange = vi.fn();

      render(<LayerPanel control={control} hasPhotos onWidthChange={onWidthChange} />);

      expect(onWidthChange).toHaveBeenCalledWith(260);
    });

    it('calls onWidthChange again when the observed ResizeObserver entry reports a new width', () => {
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 260,
      } as DOMRect);
      const { control } = buildControl();
      const onWidthChange = vi.fn();

      render(<LayerPanel control={control} hasPhotos onWidthChange={onWidthChange} />);
      const observer = FakeResizeObserver.instances[0];

      observer.callback(
        [{ contentRect: { width: 180 } } as ResizeObserverEntry],
        observer as unknown as ResizeObserver
      );

      expect(onWidthChange).toHaveBeenCalledWith(180);
    });

    it('disconnects the old observer and creates a new one when the panel collapses', () => {
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 260,
      } as DOMRect);
      const { control } = buildControl();

      render(<LayerPanel control={control} hasPhotos />);
      const firstObserver = FakeResizeObserver.instances[0];

      fireEvent.click(screen.getByLabelText('Collapse layer panel'));

      expect(firstObserver.disconnect).toHaveBeenCalled();
      expect(FakeResizeObserver.instances).toHaveLength(2);
    });

    it('does not throw and still reports width when ResizeObserver is unavailable', () => {
      vi.stubGlobal('ResizeObserver', undefined);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 260,
      } as DOMRect);
      const { control } = buildControl();
      const onWidthChange = vi.fn();

      expect(() =>
        render(<LayerPanel control={control} hasPhotos onWidthChange={onWidthChange} />)
      ).not.toThrow();
      expect(onWidthChange).toHaveBeenCalledWith(260);
    });
  });
});
