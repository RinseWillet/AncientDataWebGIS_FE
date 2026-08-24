import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import MapContent from './MapContent';
import type { MutableRefObject } from 'react';
import type L from 'leaflet';
import { rasterService } from '../../services/RasterService';
import type { RasterLayer } from '../../types/raster';

vi.mock('../../services/RasterService', () => ({
  rasterService: { getCatalog: vi.fn() },
}));

const buildRasterLayer = (overrides: Partial<RasterLayer> = {}): RasterLayer => ({
  name: 'Sheet A2',
  source: 'ancientdata:1818-de-man-a2',
  bounds: { south: 51.79, west: 5.75, north: 51.83, east: 5.84 },
  zoom: { min: 12, max: 19 },
  attribution: '1818 De Man - Nijmegen',
  category: 'HISTORICAL_MAP',
  hillshade: false,
  ...overrides,
});

const siteData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [5, 51] },
      properties: { id: 1, name: 'Test Site', siteType: 'castellum' },
    },
  ],
};

const roadData = { type: 'FeatureCollection', features: [] };

const renderMapContent = (props: Partial<Parameters<typeof MapContent>[0]> = {}) => {
  const setShowInfoCard = vi.fn();
  const setSearchItem = vi.fn();
  const siteMarkersRef: MutableRefObject<Record<string | number, L.Marker>> = { current: {} };

  const result = render(
    // zoom 12 matches buildRasterLayer's default zoom.min, so a default HISTORICAL_MAP
    // fixture stays selectable under E3-8's per-sheet zoom gate (still >= E3-7's Physical
    // floor of 8, so DEM fixtures are unaffected).
    <MapContainer center={[51.8, 5.8]} zoom={12}>
      <MapContent
        siteData={siteData}
        roadData={roadData}
        setShowInfoCard={setShowInfoCard}
        setSearchItem={setSearchItem}
        siteMarkersRef={siteMarkersRef}
        {...props}
      />
    </MapContainer>
  );

  return { ...result, setShowInfoCard, setSearchItem };
};

const clickSiteMarker = (container: HTMLElement) => {
  const marker = container.querySelector('.leaflet-marker-icon');
  if (!marker) throw new Error('site marker not found');
  marker.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};

beforeEach(() => {
  vi.mocked(rasterService.getCatalog).mockResolvedValue([]);
});

describe('MapContent selection behavior', () => {
  afterEach(() => cleanup());

  it('never opens the info card when selectable is false', async () => {
    const { container, setShowInfoCard, setSearchItem } = renderMapContent({ selectable: false });

    clickSiteMarker(container);

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(setShowInfoCard).not.toHaveBeenCalled();
    expect(setSearchItem).not.toHaveBeenCalled();
  });

  it('opens the info card on click when selectable is true (default)', async () => {
    const { container, setShowInfoCard, setSearchItem } = renderMapContent();

    clickSiteMarker(container);

    await waitFor(() => expect(setShowInfoCard).toHaveBeenCalledWith(true));
    expect(setSearchItem).toHaveBeenCalledWith({ type: 'site', id: 1 });
  });
});

