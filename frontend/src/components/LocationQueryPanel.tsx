// src/components/LocationQueryPanel.tsx
import React from 'react';

interface LocationQueryPanelProps {
  location: [number, number] | null;
  time: string;
}

export const LocationQueryPanel = ({ location, time }: LocationQueryPanelProps) => {
  return (
    <div>
      {location ? (
        <div>
          <p>Coordinates: {location[0].toFixed(4)}, {location[1].toFixed(4)}</p>
        </div>
      ) : (
        <p>Click on the map to view coordinates for a location.</p>
      )}
    </div>
  );
};
