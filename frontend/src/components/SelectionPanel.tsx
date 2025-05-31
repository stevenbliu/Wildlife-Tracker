import React from 'react';
import Select from 'react-select';

type SelectionPanelProps = {
  herds: any[];
  filteredFamilies: any[];
  selectedHerd: any;
  selectedFamilies: { label: string; value: number }[];
  setSelectedFamilies: (families: { label: string; value: number }[]) => void;
  dispatch: React.Dispatch<any>;
  timeBucket: { label: string; value: string };
  setTimeBucket: (bucket: { label: string; value: string }) => void;
  metrics: string[];
  toggleMetric: (metric: string) => void;
  timeBucketOptions: { label: string; value: string }[];
  locationQuery: string;
  time: number;
  LocationQueryPanel: React.ComponentType<{ location: string; time: number }>;
};

export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  herds,
  filteredFamilies,
  selectedHerd,
  selectedFamilies,
  setSelectedFamilies,
  dispatch,
  timeBucket,
  setTimeBucket,
  metrics,
  toggleMetric,
  timeBucketOptions,
  locationQuery,
  time,
  LocationQueryPanel,
}) => (
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
        <h2 className="font-bold text-lg mb-2">Herd and Family Selection</h2>
        <h3 className="text-sm mb-2">You can filter families by selecting a herd or circling an area.</h3>

      <label style={{ display: 'block', marginBottom: 4 }}>Select Herd:</label>
      <Select
        options={[{ value: null, label: '--Select Herd--' }, ...herds.map(h => ({ value: h.id, label: h.species_name }))]}
        value={selectedHerd ? { value: selectedHerd.id, label: selectedHerd.species_name } : { value: null, label: '--Select Herd--' }}
        onChange={(option) => {
          dispatch({ type: 'SELECT_HERD', payload: option?.value ? herds.find(h => h.id === option.value) : null });
        }}
        isClearable
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>

    {/* Select / Deselect all families */}
    <div style={{ marginBottom: '0.5rem' }}>
      <button
        style={{ marginRight: '0.5rem' }}
        onClick={() => {
          const allFamilies = filteredFamilies.map(f => ({ value: f.id, label: f.friendly_name }));
          setSelectedFamilies(allFamilies);
        }}
      >
        Select All Families
      </button>
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
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    </div>

    {/* Time Bucket selector */}
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: 4 }}>Time Bucket:</label>
      <Select
        options={timeBucketOptions}
        value={timeBucket}
        onChange={(option) => setTimeBucket(option!)}
        menuPortalTarget={document.body}
        menuPosition="fixed"
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
);