import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { photoPinIcon } from '../MapComponent/Styles/markerStyles';
import './PhotoLocationPicker.css';

interface LatLng {
  lat: number;
  lng: number;
}

interface PhotoLocationPickerProps {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  initialCenter: LatLng;
}

const ClickHandler = ({ onClick }: { onClick: (value: LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const PhotoLocationPicker = ({ value, onChange, initialCenter }: PhotoLocationPickerProps) => {
  const [center] = useState<LatLng>(value ?? initialCenter);

  return (
    <div className="photo-location-picker">
      <p className="photo-location-picker__hint">Click the map to set the photo location.</p>
      <MapContainer
        className="photo-location-picker__map"
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={onChange} />
        {value && <Marker position={[value.lat, value.lng]} icon={photoPinIcon} />}
      </MapContainer>
      {value && (
        <p className="photo-location-picker__coords">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default PhotoLocationPicker;

