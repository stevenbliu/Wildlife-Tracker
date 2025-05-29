// src/components/HerdSelector.tsx
import React from 'react';

interface HerdSelectorProps {
  selected: string | null;
  onChange: (herd: string | null) => void;
}

const herds = ['Elephants', 'Zebras', 'Lions'];

export const HerdSelector = ({ selected, onChange }: HerdSelectorProps) => (
  <div>
    <label className="block text-sm font-medium">Herd</label>
    <select
      className="mt-1 block w-full border-gray-300 rounded"
      value={selected || ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">-- Select Herd --</option>
      {herds.map((herd) => (
        <option key={herd} value={herd}>
          {herd}
        </option>
      ))}
    </select>
  </div>
);
