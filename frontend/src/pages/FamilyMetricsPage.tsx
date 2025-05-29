import React, { useState, useEffect } from 'react';
import FamilySelector from '../components/FamilySelector';
import MetricsChart from '../components/MetricsChart';
import { fetchFamilyTrack } from '../api/wildlifeApi';

type TrackPoint = {
  timestamp: string;
  size: number;
  health: number;
};

export default function FamilyMetricsPage() {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TrackPoint[]>([]);

  useEffect(() => {
    if (selectedFamily) {
      fetchFamilyTrack(selectedFamily).then(data => {
        // Assuming data.points has size and health fields
        setMetrics(data.points);
      });
    }
  }, [selectedFamily]);

  return (
    <div>
      <h2>Family Size and Health Over Time</h2>
      <FamilySelector onSelect={setSelectedFamily} />
      {metrics.length > 0 && <MetricsChart data={metrics} />}
    </div>
  );
}
