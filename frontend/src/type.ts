export interface LocationDataPoint {
  time_bucket: string;
  family_id: number;
  friendly_name: string;
  herd_id: number;
  species_name: string;
  avg_lat: number;
  avg_lng: number;
}

type Herd = { id: number; species_name: string };
type Family = { id: number; friendly_name: string; herd_id: number };
type Item = { type: 'herd' | 'family'; id: number; name: string; active: boolean };
