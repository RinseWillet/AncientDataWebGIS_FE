import L from 'leaflet';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rasterService } from '../../services/RasterService';
import type { RasterLayer } from '../../types/raster';
import { gatePhysicalLayer, PHYSICAL_MIN_ZOOM_FLOOR, useLayerPanelControl } from './useMapInteractions';

vi.mock('../../services/RasterService', () => ({
  rasterService: { getCatalog: vi.fn() },
}));

const swalmenBounds = { south: 51.14, west: 5.97, north: 51.35, east: 6.41 };
const inViewViewport = L.latLngBounds([51.2, 6.1], [51.25, 6.15]);
const outOfViewViewport = L.latLngBounds([52.5, 8], [53, 9]);

const fakeMap = (zoom: number, bounds: L.LatLngBounds): L.Map =>
  ({
    getZoom: () => zoom,
    getBounds: () => bounds,
  }) as unknown as L.Map;

describe('gatePhysicalLayer (E3-7)', () => {
  it('never gates an already-visible layer, even below the zoom floor and out of view', () => {
    const result = gatePhysicalLayer(
      { visible: true, bounds: swalmenBounds },
      fakeMap(1, outOfViewViewport)
    );
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('does not gate when there is no map yet', () => {
    const result = gatePhysicalLayer({ visible: false, bounds: swalmenBounds }, null);
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('gates below the global zoom floor with a zoom hint, regardless of bounds', () => {
    const result = gatePhysicalLayer(
      { visible: false, bounds: swalmenBounds },
      fakeMap(PHYSICAL_MIN_ZOOM_FLOOR - 1, inViewViewport)
    );
    expect(result).toEqual({
      disabled: true,
      disabledReason: 'Zoom in further to enable Physical layers.',
    });
  });

  it('does not gate on zoom exactly at the floor', () => {
    const result = gatePhysicalLayer(
      { visible: false, bounds: swalmenBounds },
      fakeMap(PHYSICAL_MIN_ZOOM_FLOOR, inViewViewport)
    );
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('gates an out-of-view layer at/above the zoom floor with a pan hint', () => {
    const result = gatePhysicalLayer(
      { visible: false, bounds: swalmenBounds },
      fakeMap(PHYSICAL_MIN_ZOOM_FLOOR, outOfViewViewport)
    );
    expect(result).toEqual({
      disabled: true,
      disabledReason: "Pan the map to this layer's area to enable it.",
    });
  });

  it('does not gate a layer that is in view and at/above the zoom floor', () => {
    const result = gatePhysicalLayer(
      { visible: false, bounds: swalmenBounds },
      fakeMap(PHYSICAL_MIN_ZOOM_FLOOR, inViewViewport)
    );
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });
});

// End-to-end through the real hook + a real (jsdom) Leaflet map, so these cover the actual
// `togglePhysicalLayer` gate (E3-7's "enabling one is blocked"), not just `gatePhysicalLayer`'s
// disabled-flag computation above. jsdom containers report a 0x0 size, so `map.getBounds()`
// degenerates to the single point at the map center - "in view" here means that center point
// falls inside the layer's bounds, "out of view" means it doesn't; either way it's the same
// intersection check `boundsIntersectViewport` uses for a real, sized viewport.
const swalmenDem: RasterLayer = {
  name: 'Swalmen DEM',
  source: 'ancientdata:merge_swalmen_cog',
  bounds: swalmenBounds,
  zoom: { min: 8, max: 17 },
  attribution: 'AHN3 & DGM1 LiDAR',
  category: 'DEM',
  hillshade: false,
};

const insideSwalmenBounds: [number, number] = [51.2, 6.2];
const outsideSwalmenBounds: [number, number] = [53, 9];

describe('useLayerPanelControl Physical-layer toggle gating (E3-7)', () => {
  let container: HTMLDivElement;
  let map: L.Map;

  beforeEach(() => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([swalmenDem]);
    container = document.createElement('div');
    document.body.appendChild(container);
    map = L.map(container);
  });

  afterEach(() => {
    map.remove();
    container.remove();
  });

  it('blocks turning on an out-of-view layer, and allows it once panned into view', async () => {
    map.setView(outsideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.physicalLayers).toHaveLength(1));
    expect(result.current.state.physicalLayers[0].disabled).toBe(true);

    act(() => result.current.togglePhysicalLayer(swalmenDem.source));
    expect(result.current.state.physicalLayers[0].visible).toBe(false);

    act(() => map.setView(insideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR));
    await waitFor(() => expect(result.current.state.physicalLayers[0].disabled).toBe(false));

    act(() => result.current.togglePhysicalLayer(swalmenDem.source));
    expect(result.current.state.physicalLayers[0].visible).toBe(true);
  });

  it('blocks turning on any Physical layer below the global zoom floor', async () => {
    map.setView(insideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR - 1);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.physicalLayers).toHaveLength(1));
    expect(result.current.state.physicalLayers[0].disabledReason).toBe(
      'Zoom in further to enable Physical layers.'
    );

    act(() => result.current.togglePhysicalLayer(swalmenDem.source));
    expect(result.current.state.physicalLayers[0].visible).toBe(false);
  });

  it('auto-turns off an already-visible layer once it is panned out of view, and it re-enables normally once back in range', async () => {
    map.setView(insideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.physicalLayers).toHaveLength(1));

    act(() => result.current.togglePhysicalLayer(swalmenDem.source));
    expect(result.current.state.physicalLayers[0].visible).toBe(true);

    // Panning away must not leave it checked-but-hidden forever requesting tiles for
    // wherever the user now is - it should turn itself off, not just become un-toggleable.
    act(() => map.setView(outsideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR));
    await waitFor(() => expect(result.current.state.physicalLayers[0].visible).toBe(false));

    act(() => map.setView(insideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR));
    await waitFor(() => expect(result.current.state.physicalLayers[0].disabled).toBe(false));
    act(() => result.current.togglePhysicalLayer(swalmenDem.source));
    expect(result.current.state.physicalLayers[0].visible).toBe(true);
  });

  it('auto-turns off an already-visible layer once zoomed below the global floor', async () => {
    map.setView(insideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.physicalLayers).toHaveLength(1));

    act(() => result.current.togglePhysicalLayer(swalmenDem.source));
    expect(result.current.state.physicalLayers[0].visible).toBe(true);

    act(() => map.setView(insideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR - 1));
    await waitFor(() => expect(result.current.state.physicalLayers[0].visible).toBe(false));
  });

  it('reorders "move" past a currently-hidden (gated-off) neighbor, matching the filtered LayerPanel list', async () => {
    // A and C both cover the map center (selectable); B doesn't (gated off, hidden from the
    // LayerPanel list) - "move A down" should swap A with the next *visible* neighbor (C),
    // not silently swap with the hidden B and appear to do nothing in the UI.
    const layerA: RasterLayer = { ...swalmenDem, name: 'Layer A', source: 'ancientdata:a' };
    const layerB: RasterLayer = {
      ...swalmenDem,
      name: 'Layer B',
      source: 'ancientdata:b',
      bounds: { south: 40, west: 0, north: 41, east: 1 },
    };
    const layerC: RasterLayer = {
      ...swalmenDem,
      name: 'Layer C',
      source: 'ancientdata:c',
      bounds: { south: 51.0, west: 6.0, north: 51.4, east: 6.4 },
    };
    vi.mocked(rasterService.getCatalog).mockResolvedValue([layerA, layerB, layerC]);

    map.setView(insideSwalmenBounds, PHYSICAL_MIN_ZOOM_FLOOR);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.physicalLayers).toHaveLength(3));
    expect(result.current.state.physicalLayers.map((layer) => layer.source)).toEqual([
      'ancientdata:a',
      'ancientdata:b',
      'ancientdata:c',
    ]);
    expect(result.current.state.physicalLayers[1].disabled).toBe(true);

    act(() => result.current.movePhysicalLayer('ancientdata:a', 'down'));

    expect(result.current.state.physicalLayers.map((layer) => layer.source)).toEqual([
      'ancientdata:c',
      'ancientdata:b',
      'ancientdata:a',
    ]);
  });
});