describe('MapContent layer chrome', () => {
  afterEach(() => cleanup());

  it('renders a single fixed Positron tile and no layer-control chrome when showLayerChrome is false', () => {
    const { container } = renderMapContent({ showLayerChrome: false });

    expect(container.querySelector('.leaflet-control-layers')).not.toBeInTheDocument();
    const tileImages = container.querySelectorAll('.leaflet-tile-pane .leaflet-layer');
    expect(tileImages).toHaveLength(1);
    const tileImg = container.querySelector('.leaflet-tile-pane img');
    expect(tileImg).toHaveAttribute('src', expect.stringContaining('basemaps.cartocdn.com/light_all'));
  });

  it('renders the grouped layer-control chrome by default (showLayerChrome true)', () => {
    const { container } = renderMapContent();

    expect(container.querySelectorAll('.leaflet-control-layers').length).toBeGreaterThan(0);
  });

  it('renders the custom LayerPanel instead of any Leaflet control chrome when layerPanel is true', () => {
    const { container } = renderMapContent({ layerPanel: true });

    expect(container.querySelector('.layer-panel')).toBeInTheDocument();
    expect(container.querySelector('.leaflet-control-layers')).not.toBeInTheDocument();
  });

  it("passes LayerPanel's sites/roads overlay visibility through to MapLegend's showSites/showRoads, hiding each section when its overlay is toggled off", async () => {
    const { findByLabelText, queryByText } = renderMapContent({ layerPanel: true });

    expect(queryByText('Site Types')).toBeInTheDocument();
    expect(queryByText('Roads')).toBeInTheDocument();

    const sitesCheckbox = await findByLabelText('Archaeological Sites');
    fireEvent.click(sitesCheckbox);
    expect(queryByText('Site Types')).not.toBeInTheDocument();
    expect(queryByText('Roads')).toBeInTheDocument();

    const roadsCheckbox = await findByLabelText('Roads and Routes');
    fireEvent.click(roadsCheckbox);
    expect(queryByText('Roads')).not.toBeInTheDocument();
  });
});

describe('MapContent Physical layers (raster catalog)', () => {
  afterEach(() => cleanup());

  it('adds a WMS tile layer to the map when a Physical catalog entry is toggled visible', async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([buildRasterLayer()]);
    const { container, findByLabelText } = renderMapContent({ layerPanel: true });

    const checkbox = await findByLabelText('Sheet A2');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(
        container.querySelector('.leaflet-tile-pane img[src*="/raster/ancientdata/wms"]')
      ).toBeInTheDocument();
    });
  });

  it('shows MapLegend\'s Elevation section only once a DEM-category (not historical-map) layer is visible', async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([
      buildRasterLayer({ name: 'Historical Sheet', source: 'ancientdata:hist', category: 'HISTORICAL_MAP' }),
      buildRasterLayer({ name: 'Test DEM', source: 'ancientdata:dem', category: 'DEM' }),
    ]);
    const { findByLabelText, queryByText } = renderMapContent({ layerPanel: true });

    const historicalCheckbox = await findByLabelText('Historical Sheet');
    fireEvent.click(historicalCheckbox);
    expect(queryByText('Elevation')).not.toBeInTheDocument();

    const demCheckbox = await findByLabelText('Test DEM');
    fireEvent.click(demCheckbox);
    await waitFor(() => expect(queryByText('Elevation')).toBeInTheDocument());
  });

  it('renders a hillshade catalog entry with the multiply-blend class on its tile layer', async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([
      buildRasterLayer({ name: 'Test Hillshade', source: 'ancientdata:hillshade', category: 'DEM', hillshade: true }),
    ]);
    const { container, findByLabelText } = renderMapContent({ layerPanel: true });

    const checkbox = await findByLabelText('Test Hillshade');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(container.querySelector('.physical-layer--hillshade')).toBeInTheDocument();
    });
  });

  it("does not show MapLegend's Elevation section for a hillshade-only visible DEM layer", async () => {
    // The exact bug this test guards against: a hillshade sibling has no colour ramp of
    // its own, so it shouldn't be treated as "the active DEM" for the legend even though
    // its catalog category is DEM, same as its elevation counterpart.
    vi.mocked(rasterService.getCatalog).mockResolvedValue([
      buildRasterLayer({ name: 'Test Hillshade', source: 'ancientdata:hillshade', category: 'DEM', hillshade: true }),
    ]);
    const { findByLabelText, queryByText } = renderMapContent({ layerPanel: true });

    const checkbox = await findByLabelText('Test Hillshade');
    fireEvent.click(checkbox);

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(queryByText('Elevation')).not.toBeInTheDocument();
  });
});
