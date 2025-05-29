import React, { useEffect, useState } from 'react';
import { fetchFamilies, fetchFamiliesByHerd } from '../api/wildlifeApi';

type Props = {
  herdId?: string;
  onSelect: (familyId: string) => void;
};

export default function FamilySelector({ herdId, onSelect }: Props) {
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (herdId) {
      fetchFamiliesByHerd(herdId).then(setFamilies);
    } else {
      fetchFamilies().then(setFamilies);
    }
  }, [herdId]);

  return (
    <select onChange={e => onSelect(e.target.value)} defaultValue="">
      <option value="" disabled>
        Select a Family
      </option>
      {families.map(family => (
        <option key={family.id} value={family.id}>
          {family.name}
        </option>
      ))}
    </select>
  );
}
