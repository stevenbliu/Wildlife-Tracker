import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type DataPoint = {
  timestamp: string;
  size: number;
  health: number;
};

type Props = {
  data: DataPoint[];
};

export default function MetricsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="size" stroke="#8884d8" />
        <Line type="monotone" dataKey="health" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
