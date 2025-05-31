import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapView } from './components/MapView';
import { LocationQueryPanel } from './components/LocationQueryPanel';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { reducer, State } from './Reducer';
import { getColor } from './utils/colorUtils';

import { SelectionPanel } from './components/SelectionPanel';
import { FamilyMetricsChart } from './components/FamilyMetricsChart';
import { fetchHerds, fetchFamilies, fetchLocationData } from './api/api';

type LocationDataPoint = {
  time_bucket: string;
  family_id: number;
  friendly_name: string;
  avg_size?: number;
  avg_health?: number;
};

const initialState: State = {
  herds: [],
  families: [],
  filteredFamilies: [],
  selectedHerd: null,
  selectedFamily: null,
  selectedItems: [],
};

/** --- Custom Hook: Fetch Herds and Families --- */
function useHerdsAndFamilies(dispatch: React.Dispatch<any>) {
  useEffect(() => {
    async function fetchData() {
      try {
        const [herdsRes, familiesRes] = await Promise.all([
          fetchHerds(),
          fetchFamilies(),
        ]);
        dispatch({ type: 'SET_HERDS', payload: herdsRes });
        dispatch({ type: 'SET_FAMILIES', payload: familiesRes });
      } catch (error) {
        console.error('Failed to fetch herds or families', error);
      }
    }
    fetchData();
  }, [dispatch]);
}

/** --- Normalize Location Data Across Families --- */
function normalizeLocationData(data: LocationDataPoint[], selectedFamilies: { value: number; label: string }[]) {
  // Object keyed by time_bucket
  const merged: Record<string, any> = {};

  data.forEach((point) => {
    const bucket = point.time_bucket;
    if (!merged[bucket]) {
      merged[bucket] = { time_bucket: bucket };
    }
    // Add avg_size and avg_health with family-specific keys
    merged[bucket][`avg_size_${point.family_id}`] = point.avg_size ?? null;
    merged[bucket][`avg_health_${point.family_id}`] = point.avg_health ?? null;
  });

  // Sort by time_bucket ascending
  const sorted = Object.values(merged).sort(
    (a, b) => new Date(a.time_bucket).getTime() - new Date(b.time_bucket).getTime()
  );

  return sorted;
}

/** --- Main App Component --- */
const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [time, setTime] = useState<number>(0);
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [selectedFamilies, setSelectedFamilies] = useState<{ label: string; value: number }[]>([]);
  const [timeBucket, setTimeBucket] = useState({ label: '1 Minute', value: '1min' });
  const [metrics, setMetrics] = useState<string[]>(['size', 'health']);
  const [locationData, setLocationData] = useState<LocationDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const { herds, filteredFamilies, selectedHerd, selectedItems } = state;

  useHerdsAndFamilies(dispatch);

  // Load location data when selectedFamilies, timeBucket or metrics change
  useEffect(() => {
    async function getLocationData() {
      if (selectedFamilies.length === 0 || metrics.length === 0) {
        setLocationData([]);
        return;
      }
      setLoading(true);
      try {
        const ids = selectedFamilies.map(f => f.value).join(',');
        const metricParam = metrics.join(',');
        const data = await fetchLocationData({
          entityType: 'family',
          entityIds: ids,
          metrics: `location,${metricParam}`,
          bucket: timeBucket.value,
        });
        setLocationData(data);
      } catch (error) {
        setLocationData([]);
      } finally {
        setLoading(false);
      }
    }
    getLocationData();
  }, [selectedFamilies, timeBucket, metrics]);

  const toggleMetric = (metric: string) => {
    setMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const timeBucketOptions = [
    { value: '.5sec', label: '.5 second' },
    { value: '1sec', label: '1 second' },
    { value: '30sec', label: '30 seconds' },
    { value: '1min', label: '1 Minute' },
    { value: '5min', label: '5 Minutes' },
    { value: '15min', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
  ];

  const colorMap: { [key: number]: string } = {};

  selectedFamilies.forEach((f, i) => {
    colorMap[f.value] = getColor(f.value);
  });

  // Normalize data for chart display
  const normalizedData = normalizeLocationData(locationData, selectedFamilies);

  return (
    <div className="app-container">

      <div className="app-body">
        <SelectionPanel
          herds={herds}
          filteredFamilies={filteredFamilies}
          selectedHerd={selectedHerd}
          selectedFamilies={selectedFamilies}
          setSelectedFamilies={setSelectedFamilies}
          dispatch={dispatch}
          timeBucket={timeBucket}
          setTimeBucket={setTimeBucket}
          metrics={metrics}
          toggleMetric={toggleMetric}
          timeBucketOptions={timeBucketOptions}
          locationQuery={locationQuery}
          time={time}
          LocationQueryPanel={LocationQueryPanel}
        />

        <main className="map-area">
          <MapContainer
            center={[0, 0]}
            zoom={2}
            minZoom={1}
            maxZoom={18}
            className="map-container"
            worldCopyJump={false}
            style={{ backgroundColor: 'lightblue', padding: '200px' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" noWrap={true} />
            {loading && <div className="loading-indicator">Loading locations...</div>}
            <MapView
              locationData={locationData}
              onLocationQuery={setLocationQuery}
              selectedItems={selectedItems}
              filteredFamilies={filteredFamilies}
              onFilteredFamiliesChange={(newFamilies) =>
                dispatch({ type: 'UPDATE_FILTERED_FAMILIES', payload: newFamilies })
              }
            />          </MapContainer>
        </main>
      </div>

        <FamilyMetricsChart
          normalizedData={normalizedData}
          selectedFamilies={selectedFamilies}
          colorMap={colorMap}
          metrics={metrics}
        />

    </div>
  );
};

export default App;
