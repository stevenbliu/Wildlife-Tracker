// src/components/LocationQueryPanel.tsx
import React from 'react';

interface LocationQueryPanelProps {
  location: [number, number] | null;
  time: string;
}

export const LocationQueryPanel = ({ location, time }: LocationQueryPanelProps) => {
  return (
    <div>
      <h2 className="font-bold text-lg mb-2">Location Info</h2>
      {location ? (
        <div>
          <p>Coordinates: {location[0].toFixed(4)}, {location[1].toFixed(4)}</p>
          {/* <p>Time: {time}</p> */}
          {/* <p>Queried data (example): No sightings here on this date.</p> */}
        </div>
      ) : (
        <p>Click on the map to view coordinates for a location.</p>
      )}
    </div>
  );
};
