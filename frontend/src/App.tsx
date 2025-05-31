import React, { useState, useEffect, useCallback, useReducer } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { HerdFamilySelector } from './components/HerdFamilySelector';
import { TimeSlider } from './components/TimeSlider';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapView } from './components/MapView';
import { LocationQueryPanel } from './components/LocationQueryPanel';
import { SelectedItems } from './components/SelectedItems';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { reducer, State } from './Reducer';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';


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
    async function fetchLocationData() {
      if (selectedFamilies.length === 0 || metrics.length === 0) {
        setLocationData([]);
        return;
      }

      setLoading(true);
      try {
        const ids = selectedFamilies.map(f => f.value).join(',');
        const metricParam = metrics.join(',');
        const params = {
          params: {
            entity_type: 'family',
            entity_id: ids,
            metrics: `location,${metricParam}`,
            bucket: timeBucket.value,
          },
        }
        console.log('Fetching location data with params:', params);
        const res = await axios.get('http://localhost:8000/api/overtime', params);
        setLocationData(res.data);
      } catch (error) {
        console.error('Failed to fetch location data:', error);
        setLocationData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLocationData();
  }, [selectedFamilies, timeBucket, metrics]);

  const toggleMetric = (metric: string) => {
    setMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const familyOptions = filteredFamilies.map(f => ({
    value: f.id,
    label: f.friendly_name,
  }));

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
  const colors = ['#8884d8', '#82ca9d', '#ff7300', '#0088FE', '#00C49F', '#FFBB28'];

  selectedFamilies.forEach((f, i) => {
    colorMap[f.value] = colors[i % colors.length];
  });

  // Normalize data for chart display
  const normalizedData = normalizeLocationData(locationData, selectedFamilies);

  return (
    <div className="app-container">

      <div className="app-body">
        <aside
          className="sidebar"
          style={{
            width: '300px',
            height: '100vh',
            overflowY: 'auto',
            padding: '1rem',
            boxSizing: 'border-box',
            backgroundColor: '#f7f7f7',
          }}
        >
          {/* Herd selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Select Herd:</label>
            <Select
              options={[{ value: null, label: '--Select Herd--' }, ...herds.map(h => ({ value: h.id, label: h.species_name }))]}
              value={selectedHerd ? { value: selectedHerd.id, label: selectedHerd.species_name } : { value: null, label: '--Select Herd--' }}
              onChange={(option) => {
                dispatch({ type: 'SELECT_HERD', payload: option?.value ? herds.find(h => h.id === option.value) : null });
                // Deselect families when herd changes
                // setSelectedFamilies([]);
              }}
              isClearable
            />
          </div>

          {/* Select / Deselect all families */}
          <div style={{ marginBottom: '0.5rem' }}>
            <button
              style={{ marginRight: '0.5rem' }}
              onClick={() => {
                // Select all filtered families
                const allFamilies = filteredFamilies.map(f => ({ value: f.id, label: f.friendly_name }));
                setSelectedFamilies(allFamilies);
              }}
            >
              Select All Families
            </button>
            {/* <button onClick={() => setSelectedFamilies([])}>Deselect All Families</button> */}
          </div>

          {/* Multi-family selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Select Families:</label>
            <Select
              isMulti
              options={filteredFamilies.map(f => ({ value: f.id, label: f.friendly_name }))}
              value={selectedFamilies}
              onChange={(selected) => setSelectedFamilies(selected as any)}
              closeMenuOnSelect={false}
              isSearchable
              placeholder="Select families..."
              noOptionsMessage={() => "No families available"}
            />
          </div>

          {/* Time Bucket selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Time Bucket:</label>
            <Select
              options={timeBucketOptions}
              value={timeBucket}
              onChange={(option) => setTimeBucket(option!)}
            />
          </div>

          {/* Metric toggles */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Metrics:</label>
            <label>
              <input
                type="checkbox"
                checked={metrics.includes('size')}
                onChange={() => toggleMetric('size')}
              />{' '}
              Size
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="checkbox"
                checked={metrics.includes('health')}
                onChange={() => toggleMetric('health')}
              />{' '}
              Health
            </label>
          </div>

          <LocationQueryPanel location={locationQuery} time={time} />
        </aside>


        <main className="map-area">
          <MapContainer
            center={[0, 0]}
            zoom={2}
            className="map-container"
            worldCopyJump={false}
            style={{ backgroundColor: 'lightblue' }}
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

      <footer className="app-footer">
        {/* <h3>Size & Health Over Time</h3> */}

        {/* Line chart only */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={normalizedData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time_bucket"
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
            <Legend
              layout="vertical"
              align="left"
              verticalAlign="middle"
              wrapperStyle={{
                lineHeight: '24px',
              }}
              content={({ payload }) => (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {payload?.map((entry, index) => (
                    <li
                      key={`legend-${index}`}
                      style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}
                    >
                      <svg width="30" height="10" style={{ marginRight: 8 }}>
                        <line
                          x1={0}
                          y1={5}
                          x2={30}
                          y2={5}
                          stroke={entry.color}
                          strokeWidth={2}
                          strokeDasharray={entry.payload.strokeDasharray || '0'}
                        />
                      </svg>
                      <span>{entry.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            />

            {selectedFamilies.map((fam) => {
              const baseColor = colorMap[fam.value];

              return (
                <React.Fragment key={fam.value}>
                  {metrics.includes('size') && (
                    <Line
                      key={`${fam.value}-size`}
                      type="monotone"
                      dataKey={`avg_size_${fam.value}`}
                      name={`${fam.label} (Size)`}
                      stroke={baseColor}
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {metrics.includes('health') && (
                    <Line
                      key={`${fam.value}-health`}
                      type="monotone"
                      dataKey={`avg_health_${fam.value}`}
                      name={`${fam.label} (Health)`}
                      stroke={baseColor}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </footer>

    </div>
  );
};

export default App;
