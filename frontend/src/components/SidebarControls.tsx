import React from 'react';
import Select from 'react-select';
import TimeSlider from './TimeSlider'; // assume you have this
import LocationQueryPanel from './LocationQueryPanel'; // assume you have this
import SelectedItems from './SelectedItems'; // assume you have this

type FamilyOption = { value: number; label: string };

type Herd = {
  id: number;
  species_name: string;
};

type Props = {
  herds: Herd[];
  filteredFamilies: { id: number; friendly_name: string }[];
  selectedHerd: Herd | null;
  onSelectHerd: (herd: Herd | null) => void;

  selectedFamilies: FamilyOption[];
  setSelectedFamilies: React.Dispatch<React.SetStateAction<FamilyOption[]>>;

  timeBucket: { value: string; label: string };
  setTimeBucket: React.Dispatch<React.SetStateAction<{ value: string; label: string }>>;

  metrics: string[];
  toggleMetric: (metric: string) => void;

  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;

  locationQuery: string;
  setLocationQuery: React.Dispatch<React.SetStateAction<string>>;

  selectedItems: any[];
};

const TIME_BUCKET_OPTIONS = [
  { value: '.5sec', label: '.5 second' },
  { value: '1sec', label: '1 second' },
  { value: '30sec', label: '30 seconds' },
  { value: '1min', label: '1 Minute' },
  { value: '5min', label: '5 Minutes' },
  { value: '15min', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
];

export default function SidebarControls({
  herds,
  filteredFamilies,
  selectedHerd,
  onSelectHerd,
  selectedFamilies,
  setSelectedFamilies,
  timeBucket,
  setTimeBucket,
  metrics,
  toggleMetric,
  time,
  setTime,
  locationQuery,
  setLocationQuery,
  selectedItems,
}: Props) {
  // Create Select options for herds and families
  const herdOptions = [{ value: null, label: '--Select Herd--' }].concat(
    herds.map(h => ({ value: h.id, label: h.species_name }))
  );

  const familyOptions = filteredFamilies.map(f => ({ value: f.id, label: f.friendly_name }));

  return (
    <aside
      style={{
        width: 300,
        height: '100vh',
        overflowY: 'auto',
        padding: '1rem',
        boxSizing: 'border-box',
        backgroundColor: '#f7f7f7',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Select Herd:</label>
        <Select
          options={herdOptions}
          value={selectedHerd ? { value: selectedHerd.id, label: selectedHerd.species_name } : herdOptions[0]}
          onChange={(option) =>
            onSelectHerd(option?.value ? herds.find(h => h.id === option.value) ?? null : null)
          }
          isClearable
        />
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <button
          style={{ marginRight: '0.5rem' }}
          onClick={() => setSelectedFamilies(familyOptions)}
          disabled={familyOptions.length === 0}
        >
          Select All Families
        </button>
        <button onClick={() => setSelectedFamilies([])} disabled={selectedFamilies.length === 0}>
          Deselect All Families
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Select Families:</label>
        <Select
          isMulti
          options={familyOptions}
          value={selectedFamilies}
          onChange={(selected) => setSelectedFamilies(selected as FamilyOption[])}
          closeMenuOnSelect={false}
          isSearchable
          placeholder="Select families..."
          noOptionsMessage={() => 'No families available'}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Time Bucket:</label>
        <Select
          options={TIME_BUCKET_OPTIONS}
          value={timeBucket}
          onChange={(option) => option && setTimeBucket(option)}
        />
      </div>

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

      <TimeSlider time={time} setTime={setTime} max={100} />

      <SelectedItems selectedItems={selectedItems} />

      <LocationQueryPanel locationQuery={locationQuery} setLocationQuery={setLocationQuery} />
    </aside>
  );
}
