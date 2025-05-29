// src/components/MapView.tsx
import React from 'react';
import {
  Marker,
  Popup,
  useMapEvents,
  CircleMarker,
  Tooltip,
} from 'react-leaflet';

interface MapViewProps {
  selectedHerd: string | null;
  selectedFamily: string | null;
  time: string;
  onLocationQuery: (coords: [number, number]) => void;
}

// Mock data
const herdData = [
  {
    herd: 'Elephants',
    family: 'Alpha',
    locations: [
      { lat: -1.2921, lng: 36.8219, time: '2020-01-01' },
      { lat: -1.2922, lng: 36.8225, time: '2021-01-01' },
      { lat: -1.2923, lng: 36.8231, time: '2022-01-01' },
    ],
  },
  {
    herd: 'Zebras',
    family: 'Stripey',
    locations: [
      { lat: -1.3, lng: 36.8, time: '2021-01-01' },
      { lat: -1.31, lng: 36.81, time: '2022-01-01' },
    ],
  },
];

const eventData = [
  { type: 'Birth', lat: -1.2921, lng: 36.8219, time: '2020-01-01' },
  { type: 'Interaction', lat: -1.2923, lng: 36.8231, time: '2021-06-01' },
];

const herdColors: Record<string, string> = {
  Elephants: 'blue',
  Zebras: 'green',
};

export const MapView = ({
  selectedHerd,
  selectedFamily,
  time,
  onLocationQuery,
}: MapViewProps) => {
  const [queryPoint, setQueryPoint] = React.useState<[number, number] | null>(
    null
  );

  useMapEvents({
    click(e) {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      setQueryPoint(coords);
      onLocationQuery(coords);
    },
  });

  const markers = [];

  for (const entry of herdData) {
    if (
      (selectedHerd && entry.herd !== selectedHerd) ||
      (selectedFamily && entry.family !== selectedFamily)
    ) {
      continue;
    }

    for (const loc of entry.locations) {
      markers.push(
        <Marker key={`${entry.family}-${loc.time}`} position={[loc.lat, loc.lng]}>
          <Popup>
            <b>{entry.family}</b> ({entry.herd}) <br />
            Date: {loc.time}
          </Popup>
        </Marker>
      );
    }
  }

  const nearbyEvents = queryPoint
    ? eventData.filter(
        (e) =>
          Math.abs(e.lat - queryPoint[0]) < 0.01 &&
          Math.abs(e.lng - queryPoint[1]) < 0.01
      )
    : [];

  return (
    <>
      {markers}

      {queryPoint && (
        <CircleMarker
          center={queryPoint}
          radius={10}
          pathOptions={{ color: 'red' }}
        >
          <Tooltip direction="top">Query Location</Tooltip>
        </CircleMarker>
      )}

      {nearbyEvents.map((event, idx) => (
        <Marker key={`event-${idx}`} position={[event.lat, event.lng]}>
          <Popup>
            <b>{event.type}</b> <br />
            Date: {event.time}
          </Popup>
        </Marker>
      ))}
    </>
  );
};
