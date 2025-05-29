// src/components/FamilyStatsChart.tsx
import React from 'react';

interface FamilyStatsChartProps {
  family: string | null;
  time: string;
}

export const FamilyStatsChart = ({ family, time }: FamilyStatsChartProps) => {
  if (!family) {
    return <p>Select a family to see stats.</p>;
  }

  // Dummy data
  return (
    <div>
      <h3 className="font-bold">Stats for {family} on {time}</h3>
      <ul className="list-disc pl-5">
        <li>Distance moved: 5.3 km</li>
        <li>Water sources visited: 2</li>
        <li>Interaction events: 4</li>
      </ul>
    </div>
  );
};
