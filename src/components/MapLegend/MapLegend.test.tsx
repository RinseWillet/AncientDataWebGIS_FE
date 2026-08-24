import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import MapLegend from './MapLegend';
import { demColorRamp } from './demColorRamp';

describe('MapLegend selection behavior', () => {
  afterEach(() => {
    cleanup();
  });

  it('hides entirely while a selection is active, then reappears collapsed once it clears', () => {
    const { rerender, container } = render(<MapLegend hasSelection={false} />);
    expect(screen.getByText('Site Types')).toBeInTheDocument();

    rerender(<MapLegend hasSelection />);
    expect(container).toBeEmptyDOMElement();

    rerender(<MapLegend hasSelection={false} />);
    expect(screen.queryByText('Site Types')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand legend' })).toBeInTheDocument();
  });

  it('renders nothing when hasSelection is already true on first render', () => {
    const { container } = render(<MapLegend hasSelection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not auto-collapse on initial render without a selection', () => {
    render(<MapLegend hasSelection={false} />);
    expect(screen.getByText('Site Types')).toBeInTheDocument();
  });
});

describe('MapLegend', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a labeled row for every site type', () => {
    render(<MapLegend />);

    expect(screen.getByText('castellum')).toBeInTheDocument();
    expect(screen.getByText('possible castellum')).toBeInTheDocument();
    expect(screen.getByText('legionary fortress / castra')).toBeInTheDocument();
    expect(screen.getByText('milestone')).toBeInTheDocument();
  });

  it('renders a labeled row for every road style', () => {
    render(<MapLegend />);

    expect(screen.getByText('Road')).toBeInTheDocument();
    expect(screen.getByText('Possible Road')).toBeInTheDocument();
    expect(screen.getByText('Hypothetical Route')).toBeInTheDocument();
    expect(screen.getByText('Historical Record')).toBeInTheDocument();
  });

  it('keeps the DEM section hidden while there is no active DEM/Physical layer', () => {
    render(<MapLegend />);

    expect(screen.queryByText('Elevation')).not.toBeInTheDocument();
  });

  it('shows the DEM section with the full color ramp and layer metadata when activeDemLayerName is passed through (real useActiveDemLayer, no mock)', () => {
    render(
      <MapLegend activeDemLayerName="Test DEM" activeDemLayerAttribution="Test Attribution" />
    );

    expect(screen.getByText('Elevation')).toBeInTheDocument();
    demColorRamp.forEach((stop) => {
      expect(screen.getByText(stop.label)).toBeInTheDocument();
    });
    expect(screen.getByText('Test DEM — Test Attribution')).toBeInTheDocument();
  });

  it('shows the DEM section once useActiveDemLayer reports an active layer', async () => {
    vi.doMock('./useActiveDemLayer', () => ({
      useActiveDemLayer: () => ({ name: 'Test DEM' }),
    }));
    vi.resetModules();
    const { default: MapLegendWithActiveDem } = await import('./MapLegend');

    render(<MapLegendWithActiveDem />);

    expect(screen.getByText('Elevation')).toBeInTheDocument();

    vi.doUnmock('./useActiveDemLayer');
  });

  it('shows the DEM layer name alone (no dash) when no attribution is provided', () => {
    render(<MapLegend activeDemLayerName="Test DEM" />);

    expect(screen.getByText('Test DEM')).toBeInTheDocument();
  });

  it('shows Site Types and Roads by default when showSites/showRoads are omitted', () => {
    render(<MapLegend />);

    expect(screen.getByText('Site Types')).toBeInTheDocument();
    expect(screen.getByText('Roads')).toBeInTheDocument();
  });

  it('hides the Site Types section when showSites is false', () => {
    render(<MapLegend showSites={false} />);

    expect(screen.queryByText('Site Types')).not.toBeInTheDocument();
    expect(screen.getByText('Roads')).toBeInTheDocument();
  });

  it('hides the Roads section when showRoads is false', () => {
    render(<MapLegend showRoads={false} />);

    expect(screen.queryByText('Roads')).not.toBeInTheDocument();
    expect(screen.getByText('Site Types')).toBeInTheDocument();
  });

  it('collapses to a small toggle button, and expands again', () => {
    render(<MapLegend />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse legend' }));
    expect(screen.queryByText('Site Types')).not.toBeInTheDocument();
    const expandBtn = screen.getByRole('button', { name: 'Expand legend' });
    expect(expandBtn).toBeInTheDocument();

    fireEvent.click(expandBtn);
    expect(screen.getByText('Site Types')).toBeInTheDocument();
  });
});
