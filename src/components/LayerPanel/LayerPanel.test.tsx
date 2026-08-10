import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import LayerPanel from './LayerPanel';
import type { LayerPanelControl, OverlayVisibility } from '../MapComponent/useMapInteractions';

const buildControl = (overrides: Partial<LayerPanelControl['state']> = {}): {
  control: LayerPanelControl;
  selectBaseLayer: ReturnType<typeof vi.fn>;
  toggleExclusiveLayer: ReturnType<typeof vi.fn>;
  toggleOverlay: ReturnType<typeof vi.fn>;
} => {
  const selectBaseLayer = vi.fn();
  const toggleExclusiveLayer = vi.fn();
  const toggleOverlay = vi.fn();
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
        ...overrides,
      },
      selectBaseLayer,
      toggleExclusiveLayer,
      toggleOverlay,
    },
    selectBaseLayer,
    toggleExclusiveLayer,
    toggleOverlay,
  };
};

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
});
