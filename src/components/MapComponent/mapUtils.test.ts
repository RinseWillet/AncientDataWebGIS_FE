import L from 'leaflet';
import { describe, it, expect } from 'vitest';
import { boundsIntersectViewport } from './mapUtils';

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
