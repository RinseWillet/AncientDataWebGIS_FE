import { describe, expect, it } from 'vitest';
import { geoJSONtoWKT, wktToGeoJSON } from './geometryUtils';

describe('geometryUtils', () => {
  describe('geoJSONtoWKT', () => {
    it('converts Point geometry to WKT', () => {
      const point = { type: 'Point' as const, coordinates: [4.9, 52.37] };
      expect(geoJSONtoWKT(point)).toBe('POINT(4.9 52.37)');
    });

    it('converts MultiLineString geometry to WKT', () => {
      const multiLine = {
        type: 'MultiLineString' as const,
        coordinates: [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ],
      };

      expect(geoJSONtoWKT(multiLine)).toBe('MULTILINESTRING((1 2, 3 4), (5 6, 7 8))');
    });

    it('throws for invalid geometry input', () => {
      expect(() => geoJSONtoWKT(null as never)).toThrow('Invalid GeoJSON geometry.');
    });

    it('throws for unsupported geometry type', () => {
      const invalidGeometry = {
        type: 'GeometryCollection',
        coordinates: [],
      } as unknown as Parameters<typeof geoJSONtoWKT>[0];

      expect(() => geoJSONtoWKT(invalidGeometry)).toThrow('Unsupported geometry type: GeometryCollection');
    });
  });

  describe('wktToGeoJSON', () => {
    it('converts POINT WKT to GeoJSON', () => {
      expect(wktToGeoJSON('POINT(4.9 52.37)')).toEqual({
        type: 'Point',
        coordinates: [4.9, 52.37],
      });
    });

    it('converts MULTILINESTRING WKT to GeoJSON', () => {
      expect(wktToGeoJSON('MULTILINESTRING((1 2, 3 4),(5 6, 7 8))')).toEqual({
        type: 'MultiLineString',
        coordinates: [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ],
      });
    });

    it('throws for non-string WKT input', () => {
      expect(() => wktToGeoJSON(123 as unknown as string)).toThrow('WKT input must be a string');
    });

    it('throws for unsupported WKT format', () => {
      expect(() => wktToGeoJSON('LINESTRING(1 2, 3 4)')).toThrow('Unsupported WKT format');
    });
  });
});

