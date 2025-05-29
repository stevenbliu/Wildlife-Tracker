import axios from 'axios';

const API_BASE = 'http://localhost:8000/api'; // adjust to your backend base URL

export async function fetchHerds() {
  const res = await axios.get(`${API_BASE}/herds`);
  return res.data;
}

export async function fetchFamilies() {
  const res = await axios.get(`${API_BASE}/families`);
  return res.data;
}

export async function fetchFamiliesByHerd(herdId: string) {
  const res = await axios.get(`${API_BASE}/herds/${herdId}/families`);
  return res.data;
}

export async function fetchHerdPaths(herdId: string) {
  const res = await axios.get(`${API_BASE}/herds/${herdId}/paths`);
  return res.data;
}

export async function fetchFamilyTrack(familyId: string) {
  const res = await axios.get(`${API_BASE}/families/${familyId}/track`);
  return res.data;
}

export async function fetchFamiliesNearby(lat: number, lng: number, radius: number) {
  const res = await axios.get(`${API_BASE}/families/nearby`, {
    params: { lat, lng, radius },
  });
  return res.data;
}

export async function fetchEventsNearby(lat: number, lng: number, radius: number) {
  const res = await axios.get(`${API_BASE}/events/nearby`, {
    params: { lat, lng, radius },
  });
  return res.data;
}
