import L from 'leaflet';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rasterService } from '../../services/RasterService';
import type { RasterLayer } from '../../types/raster';
import { layersConfig, WmsLayerConfig } from './layersConfig';
import {
  gateExclusiveLayerConfig,
  gateHistoricalMapSheet,
  gatePhysicalLayer,
  HISTORICAL_MAP_SHEET_GATE_HINT,
  PHYSICAL_MIN_ZOOM_FLOOR,
  useLayerPanelControl,
} from './useMapInteractions';

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

// E3-8: extends E3-7's viewport gating to Historical Maps sheets, but against each entry's own
// `zoom.min` instead of one shared floor - a small cadastral sheet stays gated at a wide zoom
// where a De Man-scale historical topo sheet would already be selectable.
const deManSheetA2: RasterLayer = {
  name: 'Sheet A2',
  source: 'ancientdata:1818-de-man-a2',
  bounds: swalmenBounds,
  zoom: { min: 12, max: 19 },
  attribution: '1818 De Man - Nijmegen',
  category: 'HISTORICAL_MAP',
  collection: '1818 De Man - Nijmegen',
  hillshade: false,
};

describe('gateHistoricalMapSheet (E3-8)', () => {
  it('never gates an already-visible sheet, even below its own zoom floor and out of view', () => {
    const result = gateHistoricalMapSheet(
      { visible: true, bounds: swalmenBounds, zoom: deManSheetA2.zoom },
      fakeMap(1, outOfViewViewport)
    );
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('does not gate when there is no map yet', () => {
    const result = gateHistoricalMapSheet(
      { visible: false, bounds: swalmenBounds, zoom: deManSheetA2.zoom },
      null
    );
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it("gates below the sheet's own zoom.min, regardless of bounds", () => {
    const result = gateHistoricalMapSheet(
      { visible: false, bounds: swalmenBounds, zoom: deManSheetA2.zoom },
      fakeMap(deManSheetA2.zoom.min - 1, inViewViewport)
    );
    expect(result).toEqual({ disabled: true, disabledReason: HISTORICAL_MAP_SHEET_GATE_HINT });
  });

  it('does not gate on zoom exactly at the sheet own zoom.min', () => {
    const result = gateHistoricalMapSheet(
      { visible: false, bounds: swalmenBounds, zoom: deManSheetA2.zoom },
      fakeMap(deManSheetA2.zoom.min, inViewViewport)
    );
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('gates an out-of-view sheet at/above its own zoom.min', () => {
    const result = gateHistoricalMapSheet(
      { visible: false, bounds: swalmenBounds, zoom: deManSheetA2.zoom },
      fakeMap(deManSheetA2.zoom.min, outOfViewViewport)
    );
    expect(result).toEqual({ disabled: true, disabledReason: HISTORICAL_MAP_SHEET_GATE_HINT });
  });

  it('does not gate a sheet that is in view and at/above its own zoom.min', () => {
    const result = gateHistoricalMapSheet(
      { visible: false, bounds: swalmenBounds, zoom: deManSheetA2.zoom },
      fakeMap(deManSheetA2.zoom.min, inViewViewport)
    );
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it("a tiny cadastral-scale sheet stays gated at a wide zoom that already selects a city-scale sheet", () => {
    // Both sheets' bounds are fully inside a BENELUX-wide viewport (containment, not just
    // overlap) - only the per-entry zoom floor tells them apart, which is the whole point of
    // this story: a single shared floor couldn't distinguish them.
    const wideViewport = L.latLngBounds([50, 3], [53, 8]);
    const cadastralZoom = { min: 18, max: 20 };
    const cityScale = gateHistoricalMapSheet(
      { visible: false, bounds: swalmenBounds, zoom: deManSheetA2.zoom },
      fakeMap(14, wideViewport)
    );
    const cadastral = gateHistoricalMapSheet(
      { visible: false, bounds: swalmenBounds, zoom: cadastralZoom },
      fakeMap(14, wideViewport)
    );
    expect(cityScale.disabled).toBe(false);
    expect(cadastral.disabled).toBe(true);
  });
});

describe('useLayerPanelControl Historical Maps sheet toggle gating (E3-8)', () => {
  let container: HTMLDivElement;
  let map: L.Map;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    map = L.map(container);
  });

  afterEach(() => {
    map.remove();
    container.remove();
  });

  it('blocks turning on an out-of-view sheet, and allows it once panned into view', async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([deManSheetA2]);
    map.setView(outsideSwalmenBounds, deManSheetA2.zoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(1));
    expect(result.current.state.historicalMapSheets[0].disabled).toBe(true);

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(false);

    act(() => map.setView(insideSwalmenBounds, deManSheetA2.zoom.min));
    await waitFor(() => expect(result.current.state.historicalMapSheets[0].disabled).toBe(false));

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(true);
  });

  it("blocks turning on a sheet below its own zoom.min", async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([deManSheetA2]);
    map.setView(insideSwalmenBounds, deManSheetA2.zoom.min - 1);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(1));
    expect(result.current.state.historicalMapSheets[0].disabledReason).toBe(HISTORICAL_MAP_SHEET_GATE_HINT);

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(false);
  });

  it('auto-turns off an already-visible sheet once zoomed below its own zoom.min', async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([deManSheetA2]);
    map.setView(insideSwalmenBounds, deManSheetA2.zoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(1));

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(true);

    act(() => map.setView(insideSwalmenBounds, deManSheetA2.zoom.min - 1));
    await waitFor(() => expect(result.current.state.historicalMapSheets[0].visible).toBe(false));
  });

  it('reorders "move" past a currently-hidden (gated-off) neighbor sheet', async () => {
    const sheetA: RasterLayer = { ...deManSheetA2, name: 'Sheet A', source: 'ancientdata:a' };
    const sheetB: RasterLayer = {
      ...deManSheetA2,
      name: 'Sheet B',
      source: 'ancientdata:b',
      bounds: { south: 40, west: 0, north: 41, east: 1 },
    };
    const sheetC: RasterLayer = {
      ...deManSheetA2,
      name: 'Sheet C',
      source: 'ancientdata:c',
      bounds: { south: 51.0, west: 6.0, north: 51.4, east: 6.4 },
    };
    vi.mocked(rasterService.getCatalog).mockResolvedValue([sheetA, sheetB, sheetC]);

    map.setView(insideSwalmenBounds, deManSheetA2.zoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(3));
    expect(result.current.state.historicalMapSheets[1].disabled).toBe(true);

    act(() => result.current.moveHistoricalMapSheet('ancientdata:a', 'down'));

    expect(result.current.state.historicalMapSheets.map((layer) => layer.source)).toEqual([
      'ancientdata:c',
      'ancientdata:b',
      'ancientdata:a',
    ]);
  });

  it("select-all only touches currently-selectable sheets in a collection, leaving a gated-off sheet untouched", async () => {
    const sheetInView: RasterLayer = { ...deManSheetA2, name: 'Sheet In View', source: 'ancientdata:in-view' };
    const sheetOutOfView: RasterLayer = {
      ...deManSheetA2,
      name: 'Sheet Out Of View',
      source: 'ancientdata:out-of-view',
      bounds: { south: 40, west: 0, north: 41, east: 1 },
    };
    vi.mocked(rasterService.getCatalog).mockResolvedValue([sheetInView, sheetOutOfView]);

    map.setView(insideSwalmenBounds, deManSheetA2.zoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(2));
    expect(result.current.state.historicalMapSheets[1].disabled).toBe(true);

    act(() => result.current.toggleHistoricalMapCollection(deManSheetA2.collection as string));

    expect(result.current.state.historicalMapSheets[0].visible).toBe(true);
    expect(result.current.state.historicalMapSheets[1].visible).toBe(false);
  });
});

// E3-9: extends E3-7/E3-8's viewport-gating principle to the static `layersConfig`-driven
// "Aerial Imagery" exclusive group (the three Ruhr `lubi_*` WMS layers only cover the Ruhr
// metropolitan area). Unlike the DB-backed raster catalog, there's no per-instance `visible`
// flag - `isActive` takes its place, checked against the single `activeAerialLayer` name.
const lubi1926 = layersConfig.find(
  (config): config is WmsLayerConfig => config.group === 'Aerial Imagery' && config.name === '1926'
) as WmsLayerConfig;
const ruhrZoom = lubi1926.zoom as { min: number; max: number };
// `inViewViewport`/`outOfViewViewport` above are scoped to `swalmenBounds`, not the real Ruhr
// bounding box (`lubi1926.bounds`), so gateExclusiveLayerConfig's tests need their own.
const ruhrInViewViewport = L.latLngBounds([51.4, 7.0], [51.6, 7.3]);

describe('gateExclusiveLayerConfig (E3-9)', () => {
  it('never gates the currently active layer, even below zoom.min and out of view', () => {
    const result = gateExclusiveLayerConfig(lubi1926, true, fakeMap(1, outOfViewViewport));
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('does not gate when there is no map yet', () => {
    const result = gateExclusiveLayerConfig(lubi1926, false, null);
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('never gates a config with no bounds (e.g. Topographical/ungated WMS entries)', () => {
    const result = gateExclusiveLayerConfig({}, false, fakeMap(1, outOfViewViewport));
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('gates below the zoom floor with a zoom hint, regardless of bounds', () => {
    const result = gateExclusiveLayerConfig(
      lubi1926,
      false,
      fakeMap(ruhrZoom.min - 1, ruhrInViewViewport)
    );
    expect(result).toEqual({ disabled: true, disabledReason: 'Zoom in further to enable this layer.' });
  });

  it('does not gate on zoom exactly at the floor', () => {
    const result = gateExclusiveLayerConfig(lubi1926, false, fakeMap(ruhrZoom.min, ruhrInViewViewport));
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('gates an out-of-view layer at/above the zoom floor with a pan hint', () => {
    const result = gateExclusiveLayerConfig(lubi1926, false, fakeMap(ruhrZoom.min, outOfViewViewport));
    expect(result).toEqual({
      disabled: true,
      disabledReason: "Pan the map to this layer's area to enable it.",
    });
  });

  it('does not gate a layer that is in view and at/above the zoom floor', () => {
    const result = gateExclusiveLayerConfig(lubi1926, false, fakeMap(ruhrZoom.min, ruhrInViewViewport));
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });
});

describe('useLayerPanelControl Aerial Imagery exclusive-layer gating (E3-9)', () => {
  const insideRuhrBounds: [number, number] = [51.5, 7.0];

  let container: HTMLDivElement;
  let map: L.Map;

  beforeEach(() => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([]);
    container = document.createElement('div');
    document.body.appendChild(container);
    map = L.map(container);
  });

  afterEach(() => {
    map.remove();
    container.remove();
  });

  it('gatedAerialLayerNames lists all three Ruhr entries when out of range, none when in range', async () => {
    map.setView(outsideSwalmenBounds, ruhrZoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));
    expect([...result.current.state.gatedAerialLayerNames].sort()).toEqual(['1926', '1934', '1952']);

    act(() => map.setView(insideRuhrBounds, ruhrZoom.min));
    await waitFor(() => expect(result.current.state.gatedAerialLayerNames).toEqual([]));
  });

  it('blocks activating an out-of-view layer, and allows it once panned into view', async () => {
    map.setView(outsideSwalmenBounds, ruhrZoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayer).toBeNull();

    act(() => map.setView(insideRuhrBounds, ruhrZoom.min));
    await waitFor(() => expect(result.current.state.gatedAerialLayerNames).not.toContain('1926'));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayer).toBe('1926');
  });

  it('blocks activating any Aerial Imagery layer below its zoom floor', () => {
    map.setView(insideRuhrBounds, ruhrZoom.min - 1);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayer).toBeNull();
  });

  it('auto-deactivates the active layer once panned out of view, and it re-activates normally once back in range', async () => {
    map.setView(insideRuhrBounds, ruhrZoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayer).toBe('1926');

    // Panning away must not leave it active-but-hidden forever requesting tiles for wherever
    // the user now is - it should deactivate itself, not just become un-toggleable.
    act(() => map.setView(outsideSwalmenBounds, ruhrZoom.min));
    await waitFor(() => expect(result.current.state.activeAerialLayer).toBeNull());

    act(() => map.setView(insideRuhrBounds, ruhrZoom.min));
    await waitFor(() => expect(result.current.state.gatedAerialLayerNames).not.toContain('1926'));
    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayer).toBe('1926');
  });

  it('auto-deactivates the active layer once zoomed below its floor', async () => {
    map.setView(insideRuhrBounds, ruhrZoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayer).toBe('1926');

    act(() => map.setView(insideRuhrBounds, ruhrZoom.min - 1));
    await waitFor(() => expect(result.current.state.activeAerialLayer).toBeNull());
  });

  it('never gates the "Topographical" group, which has no bounds/zoom on its entries', () => {
    map.setView(outsideSwalmenBounds, 1);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.selectBaseLayer('Open Street Map Topographical'));
    expect(result.current.state.activeBaseLayer).toBe('Open Street Map Topographical');
  });
});
