type Position = number[];
type Line = Position[];
type PolygonRings = Line[];

type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'MultiPoint'; coordinates: Position[] }
  | { type: 'LineString'; coordinates: Line }
  | { type: 'MultiLineString'; coordinates: Line[] }
  | { type: 'Polygon'; coordinates: PolygonRings }
  | { type: 'MultiPolygon'; coordinates: PolygonRings[] };

const coordsToWKT = (coords: Position): string => coords.join(' ');

export function geoJSONtoWKT(geometry: Geometry): string {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    throw new Error('Invalid GeoJSON geometry.');
  }

  switch (geometry.type) {
    case 'Point':
      return `POINT(${coordsToWKT(geometry.coordinates)})`;

    case 'MultiPoint':
      return `MULTIPOINT(${geometry.coordinates.map((c) => `(${coordsToWKT(c)})`).join(', ')})`;

    case 'LineString':
      return `LINESTRING(${geometry.coordinates.map(coordsToWKT).join(', ')})`;

    case 'MultiLineString':
      return `MULTILINESTRING(${geometry.coordinates
        .map((line) => `(${line.map(coordsToWKT).join(', ')})`)
        .join(', ')})`;

    case 'Polygon':
      return `POLYGON(${geometry.coordinates
        .map((ring) => `(${ring.map(coordsToWKT).join(', ')})`)
        .join(', ')})`;

    case 'MultiPolygon':
      return `MULTIPOLYGON(${geometry.coordinates
        .map((polygon) => `((${polygon.map((ring) => ring.map(coordsToWKT).join(', ')).join(') , (')}))`)
        .join(', ')})`;

    default:
      throw new Error(`Unsupported geometry type: ${(geometry as { type: string }).type}`);
  }
}

export function wktToGeoJSON(wkt: string): Pick<Geometry, 'type' | 'coordinates'> {
  if (typeof wkt !== 'string') {
    throw new Error('WKT input must be a string');
  }

  if (wkt.startsWith('POINT(')) {
    const coords = wkt
      .slice(6, -1)
      .trim()
      .split(' ')
      .map((coordinate) => parseFloat(coordinate));

    return {
      type: 'Point',
      coordinates: coords,
    };
  }

  if (wkt.startsWith('MULTILINESTRING(')) {
    const lineStringText = wkt.slice(17, -1).trim();

    const lines = lineStringText.split('),(').map((line) =>
      line
        .replace(/[()]/g, '')
        .trim()
        .split(', ')
        .map((pair) => pair.split(' ').map((coordinate) => parseFloat(coordinate)))
    );

    return {
      type: 'MultiLineString',
      coordinates: lines,
    };
  }

  throw new Error('Unsupported WKT format');
}

