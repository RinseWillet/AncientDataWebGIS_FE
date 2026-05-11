import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { wktToGeoJSON, geoJSONtoWKT } from '../../utils/geometryUtils';

interface GeometryEditorProps {
  geometry?: string;
  onGeometryChange: (wkt: string) => void;
  isEditing?: boolean;
}

const GeometryEditor = ({ geometry, onGeometryChange, isEditing }: GeometryEditorProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !isEditing || !geometry) return;

    let geoJsonGeometry;
    try {
      geoJsonGeometry = wktToGeoJSON(geometry);
    } catch {
      console.warn('Invalid WKT geometry:', geometry);
      return;
    }

    const geoJsonFeature = {
      type: 'Feature' as const,
      properties: {},
      geometry: geoJsonGeometry,
    };

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    try {
      const layer = L.geoJSON(geoJsonFeature);
      layer.eachLayer((l) => drawnItems.addLayer(l));
    } catch (err) {
      console.error('Could not create layers from GeoJSON:', err);
    }

    const drawControl = new L.Control.Draw({
      draw: undefined,
      edit: {
        featureGroup: drawnItems,
        edit: {
          selectedPathOptions: {
            color: '#fe57a1',
            opacity: 0.6,
          },
        },
        remove: false,
      },
    });

    map.addControl(drawControl);

    const handleEdit = (e: L.DrawEvents.Edited) => {
      const editedLayer = e.layers.getLayers()[0] as L.Layer & { toGeoJSON?: () => GeoJSON.Feature };
      if (!editedLayer || typeof editedLayer.toGeoJSON !== 'function') return;

      const geojson = editedLayer.toGeoJSON();
      try {
        const wkt = geoJSONtoWKT(geojson.geometry as GeoJSON.Geometry);
        onGeometryChange(wkt);
      } catch (err) {
        console.error('Failed to convert edited geometry to WKT:', err);
      }
    };

    map.on('draw:edited', handleEdit as L.LeafletEventHandlerFn);

    return () => {
      map.off('draw:edited', handleEdit as L.LeafletEventHandlerFn);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, geometry, isEditing, onGeometryChange]);

  return null;
};

export default GeometryEditor;

