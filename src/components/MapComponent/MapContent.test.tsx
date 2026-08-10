import { render, cleanup, waitFor } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { describe, it, expect, vi, afterEach } from 'vitest';
import MapContent from './MapContent';
import type { MutableRefObject } from 'react';
import type L from 'leaflet';

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
    <MapContainer center={[51.8, 5.8]} zoom={9}>
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
});
