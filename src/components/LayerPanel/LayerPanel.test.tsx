import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import LayerPanel from './LayerPanel';
import type {
  LayerPanelControl,
  OverlayVisibility,
  PhysicalLayerState,
} from '../MapComponent/useMapInteractions';

const buildControl = (overrides: Partial<LayerPanelControl['state']> = {}): {
  control: LayerPanelControl;
  selectBaseLayer: ReturnType<typeof vi.fn>;
  toggleExclusiveLayer: ReturnType<typeof vi.fn>;
  toggleOverlay: ReturnType<typeof vi.fn>;
  togglePhysicalLayer: ReturnType<typeof vi.fn>;
  setPhysicalLayerOpacity: ReturnType<typeof vi.fn>;
  movePhysicalLayer: ReturnType<typeof vi.fn>;
} => {
  const selectBaseLayer = vi.fn();
  const toggleExclusiveLayer = vi.fn();
  const toggleOverlay = vi.fn();
  const togglePhysicalLayer = vi.fn();
  const setPhysicalLayerOpacity = vi.fn();
  const movePhysicalLayer = vi.fn();
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
        activeAerialLayer: null,
        overlayVisibility,
        physicalLayers: [],
        ...overrides,
      },
      selectBaseLayer,
      toggleExclusiveLayer,
      toggleOverlay,
      togglePhysicalLayer,
      setPhysicalLayerOpacity,
      movePhysicalLayer,
    },
    selectBaseLayer,
    toggleExclusiveLayer,
    toggleOverlay,
    togglePhysicalLayer,
    setPhysicalLayerOpacity,
    movePhysicalLayer,
  };
};

const buildPhysicalLayer = (overrides: Partial<PhysicalLayerState> = {}): PhysicalLayerState => ({
  source: 'ancientdata:1818-de-man-a2',
  name: '1818 De Man - Nijmegen, Sheet A2',
  attribution: '1818 De Man - Nijmegen',
  category: 'HISTORICAL_MAP',
  visible: false,
  opacity: 1,
  ...overrides,
});

describe('LayerPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a section per non-empty layersConfig group, plus the overlay group', () => {
    const { control } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Topographical')).toBeInTheDocument();
    expect(screen.getByText('Historical Maps')).toBeInTheDocument();
    expect(screen.getByText('Aerial Imagery')).toBeInTheDocument();
    expect(screen.getByText('Sites, Roads & Photos')).toBeInTheDocument();

    expect(screen.getByLabelText('Positron Modern Topographical')).toBeInTheDocument();
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

    fireEvent.click(screen.getByLabelText('1926'));
    expect(toggleExclusiveLayer).toHaveBeenCalledWith('Aerial Imagery', '1926');
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
    expect(screen.getByLabelText('1926')).toBeInTheDocument();
  });

  it('does not render a Physical section when the raster catalog is empty', () => {
    const { control } = buildControl();
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.queryByText('Physical')).not.toBeInTheDocument();
  });

  it('renders a Physical section row per catalog entry, with an opacity slider and reorder buttons', () => {
    const { control } = buildControl({
      physicalLayers: [
        buildPhysicalLayer({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2' }),
        buildPhysicalLayer({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByText('Physical')).toBeInTheDocument();
    expect(screen.getByLabelText('Sheet A2')).toBeInTheDocument();
    expect(screen.getByLabelText('Sheet A3')).toBeInTheDocument();
    expect(screen.getByLabelText('Sheet A2 opacity')).toBeInTheDocument();
  });

  it('calls togglePhysicalLayer when a Physical row checkbox is clicked', () => {
    const { control, togglePhysicalLayer } = buildControl({
      physicalLayers: [buildPhysicalLayer({ name: 'Sheet A2' })],
    });
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.click(screen.getByLabelText('Sheet A2'));
    expect(togglePhysicalLayer).toHaveBeenCalledWith('ancientdata:1818-de-man-a2');
  });

  it('calls setPhysicalLayerOpacity when the opacity slider changes', () => {
    const { control, setPhysicalLayerOpacity } = buildControl({
      physicalLayers: [buildPhysicalLayer({ name: 'Sheet A2', visible: true })],
    });
    render(<LayerPanel control={control} hasPhotos />);

    fireEvent.change(screen.getByLabelText('Sheet A2 opacity'), { target: { value: '0.5' } });
    expect(setPhysicalLayerOpacity).toHaveBeenCalledWith('ancientdata:1818-de-man-a2', 0.5);
  });

  it('calls movePhysicalLayer and disables the boundary reorder buttons', () => {
    const { control, movePhysicalLayer } = buildControl({
      physicalLayers: [
        buildPhysicalLayer({ source: 'ancientdata:1818-de-man-a2', name: 'Sheet A2' }),
        buildPhysicalLayer({ source: 'ancientdata:1818-de-man-a3', name: 'Sheet A3' }),
      ],
    });
    render(<LayerPanel control={control} hasPhotos />);

    expect(screen.getByLabelText('Move Sheet A2 up')).toBeDisabled();
    expect(screen.getByLabelText('Move Sheet A3 down')).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Move Sheet A2 down'));
    expect(movePhysicalLayer).toHaveBeenCalledWith('ancientdata:1818-de-man-a2', 'down');
  });
});
