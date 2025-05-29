// src/App.tsx
import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css'; // add your CSS here
import { HerdSelector } from './components/HerdSelector';
import { FamilySelector } from './components/FamilySelector';
import { TimeSlider } from './components/TimeSlider';
import { MapView } from './components/MapView';
import { FamilyStatsChart } from './components/FamilyStatsChart';
import { LocationQueryPanel } from './components/LocationQueryPanel';

// Fix for marker icons in Vite
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  shadowUrl,
});

const App = () => {
  const [selectedHerd, setSelectedHerd] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [time, setTime] = useState<string>('2020-01-01');
  const [locationQuery, setLocationQuery] = useState<[number, number] | null>(null);

  return (
    <div className="app-container">
      <header className="app-header">
        <HerdSelector selected={selectedHerd} onChange={setSelectedHerd} />
        <FamilySelector herd={selectedHerd} selected={selectedFamily} onChange={setSelectedFamily} />
        <TimeSlider value={time} onChange={setTime} />
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <LocationQueryPanel location={locationQuery} time={time} />
        </aside>

        <main className="map-area">
          <MapContainer center={[0, 0]} zoom={2} className="map-container">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapView
              selectedHerd={selectedHerd}
              selectedFamily={selectedFamily}
              time={time}
              onLocationQuery={setLocationQuery}
            />
          </MapContainer>
        </main>
      </div>

      <footer className="app-footer">
        <FamilyStatsChart family={selectedFamily} time={time} />
      </footer>
    </div>
  );
};

export default App;
