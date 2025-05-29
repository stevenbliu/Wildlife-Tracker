// src/components/FamilySelector.tsx
import React from 'react';

interface FamilySelectorProps {
  herd: string | null;
  selected: string | null;
  onChange: (family: string | null) => void;
}

// Dummy families per herd
const familyData: Record<string, string[]> = {
  Elephants: ['Alpha', 'Bravo'],
  Zebras: ['Stripey', 'Dash'],
  Lions: ['Simba', 'Nala'],
};

export const FamilySelector = ({ herd, selected, onChange }: FamilySelectorProps) => {
  const families = herd ? familyData[herd] || [] : [];

  return (
    <div>
      <label className="block text-sm font-medium">Family</label>
      <select
        className="mt-1 block w-full border-gray-300 rounded"
        value={selected || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={!herd}
      >
        <option value="">-- Select Family --</option>
        {families.map((family) => (
          <option key={family} value={family}>
            {family}
          </option>
        ))}
      </select>
    </div>
  );
};
