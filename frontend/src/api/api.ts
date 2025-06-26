import axios from 'axios';

export async function fetchHerds() {
  // const res = await axios.get('http://localhost:8000/api/herds');
  const res = await axios.get('/api/herds');

  return res.data;
}

export async function fetchFamilies() {
  // const res = await axios.get('http://localhost:8000/api/families');
  const res = await axios.get('/api/families');

  return res.data;
}

export async function fetchLocationData({
  entityType,
  entityIds,
  metrics,
  bucket,
}: {
  entityType: string;
  entityIds: string;
  metrics: string;
  bucket: string;
}) {
  const params = {
    entity_type: entityType,
    entity_id: entityIds,
    metrics,
    bucket,
  };
  const res = await axios.get('/api/overtime', { params });
  return res.data;
}

export async function fetchNearbyFamilies(lat: number, lng: number, radiusKm: number) {
  // const res = await axios.get('http://localhost:8000/api/nearby/families', {
  const res = await axios.get('/api/nearby/families', {

    params: { lat, lng, radius_km: radiusKm }
  });
  return res.data;
}

export async function fetchNearbyEvents(lat: number, lng: number, radiusKm: number) {
  // const res = await axios.get('http://localhost:8000/api/events/nearby', {
    const res = await axios.get('/api/events/nearby', {

    params: { lat, lng, radius_km: radiusKm }
  });
  return res.data;
}