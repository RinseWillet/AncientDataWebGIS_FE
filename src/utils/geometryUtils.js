export function geoJSONtoWKT(geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    throw new Error("Invalid GeoJSON geometry.");
  }

  const coordsToWKT = (coords) => coords.join(" ");

  switch (geometry.type) {
    case "Point":
      return `POINT(${coordsToWKT(geometry.coordinates)})`;

    case "MultiPoint":
      return `MULTIPOINT(${geometry.coordinates.map(c => `(${coordsToWKT(c)})`).join(", ")})`;

    case "LineString":
      return `LINESTRING(${geometry.coordinates.map(coordsToWKT).join(", ")})`;

    case "MultiLineString":
      return `MULTILINESTRING(${geometry.coordinates
        .map(line => `(${line.map(coordsToWKT).join(", ")})`)
        .join(", ")})`;

    case "Polygon":
      return `POLYGON(${geometry.coordinates
        .map(ring => `(${ring.map(coordsToWKT).join(", ")})`)
        .join(", ")})`;

    case "MultiPolygon":
      return `MULTIPOLYGON(${geometry.coordinates
        .map(polygon =>
          `((${polygon.map(ring => ring.map(coordsToWKT).join(", ")).join(") , (")}))`
        )
        .join(", ")})`;

    default:
      throw new Error(`Unsupported geometry type: ${geometry.type}`);
  }
}

export function wktToGeoJSON(wkt) {
  if (typeof wkt !== 'string') throw new Error("WKT input must be a string");

  if (wkt.startsWith("POINT(")) {
    const coords = wkt
      .slice(6, -1)
      .trim()
      .split(" ")
      .map(parseFloat);
    return {
      type: "Point",
      coordinates: coords,
    };
  }

  if (wkt.startsWith("MULTILINESTRING(")) {
    const lineStringText = wkt
      .slice(17, -1)
      .trim(); // Remove "MULTILINESTRING(" and ")"

    const lines = lineStringText
      .split("),(")
      .map(line =>
        line
          .replace(/[()]/g, "")
          .trim()
          .split(", ")
          .map(pair => pair.split(" ").map(parseFloat))
      );

    return {
      type: "MultiLineString",
      coordinates: lines,
    };
  }

  throw new Error("Unsupported WKT format");
}