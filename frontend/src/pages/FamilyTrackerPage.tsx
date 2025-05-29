import React, { useState, useEffect } from 'react';
import FamilySelector from '../components/FamilySelector';
import LeafletMap from '../components/LeafletMap';
import { fetchFamilyTrack } from '../api/wildlifeApi';

type TrackPoint = {
  lat: number;
  lng: number;
  timestamp: string;
};

type TrackData = {
  coordinates: [number, number][];
  points: TrackPoint[];
};

export default function FamilyTrackerPage() {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<TrackData | null>(null);

  useEffect(() => {
    if (selectedFamily) {
      fetchFamilyTrack(selectedFamily).then(data => {
        // assuming data has points: [{lat, lng, timestamp}]
        const coords = data.points.map((p: TrackPoint) => [p.lat, p.lng] as [number, number]);
        setTrackData({ coordinates: coords, points: data.points });
      });
    }
  }, [selectedFamily]);

  return (
    <div>
      <h2>Track Family Movement Over Time</h2>
      <FamilySelector onSelect={setSelectedFamily} />
      {trackData && (
        <LeafletMap
          polylines={[{ id: selectedFamily!, coordinates: trackData.coordinates }]}
          markers={trackData.points.map((p, i) => ({
            id: `${selectedFamily}-${i}`,
            position: [p.lat, p.lng],
            popupText: `${p.timestamp}`,
          }))}
        />
      )}
    </div>
  );
}
