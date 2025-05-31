import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type FamilyOption = { value: number; label: string };

type LocationDataPoint = {
  time_bucket: string;
  [key: string]: any;
};

type Props = {
  data: LocationDataPoint[];
  selectedFamilies: FamilyOption[];
  metrics: string[];
  colorMap: Record<number, string>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

const COLORS = ['#8884d8', '#82ca9d', '#ff7300', '#0088FE', '#00C49F', '#FFBB28'];

export default function LineCharts({
  data,
  selectedFamilies,
  metrics,
  colorMap,
  loading,
  error,
  onRetry,
}: Props) {
  if (loading) return <p>Loading data...</p>;
  if (error)
    return (
      <div>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  if (data.length === 0) return <p>No data to display</p>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time_bucket"
          interval="preserveStartEnd"
          tickFormatter={(t) => new Date(t).toLocaleTimeString()}
          height={60}
          angle={-45}
          textAnchor="end"
        />
        <YAxis />
        <Tooltip />
        <Legend />
        {selectedFamilies.map((family) =>
          metrics.includes('size') ? (
            <Line
              key={`size-${family.value}`}
              type="monotone"
              dataKey={`avg_size_${family.value}`}
              stroke={colorMap[family.value] ?? COLORS[0]}
              name={`${family.label} Size`}
              dot={false}
            />
          ) : null
        )}
        {selectedFamilies.map((family) =>
          metrics.includes('health') ? (
            <Line
              key={`health-${family.value}`}
              type="monotone"
              dataKey={`avg_health_${family.value}`}
              stroke={colorMap[family.value] ?? COLORS[0]}
              strokeDasharray="5 5"
              name={`${family.label} Health`}
              dot={false}
            />
          ) : null
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
