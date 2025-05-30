import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { HerdFamilySelector } from './components/HerdFamilySelector';
import { TimeSlider } from './components/TimeSlider';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapView } from './components/MapView';
import { LocationQueryPanel } from './components/LocationQueryPanel';
import { SelectedItemsPanel } from './components/SelectedItemsPanel';
import { FamilyStatsChart } from './components/FamilyStatsChart';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { reducer, State } from './Reducer';
import { SelectedItems } from './components/SelectedItems';

type Herd = {
  id: number;
  species_name: string;
};

type Family = {
  id: number;
  friendly_name: string;
  herd_id: string;
};

type Item = {
  type: 'herd' | 'family';
  id: number;
  name: string;
  active: boolean;
};

const initialState: State = {
  herds: [],
  families: [],
  filteredFamilies: [],
  selectedHerd: null,
  selectedFamily: null,
  selectedItems: [],
};

const App = () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [time, setTime] = useState<number>(0);
  const [locationQuery, setLocationQuery] = useState<string>('');

  const { herds, filteredFamilies, selectedHerd, selectedFamily, selectedItems } = state;

  useEffect(() => {
    async function fetchData() {
      try {
        const [herdsRes, familiesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/herds'),
          axios.get('http://localhost:8000/api/families'),
        ]);
        dispatch({ type: 'SET_HERDS', payload: herdsRes.data });
        dispatch({ type: 'SET_FAMILIES', payload: familiesRes.data });
      } catch (error) {
        console.error('Failed to fetch herds or families', error);
      }
    }
    fetchData();
  }, []);

  const handleHerdSelect = useCallback((herd: Herd | null) => {
    dispatch({ type: 'SELECT_HERD', payload: herd });
  }, []);

  const handleFamilySelect = useCallback((family: Family | null) => {
    dispatch({ type: 'SELECT_FAMILY', payload: family });
  }, []);

  const handleToggle = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_ITEM', payload: id });
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <HerdFamilySelector
          herds={herds}
          families={filteredFamilies}
          selectedHerd={selectedHerd}
          selectedFamily={selectedFamily}
          onHerdSelect={handleHerdSelect}
          onFamilySelect={handleFamilySelect}
        />
        <TimeSlider value={time} onChange={setTime} />
      </header>

      <div className="app-body">
        <aside className="sidebar">
          {/* Selected Items */}
          <SelectedItems
            selectedItems={state.selectedItems}
            onToggleHerd={(herdId) => {
              // Toggle herd and all families in that herd
              const newSelectedItems = state.selectedItems.map((item) => {
                if (item.type === "herd" && item.id === herdId) {
                  return { ...item, active: !item.active };
                }
                if (item.type === "family" && item.herd_id === herdId) {
                  return { ...item, active: !item.active };
                }
                return item;
              });
              dispatch({ type: "SET_SELECTED_ITEMS", payload: newSelectedItems });
            }}
            onToggleFamily={(familyId) => dispatch({ type: "TOGGLE_ITEM", payload: familyId })}
            onRemoveItem={(item) => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
            onClearAll={() => dispatch({ type: "CLEAR_ALL_ITEMS" })}
          />

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
        {/* <FamilyStatsChart family={selectedFamily} time={time} /> */}
        Placeholder for Tables and Charts etc.
      </footer>









    </div>
  );
};

export default App;
