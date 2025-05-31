import React from 'react';
import {
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  CircleMarker,
  Tooltip,
  FeatureGroup,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { Item } from '../types';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getColor, createColoredIcon } from '../utils/colorUtils';
import { fetchNearbyFamilies, fetchNearbyEvents } from '../api/api';

interface LocationData {
  family_id: number;
  friendly_name: string;
  herd_id: number;
  species_name?: string;
  time_bucket: string;
  avg_size?: number;
  avg_health?: number;
  avg_lat?: number;
  avg_lng?: number;
}

interface MapViewProps {
  locationData: LocationData[];
  selectedItems: Item[];
  filteredFamilies: LocationData[];
  onLocationQuery: (coords: [number, number]) => void;
  onFilteredFamiliesChange: (newFiltered: LocationData[]) => void;
}
interface NearbyEvent {
  id: number;
  family_id: number;
  description: string;
  latitude: number;
  longitude: number;
  ts: string;
  event_metadata: any;
}


export const MapView = ({
  locationData,
  selectedItems,
  filteredFamilies,
  onLocationQuery,
  onFilteredFamiliesChange,
}: MapViewProps) => {
  const [queryPoint, setQueryPoint] = React.useState<[number, number] | null>(null);
  const [nearbyFamilies, setNearbyFamilies] = React.useState<LocationData[]>([]);
  const [nearbyEvents, setNearbyEvents] = React.useState<NearbyEvent[]>([]);  // NEW: nearby events

  useMapEvents({
    click(e) {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      setQueryPoint(coords);
      onLocationQuery(coords);
    },
  });

  React.useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, []);

  const activeHerdIds = selectedItems
    .filter((item) => item.type === 'herd' && item.active)
    .map((item) => item.id);

  const activeFamilyIds = selectedItems
    .filter((item) => item.type === 'family' && item.active)
    .map((item) => item.id);

  const filteredLocationData =
    activeFamilyIds.length > 0
      ? locationData.filter((loc) => activeFamilyIds.includes(loc.family_id))
      : activeHerdIds.length > 0
        ? locationData.filter((loc) => activeHerdIds.includes(loc.herd_id))
        : locationData;

  const familyGroups: Record<number, LocationData[]> = {};
  filteredLocationData.forEach((loc) => {
    if (!familyGroups[loc.family_id]) familyGroups[loc.family_id] = [];
    familyGroups[loc.family_id].push(loc);
  });

  Object.values(familyGroups).forEach((arr) =>
    arr.sort((a, b) => new Date(a.time_bucket).getTime() - new Date(b.time_bucket).getTime())
  );

  const markers = [];
  const polylines = [];

  for (const [familyIdStr, familyLocations] of Object.entries(familyGroups)) {
    const familyId = Number(familyIdStr);
    const color = getColor(familyId);

    const polylinePositions = familyLocations
      .map((loc) =>
        loc.avg_lat !== undefined && loc.avg_lng !== undefined
          ? [loc.avg_lat, loc.avg_lng]
          : null
      )
      .filter((pos): pos is [number, number] => pos !== null);

    if (polylinePositions.length > 1) {
      polylines.push(
        <Polyline
          key={`polyline-${familyId}`}
          positions={polylinePositions}
          pathOptions={{ color, weight: 3, opacity: 0.7 }}
        />
      );
    }

    familyLocations.forEach((loc, idx) => {
      if (loc.avg_lat === undefined || loc.avg_lng === undefined) return;

      markers.push(
        <Marker
          key={`${loc.family_id}-${loc.time_bucket}`}
          position={[loc.avg_lat, loc.avg_lng]}
          icon={createColoredIcon(familyId, idx + 1)}
        >
          <Popup>
            <b>{loc.friendly_name}</b> ({loc.species_name || 'Unknown'}) <br />
            Date: {new Date(loc.time_bucket).toLocaleString()} <br />
            Size: {loc.avg_size ?? 'N/A'} <br />
            Health: {loc.avg_health ?? 'N/A'} <br />
            Lat: {loc.avg_lat}, Lng: {loc.avg_lng} <br />
            <i>Point #{idx + 1}</i>
          </Popup>
        </Marker>
      );
    });
  }

  const handleShapeCreated = async (e: any) => {
    if (e.layerType === 'circle') {
      const layer = e.layer;
      const center = layer.getLatLng();
      const radiusMeters = layer.getRadius();
      const radiusKm = radiusMeters / 1000;

      try {
        // Fetch nearby families
        let data = await fetchNearbyFamilies(center.lat, center.lng, radiusKm);
        data = nearbyFamilies.concat(data);
        setNearbyFamilies(data);
        onFilteredFamiliesChange(data);

        // Fetch nearby events
        let eventsData = await fetchNearbyEvents(center.lat, center.lng, radiusKm);
        eventsData = nearbyEvents.concat(eventsData);
        setNearbyEvents(eventsData);

      } catch (error) {
        console.error('Failed to fetch nearby data:', error);
      }
    }
  };

  const handleShapeDeleted = () => {
    setNearbyFamilies([]);
    setNearbyEvents([]);  // Also clear events on delete
    onFilteredFamiliesChange([]);
  };

  // Markers for nearby families
  const nearbyMarkers = nearbyFamilies.map((loc, idx) => (
    loc.avg_lat !== undefined &&
    loc.avg_lng !== undefined && (
      <Marker
        key={`nearby-${loc.family_id}-${loc.time_bucket}`}
        position={[loc.avg_lat, loc.avg_lng]}
        icon={createColoredIcon('blue', idx + 1)}
      >
        <Popup>
          <b>{loc.friendly_name}</b> ({loc.species_name || 'Unknown'}) <br />
          Date: {new Date(loc.time_bucket).toLocaleString()} <br />
          Size: {loc.avg_size ?? 'N/A'} <br />
          Health: {loc.avg_health ?? 'N/A'} <br />
          <i>Nearby Search Result</i>
        </Popup>
      </Marker>
    )
  ));

  // Markers for nearby events (NEW)
  const nearbyEventMarkers = nearbyEvents.map((event) => (
    <Marker
      key={`event-${event.id}`}
      position={[event.latitude, event.longitude]}
      icon={createColoredIcon(5, 'E')}  // Different color and no label for events
    >
      <Popup>
        <b>Event</b> <br />
        {event.description} <br />
        Family ID: {event.family_id} <br />
        Family Name: {filteredFamilies.find(f => f.family_id === event.family_id)?.friendly_name || 'Requires Query Update'} <br />
        Herd ID: {event.event_metadata?.herd_id || 'N/A'} <br />
        Species Name: {filteredFamilies.find(f => f.family_id === event.family_id)?.species_name || 'Requires Query Update'} <br />
        Date: {new Date(event.ts).toLocaleString()}
      </Popup>
    </Marker>
  ));

  return (
    <>
      <FeatureGroup>
        <EditControl
          position="bottomleft"
          onCreated={handleShapeCreated}
          onDeleted={handleShapeDeleted}
          draw={{
            rectangle: false,
            polygon: false,
            polyline: false,
            marker: false,
            circlemarker: false,
            circle: {
              shapeOptions: {
                color: 'blue',
                weight: 2,
              },
            },
          }}
        />
      </FeatureGroup>

      {markers}
      {polylines}
      {nearbyMarkers}
      {nearbyEventMarkers} {/* New event markers */}

      {queryPoint && (
        <CircleMarker center={queryPoint} radius={10} pathOptions={{ color: 'red' }}>
          <Tooltip direction="top">Query Location</Tooltip>
        </CircleMarker>
      )}
    </>
  );
};
