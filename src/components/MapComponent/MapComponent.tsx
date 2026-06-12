import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import MapBuilder from './MapBuilder';
import MapInfoCard from './MapInfoCard';
import { MapContainer } from 'react-leaflet';
import { siteIcon } from './Styles/markerStyles';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './MapComponent.css';

const position: [number, number] = [51.8, 5.8];

interface SearchItem {
  type: string;
  id: string | number;
}

interface QueryItem {
  type: string;
  id: string | number;
}

interface MapComponentProps {
  queryItem?: QueryItem;
  adjustMapHeight?: boolean;
  isEditing?: boolean;
  geometry?: string;
  onGeometryChange?: (wkt: string) => void;
}

const MapComponent = ({
  queryItem,
  adjustMapHeight,
  isEditing,
  geometry,
  onGeometryChange = () => {},
}: MapComponentProps) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [searchItem, setSearchItem] = useState<SearchItem>({ type: '', id: '' });

  const siteMarkersRef = useRef<Record<string | number, L.Marker>>({});

  const clearSelection = () => {
    if (searchItem.type === 'site') {
      const marker = siteMarkersRef.current[searchItem.id];
      if (marker) {
        marker.setIcon(siteIcon);
      }
    }
    setSearchItem({ type: '', id: '' });
    setShowInfoCard(false);
  };

  useEffect(() => {
    if (!map) return;

    if (showInfoCard) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [map, showInfoCard]);

  useEffect(() => {
    if (!map) return;

    const visibleMarkers: L.Marker[] = [];
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        visibleMarkers.push(layer);
      }
    });

    if (visibleMarkers.length === 0) return;

    const featureGroup = L.featureGroup(visibleMarkers).getBounds();

    const handleResize = () => {
      map.fitBounds(featureGroup, { paddingTopLeft: [300, 10] });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return (
    <div className="wrapper">
      <MapContainer
        id="map"
        className={adjustMapHeight ? 'infoMap_adjusted' : 'infoMap'}
        ref={(instance) => { if (instance) setMap(instance); }}
        center={position}
        zoom={9}
        zoomControl={false}
        tapTolerance={30}
      >
        {showInfoCard && (
          <MapInfoCard searchItem={searchItem} clearSelection={clearSelection} />
        )}

        <MapBuilder
          setShowInfoCard={setShowInfoCard}
          setSearchItem={setSearchItem}
          queryItem={queryItem}
          searchItem={searchItem}
          isEditing={isEditing}
          geometry={geometry}
          onGeometryChange={onGeometryChange}
          siteMarkersRef={siteMarkersRef}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;

