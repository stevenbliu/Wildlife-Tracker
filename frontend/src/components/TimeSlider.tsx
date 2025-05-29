// src/components/TimeSlider.tsx
import React from 'react';

interface TimeSliderProps {
  value: string;
  onChange: (date: string) => void;
}

export const TimeSlider = ({ value, onChange }: TimeSliderProps) => {
  const min = '2020-01-01';
  const max = '2025-01-01';

  return (
    <div className="flex flex-col w-64">
      <label className="text-sm font-medium">Time: {value}</label>
      <input
        type="date"
        className="mt-1"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
