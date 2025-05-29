import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Coordinate = [number, number];

type Props = {
  polylines?: { id: string; coordinates: Coordinate[]; color?: string }[];
  markers?: { id: string; position: Coordinate; popupText?: string }[];
  onMapClick?: (lat: number, lng: number) => void;
};

export default function LeafletMap({ polylines = [], markers = [], onMapClick }: Props) {
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer center={[0, 0]} zoom={2} style={{ height: '500px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {polylines.map(line => (
        <Polyline key={line.id} positions={line.coordinates} color={line.color || 'blue'} />
      ))}
      {markers.map(marker => (
        <Marker key={marker.id} position={marker.position}>
          {marker.popupText && <Popup>{marker.popupText}</Popup>}
        </Marker>
      ))}
      <MapClickHandler />
    </MapContainer>
  );
}
