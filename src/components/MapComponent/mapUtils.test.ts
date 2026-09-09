import L from 'leaflet';
import { describe, it, expect, vi } from 'vitest';
import { boundsIntersectViewport, effectiveViewportBounds, viewportCoveragePercent } from './mapUtils';

const swalmenBounds = { south: 51.14, west: 5.97, north: 51.35, east: 6.41 };

describe('boundsIntersectViewport', () => {
  it('returns true when the layer bounds are fully inside the viewport', () => {
    const viewport = L.latLngBounds([50, 5], [52, 7]);
    expect(boundsIntersectViewport(swalmenBounds, viewport)).toBe(true);
  });

  it('returns true when the layer bounds only partially overlap the viewport', () => {
    const viewport = L.latLngBounds([51.3, 6.3], [51.5, 6.6]);
    expect(boundsIntersectViewport(swalmenBounds, viewport)).toBe(true);
  });

  it('returns false when the layer bounds are entirely outside the viewport', () => {
    const viewport = L.latLngBounds([52.5, 8], [53, 9]);
    expect(boundsIntersectViewport(swalmenBounds, viewport)).toBe(false);
  });

  it('returns true when the layer bounds fully contain the viewport', () => {
    const viewport = L.latLngBounds([51.2, 6.1], [51.25, 6.15]);
    expect(boundsIntersectViewport(swalmenBounds, viewport)).toBe(true);
  });

  it('treats edge-touching bounds as intersecting', () => {
    const viewport = L.latLngBounds([51.35, 6.41], [51.4, 6.5]);
    expect(boundsIntersectViewport(swalmenBounds, viewport)).toBe(true);
  });
});

describe('viewportCoveragePercent', () => {
  // A 2 (longitude) x 1 (latitude) degree viewport, so a bounds width alone determines its
  // exact coverage percentage (width / 2 * 100) when it fully spans the viewport's height.
  const viewport = L.latLngBounds([50, 5], [51, 7]);

  it('returns 100 when bounds fully contain the viewport', () => {
    const bounds = { south: 49, west: 4, north: 52, east: 8 };
    expect(viewportCoveragePercent(bounds, viewport)).toBe(100);
  });

  it('returns 0 when there is no overlap at all', () => {
    const bounds = { south: 60, west: 20, north: 61, east: 21 };
    expect(viewportCoveragePercent(bounds, viewport)).toBe(0);
  });

  it('returns 0 for edge-touching bounds (zero-width/height intersection) - unlike boundsIntersectViewport', () => {
    const bounds = { south: 51, west: 5, north: 52, east: 6 };
    expect(boundsIntersectViewport(bounds, viewport)).toBe(true);
    expect(viewportCoveragePercent(bounds, viewport)).toBe(0);
  });

  it('returns exactly 15 at the coverage threshold boundary', () => {
    const bounds = { south: 50, west: 5.35, north: 51, east: 5.65 }; // width 0.3 -> 0.3/2*100 = 15
    expect(viewportCoveragePercent(bounds, viewport)).toBeCloseTo(15);
  });

  it('returns just under 15 for a sheet slightly narrower than the boundary', () => {
    const bounds = { south: 50, west: 5.35, north: 51, east: 5.64 }; // width 0.29 -> 14.5
    expect(viewportCoveragePercent(bounds, viewport)).toBeLessThan(15);
  });

  it('falls back to point-containment (100/0) when the viewport itself has zero area', () => {
    const pointViewport = L.latLngBounds([51.8, 5.8], [51.8, 5.8]);
    const containing = { south: 51, west: 5, north: 52, east: 6 };
    const notContaining = { south: 40, west: 0, north: 41, east: 1 };
    expect(viewportCoveragePercent(containing, pointViewport)).toBe(100);
    expect(viewportCoveragePercent(notContaining, pointViewport)).toBe(0);
  });
});

describe('effectiveViewportBounds', () => {
  const rawBounds = L.latLngBounds([50, 5], [51, 7]);

  // A simple linear container -> lat/lng mapping over a 1000x500 container representing
  // south=50/west=0/north=51/east=10 - enough to prove `effectiveViewportBounds` narrows the
  // viewport correctly, without needing a real Leaflet CRS projection.
  const linearContainerPointToLatLng = (point: L.Point | [number, number]) => {
    const [x, y] = Array.isArray(point) ? point : [point.x, point.y];
    return L.latLng(51 - (y / 500), (x / 1000) * 10);
  };

  const fakeMap = (getBounds: () => L.LatLngBounds): L.Map =>
    ({
      getBounds,
      getSize: vi.fn(() => L.point(1000, 500)),
      containerPointToLatLng: vi.fn(linearContainerPointToLatLng),
    }) as unknown as L.Map;

  it('returns plain map.getBounds() unchanged when occludedLeftPx <= 0, without touching getSize/containerPointToLatLng', () => {
    const map = fakeMap(() => rawBounds);
    expect(effectiveViewportBounds(map, 0)).toBe(rawBounds);
    expect(map.getSize).not.toHaveBeenCalled();
    expect(map.containerPointToLatLng).not.toHaveBeenCalled();

    expect(effectiveViewportBounds(map, -50)).toBe(rawBounds);
  });

  it('narrows the west edge proportionally to occludedLeftPx within the container width', () => {
    const map = fakeMap(() => rawBounds);
    const result = effectiveViewportBounds(map, 600);
    expect(result.getWest()).toBeCloseTo(6);
    expect(result.getEast()).toBeCloseTo(10);
    expect(result.getSouth()).toBeCloseTo(50);
    expect(result.getNorth()).toBeCloseTo(51);
  });

  it('clamps occludedLeftPx at/beyond the container width to a degenerate zero-width box at the right edge', () => {
    const map = fakeMap(() => rawBounds);
    const result = effectiveViewportBounds(map, 5000);
    expect(result.getWest()).toBeCloseTo(10);
    expect(result.getEast()).toBeCloseTo(10);
  });
});
