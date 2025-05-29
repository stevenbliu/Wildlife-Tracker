import React, { useState, useEffect } from 'react';
import HerdSelector from '../components/HerdSelector';
import LeafletMap from '../components/LeafletMap';
import { fetchHerdPaths } from '../api/wildlifeApi';

type PathData = {
  id: string;
  familyName: string;
  coordinates: [number, number][];
};

export default function HerdTrackerPage() {
  const [selectedHerd, setSelectedHerd] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathData[]>([]);

  useEffect(() => {
    if (selectedHerd) {
      fetchHerdPaths(selectedHerd).then(setPaths);
    }
  }, [selectedHerd]);

  return (
    <div>
      <h2>Track Herd Families Over Time</h2>
      <HerdSelector onSelect={setSelectedHerd} />
      {selectedHerd && (
        <LeafletMap
          polylines={paths.map(p => ({
            id: p.id,
            coordinates: p.coordinates,
            color: undefined, // could assign color by family
          }))}
        />
      )}
    </div>
  );
}
