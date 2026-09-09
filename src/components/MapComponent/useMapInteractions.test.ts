import L from 'leaflet';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rasterService } from '../../services/RasterService';
import type { RasterLayer } from '../../types/raster';
import { layersConfig, WmsLayerConfig } from './layersConfig';
import {
  gateExclusiveLayerConfig,
  gateHistoricalMapSheet,
  gatePhysicalLayer,
  HISTORICAL_MAP_SHEET_COVERAGE_THRESHOLD_PERCENT,
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

/** A stub map that also supports `effectiveViewportBounds`'s `getSize`/`containerPointToLatLng`
 * calls (used whenever `occludedLeftPx > 0`), for tests covering the panel-occlusion fix.
 * `containerPointToLatLng` here is deliberately a constant far-away point rather than a real
 * projection - these tests only need the effective viewport to land somewhere that does/doesn't
 * overlap a given layer, not a geometrically accurate one. */
const fakeMapWithSize = (zoom: number, bounds: L.LatLngBounds): L.Map =>
  ({
    getZoom: () => zoom,
    getBounds: () => bounds,
    getSize: () => L.point(1000, 500),
    containerPointToLatLng: () => L.latLng(0, 0),
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

  it("gates a layer that's in view by raw map.getBounds() but fully behind the occluded panel strip", () => {
    const map = fakeMapWithSize(PHYSICAL_MIN_ZOOM_FLOOR, inViewViewport);
    const result = gatePhysicalLayer({ visible: false, bounds: swalmenBounds }, map, 400);
    expect(result).toEqual({
      disabled: true,
      disabledReason: "Pan the map to this layer's area to enable it.",
    });
  });

  it('does not gate the same layer once occludedLeftPx is 0 (falls back to raw map.getBounds())', () => {
    const map = fakeMapWithSize(PHYSICAL_MIN_ZOOM_FLOOR, inViewViewport);
    const result = gatePhysicalLayer({ visible: false, bounds: swalmenBounds }, map, 0);
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

// Historical Maps sheets extend E3-7's viewport gating with a coverage-percentage floor
// instead of a shared/per-sheet zoom floor: a sheet is selectable once the intersection of its
// bounds and the viewport covers at least HISTORICAL_MAP_SHEET_COVERAGE_THRESHOLD_PERCENT of
// the viewport's area - this scales automatically between wildly different sheet sizes without
// per-sheet tuning, unlike the zoom.min floor it replaced.
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

// A 2 (longitude) x 1 (latitude) degree viewport, used by the threshold-boundary tests below so
// a sheet's width alone determines its exact coverage percentage (width / 2 * 100).
const thresholdViewport = L.latLngBounds([50, 5], [51, 7]);

describe('gateHistoricalMapSheet', () => {
  it('never gates an already-visible sheet, even out of view', () => {
    const result = gateHistoricalMapSheet({ visible: true, bounds: swalmenBounds }, fakeMap(1, outOfViewViewport));
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('does not gate when there is no map yet', () => {
    const result = gateHistoricalMapSheet({ visible: false, bounds: swalmenBounds }, null);
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('gates a sheet covering less than the 15% threshold', () => {
    // width 0.2 of the 2-wide viewport, full height overlap -> 0.2 / 2 * 100 = 10%.
    const bounds = { south: 50, west: 5.2, north: 51, east: 5.4 };
    const result = gateHistoricalMapSheet({ visible: false, bounds }, fakeMap(14, thresholdViewport));
    expect(result).toEqual({ disabled: true, disabledReason: HISTORICAL_MAP_SHEET_GATE_HINT });
  });

  it('does not gate a sheet covering comfortably above the 15% threshold', () => {
    // width 0.5 -> 25%.
    const bounds = { south: 50, west: 5.5, north: 51, east: 6.0 };
    const result = gateHistoricalMapSheet({ visible: false, bounds }, fakeMap(14, thresholdViewport));
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('does not gate a sheet covering exactly the 15% threshold', () => {
    // width 0.3 -> 0.3 / 2 * 100 = HISTORICAL_MAP_SHEET_COVERAGE_THRESHOLD_PERCENT exactly.
    const bounds = { south: 50, west: 5.35, north: 51, east: 5.65 };
    const result = gateHistoricalMapSheet({ visible: false, bounds }, fakeMap(14, thresholdViewport));
    expect(HISTORICAL_MAP_SHEET_COVERAGE_THRESHOLD_PERCENT).toBe(15);
    expect(result).toEqual({ disabled: false, disabledReason: null });
  });

  it('reads the effective (panel-occluded) viewport, not the raw map bounds', () => {
    // Comfortably >= 15% of the raw viewport...
    const bounds = { south: 50, west: 5.5, north: 51, east: 6.0 };
    const withoutOcclusion = gateHistoricalMapSheet(
      { visible: false, bounds },
      fakeMapWithSize(14, thresholdViewport),
      0
    );
    expect(withoutOcclusion).toEqual({ disabled: false, disabledReason: null });

    // ...but once the panel occludes part of the viewport, `fakeMapWithSize`'s
    // `containerPointToLatLng` puts the effective viewport nowhere near this sheet.
    const withOcclusion = gateHistoricalMapSheet(
      { visible: false, bounds },
      fakeMapWithSize(14, thresholdViewport),
      400
    );
    expect(withOcclusion).toEqual({ disabled: true, disabledReason: HISTORICAL_MAP_SHEET_GATE_HINT });
  });
});

describe('useLayerPanelControl Historical Maps sheet toggle gating', () => {
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
    map.setView(outsideSwalmenBounds, 12);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(1));
    expect(result.current.state.historicalMapSheets[0].disabled).toBe(true);

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(false);

    act(() => map.setView(insideSwalmenBounds, 12));
    await waitFor(() => expect(result.current.state.historicalMapSheets[0].disabled).toBe(false));

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(true);
  });

  it('auto-turns off an already-visible sheet once panned out of coverage, and it re-enables once back in range', async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([deManSheetA2]);
    map.setView(insideSwalmenBounds, 12);
    const { result } = renderHook(() => useLayerPanelControl(map));
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(1));

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(true);

    // Panning away must not leave it checked-but-hidden forever requesting tiles for
    // wherever the user now is - it should turn itself off, not just become un-toggleable.
    act(() => map.setView(outsideSwalmenBounds, 12));
    await waitFor(() => expect(result.current.state.historicalMapSheets[0].visible).toBe(false));

    act(() => map.setView(insideSwalmenBounds, 12));
    await waitFor(() => expect(result.current.state.historicalMapSheets[0].disabled).toBe(false));
    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(true);
  });

  it('re-checks gating when occludedLeftPx changes alone, without a moveend/zoomend event', async () => {
    vi.mocked(rasterService.getCatalog).mockResolvedValue([deManSheetA2]);
    map.setView(insideSwalmenBounds, 12);
    // jsdom's own map container is 0x0, so `getBounds()` (used when occludedLeftPx is 0)
    // degenerates to a single point at the map center - overridden here only for the
    // occludedLeftPx > 0 path, matching `fakeMapWithSize`'s approach above: a constant
    // far-away point is enough to prove the effective viewport moved, without needing a real
    // pixel-to-latlng projection.
    map.getSize = () => L.point(1000, 500);
    map.containerPointToLatLng = (() => L.latLng(0, 0)) as typeof map.containerPointToLatLng;

    const { result, rerender } = renderHook(
      ({ occludedLeftPx }) => useLayerPanelControl(map, occludedLeftPx),
      { initialProps: { occludedLeftPx: 0 } }
    );
    await waitFor(() => expect(result.current.state.historicalMapSheets).toHaveLength(1));

    act(() => result.current.toggleHistoricalMapSheet(deManSheetA2.source));
    expect(result.current.state.historicalMapSheets[0].visible).toBe(true);

    // No map.setView/moveend/zoomend here - only the panel-width input changes.
    rerender({ occludedLeftPx: 200 });
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

    map.setView(insideSwalmenBounds, 12);
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

    map.setView(insideSwalmenBounds, 12);
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
// flag - `isActive` takes its place, checked against that layer's own subgroup slot in
// `activeAerialLayerNames`.
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
    // Unmount the hook (and its `moveend`/`zoomend` listeners) before tearing down the map:
    // `activeAerialLayersBySubgroup` now changes identity on every toggle, so a stray listener
    // left over from a prior test's un-unmounted hook can fire against an already-removed map.
    cleanup();
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
    expect(result.current.state.activeAerialLayerNames).toEqual([]);

    act(() => map.setView(insideRuhrBounds, ruhrZoom.min));
    await waitFor(() => expect(result.current.state.gatedAerialLayerNames).not.toContain('1926'));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayerNames).toEqual(['1926']);
  });

  it('blocks activating any Aerial Imagery layer below its zoom floor', () => {
    map.setView(insideRuhrBounds, ruhrZoom.min - 1);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayerNames).toEqual([]);
  });

  it('auto-deactivates the active layer once panned out of view, and it re-activates normally once back in range', async () => {
    map.setView(insideRuhrBounds, ruhrZoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayerNames).toEqual(['1926']);

    // Panning away must not leave it active-but-hidden forever requesting tiles for wherever
    // the user now is - it should deactivate itself, not just become un-toggleable.
    act(() => map.setView(outsideSwalmenBounds, ruhrZoom.min));
    await waitFor(() => expect(result.current.state.activeAerialLayerNames).toEqual([]));

    act(() => map.setView(insideRuhrBounds, ruhrZoom.min));
    await waitFor(() => expect(result.current.state.gatedAerialLayerNames).not.toContain('1926'));
    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayerNames).toEqual(['1926']);
  });

  it('auto-deactivates the active layer once zoomed below its floor', async () => {
    map.setView(insideRuhrBounds, ruhrZoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    expect(result.current.state.activeAerialLayerNames).toEqual(['1926']);

    act(() => map.setView(insideRuhrBounds, ruhrZoom.min - 1));
    await waitFor(() => expect(result.current.state.activeAerialLayerNames).toEqual([]));
  });

  it('keeps a Ruhr and an NRW layer active at once, and only swaps within a subgroup', () => {
    map.setView(insideRuhrBounds, ruhrZoom.min);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1926'));
    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1952 NRW'));
    expect([...result.current.state.activeAerialLayerNames].sort()).toEqual(['1926', '1952 NRW']);

    // Selecting a different Ruhr year swaps it out within the Ruhr subgroup only, leaving
    // the active NRW layer untouched.
    act(() => result.current.toggleExclusiveLayer('Aerial Imagery', '1934'));
    expect([...result.current.state.activeAerialLayerNames].sort()).toEqual(['1934', '1952 NRW']);
  });

  it('never gates the "Topographical" group, which has no bounds/zoom on its entries', () => {
    map.setView(outsideSwalmenBounds, 1);
    const { result } = renderHook(() => useLayerPanelControl(map));

    act(() => result.current.selectBaseLayer('Open Street Map Topographical'));
    expect(result.current.state.activeBaseLayer).toBe('Open Street Map Topographical');
  });
});
